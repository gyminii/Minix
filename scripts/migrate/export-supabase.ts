import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://zlstvdhqvdbmcadbnkti.supabase.co";
const BUCKET = "minix";
const TABLES = ["folders", "files", "pastes"] as const;
const PAGE_SIZE = 1000;
const LIST_PAGE_SIZE = 100;

const DEFAULT_OUT = String.raw`C:\Users\tyler\AppData\Local\Temp\claude\C--Users-tyler----Projects-Minix\e5ff7de0-3d22-4691-ab2c-c5d57e346a8b\scratchpad\export`;

type Table = (typeof TABLES)[number];

type Row = Record<string, unknown>;

type ObjectEntry = {
	key: string;
	size: number;
	contentType: string;
	sha256: string;
};

type StorageListEntry = {
	name: string;
	id: string | null;
	metadata: { size?: number; mimetype?: string } | null;
};

function parseArgs(argv: string[]) {
	let out = DEFAULT_OUT;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === "--out") {
			const value = argv[i + 1];
			if (!value) throw new Error("--out requires a path");
			out = value;
			i++;
		}
	}
	return { out: resolve(out) };
}

async function loadEnv(path: string) {
	const text = await readFile(path, "utf8");
	const env: Record<string, string> = {};
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		env[key] = value;
	}
	return env;
}

function authHeaders(serviceKey: string) {
	return {
		apikey: serviceKey,
		Authorization: `Bearer ${serviceKey}`,
	};
}

async function fetchTable(
	serviceKey: string,
	table: Table
): Promise<Row[]> {
	const rows: Row[] = [];
	for (let offset = 0; ; offset += PAGE_SIZE) {
		const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`;
		const res = await fetch(url, { headers: authHeaders(serviceKey) });
		if (!res.ok) {
			throw new Error(
				`GET ${table} failed: ${res.status} ${await res.text()}`
			);
		}
		const page = (await res.json()) as Row[];
		rows.push(...page);
		if (page.length < PAGE_SIZE) break;
	}
	return rows;
}

async function listPrefix(serviceKey: string, prefix: string) {
	const entries: StorageListEntry[] = [];
	for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
		const res = await fetch(
			`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`,
			{
				method: "POST",
				headers: {
					...authHeaders(serviceKey),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prefix,
					limit: LIST_PAGE_SIZE,
					offset,
					sortBy: { column: "name", order: "asc" },
				}),
			}
		);
		if (!res.ok) {
			throw new Error(
				`list "${prefix}" failed: ${res.status} ${await res.text()}`
			);
		}
		const page = (await res.json()) as StorageListEntry[];
		entries.push(...page);
		if (page.length < LIST_PAGE_SIZE) break;
	}
	return entries;
}

async function walkBucket(serviceKey: string) {
	const found: { key: string; size: number; mimetype: string }[] = [];
	const seenPrefixes = new Set<string>();
	const queue = [""];
	while (queue.length > 0) {
		const prefix = queue.shift()!;
		if (seenPrefixes.has(prefix)) continue;
		seenPrefixes.add(prefix);
		const entries = await listPrefix(serviceKey, prefix);
		for (const entry of entries) {
			if (entry.name === "" || entry.name === ".emptyFolderPlaceholder") {
				continue;
			}
			const key = prefix ? `${prefix}${entry.name}` : entry.name;
			if (entry.id === null || entry.metadata === null) {
				queue.push(`${key}/`);
			} else {
				found.push({
					key,
					size: entry.metadata.size ?? 0,
					mimetype: entry.metadata.mimetype ?? "application/octet-stream",
				});
			}
		}
	}
	return found;
}

async function downloadObject(serviceKey: string, key: string) {
	const encoded = key.split("/").map(encodeURIComponent).join("/");
	const res = await fetch(
		`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`,
		{ headers: authHeaders(serviceKey) }
	);
	if (!res.ok) {
		throw new Error(
			`download "${key}" failed: ${res.status} ${await res.text()}`
		);
	}
	return {
		bytes: Buffer.from(await res.arrayBuffer()),
		contentType: res.headers.get("content-type"),
	};
}

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(2)} ${units[unit]} (${bytes} bytes)`;
}

async function main() {
	const { out } = parseArgs(process.argv.slice(2));
	const env = await loadEnv(resolve(SCRIPT_DIR, "..", "..", ".env.supabase"));
	const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceKey) {
		throw new Error("SUPABASE_SERVICE_ROLE_KEY missing from .env.supabase");
	}

	await mkdir(out, { recursive: true });

	const rows = {} as Record<Table, Row[]>;
	for (const table of TABLES) {
		rows[table] = await fetchTable(serviceKey, table);
	}
	await writeFile(join(out, "rows.json"), JSON.stringify(rows, null, "\t"));

	const listed = await walkBucket(serviceKey);
	const objects: ObjectEntry[] = [];
	for (const item of listed) {
		const { bytes, contentType } = await downloadObject(serviceKey, item.key);
		const target = join(out, "objects", ...item.key.split("/"));
		await mkdir(dirname(target), { recursive: true });
		await writeFile(target, bytes);
		objects.push({
			key: item.key,
			size: bytes.length,
			contentType: item.mimetype || contentType || "application/octet-stream",
			sha256: createHash("sha256").update(bytes).digest("hex"),
		});
	}
	await writeFile(
		join(out, "objects.json"),
		JSON.stringify(objects, null, "\t")
	);

	const objectKeys = new Set(objects.map((o) => o.key));
	const referenced = new Set<string>();
	const missingFileObjects: string[] = [];
	for (const row of rows.files) {
		const path = String(row.path ?? "");
		if (objectKeys.has(path)) referenced.add(path);
		else missingFileObjects.push(`${String(row.id)}  path=${path}`);
	}
	const missingPasteObjects: string[] = [];
	for (const row of rows.pastes) {
		const byId = `pastes/${String(row.id)}.txt`;
		const byName = `pastes/${String(row.name)}.txt`;
		let hit = false;
		if (objectKeys.has(byId)) {
			referenced.add(byId);
			hit = true;
		}
		if (objectKeys.has(byName)) {
			referenced.add(byName);
			hit = true;
		}
		if (!hit) {
			missingPasteObjects.push(
				`${String(row.id)}  name=${String(row.name)}`
			);
		}
	}
	const orphanObjects = objects
		.map((o) => o.key)
		.filter((key) => !referenced.has(key));

	const totalBytes = objects.reduce((sum, o) => sum + o.size, 0);

	console.log("=== Supabase export summary ===");
	console.log(`output dir: ${out}`);
	console.log("");
	console.log("rows:");
	for (const table of TABLES) {
		const users = new Set(rows[table].map((r) => String(r.user_id)));
		console.log(
			`  ${table}: ${rows[table].length} rows, ${users.size} distinct user_id(s)`
		);
		for (const user of [...users].sort()) console.log(`      ${user}`);
	}
	console.log("");
	console.log("objects:");
	console.log(`  count: ${objects.length}`);
	console.log(`  total: ${formatBytes(totalBytes)}`);
	const prefixes = new Map<string, number>();
	for (const o of objects) {
		const prefix = o.key.includes("/") ? `${o.key.split("/")[0]}/` : "(root)";
		prefixes.set(prefix, (prefixes.get(prefix) ?? 0) + 1);
	}
	for (const [prefix, count] of [...prefixes].sort()) {
		console.log(`  ${prefix}: ${count}`);
	}
	console.log("");
	console.log("reconciliation:");
	console.log(`  file rows with no object at path: ${missingFileObjects.length}`);
	for (const line of missingFileObjects) console.log(`      ${line}`);
	console.log(`  paste rows with no content object: ${missingPasteObjects.length}`);
	for (const line of missingPasteObjects) console.log(`      ${line}`);
	console.log(`  objects referenced by no row: ${orphanObjects.length}`);
	for (const line of orphanObjects) console.log(`      ${line}`);
}

await main();
