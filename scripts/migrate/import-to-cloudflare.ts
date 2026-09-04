import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DATABASE = "minix";
const BUCKET = "minix";
const BATCH_SIZE = 50;
const PROJECT_ROOT = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	".."
);

const DEFAULT_EXPORT_DIR = String.raw`C:\Users\tyler\AppData\Local\Temp\claude\C--Users-tyler----Projects-Minix\e5ff7de0-3d22-4691-ab2c-c5d57e346a8b\scratchpad\export`;

type OldFolder = {
	id: string;
	name: string;
	parent_id: string | null;
	user_id: string;
	created_at: string;
};

type OldFile = {
	id: string;
	name: string;
	path: string;
	size: number;
	type: string;
	folder_id: string | null;
	user_id: string;
	created_at: string;
	updated_at?: string | null;
};

type OldPaste = {
	id: string;
	name: string;
	syntax: string | null;
	folder_id: string | null;
	expires_at: string | null;
	user_id: string;
	created_at: string;
	updated_at?: string | null;
};

type Export = { folders: OldFolder[]; files: OldFile[]; pastes: OldPaste[] };

type ObjectEntry = { key: string; size: number; contentType: string };

type Options = {
	userId: string;
	exportDir: string;
	remote: boolean;
	mergeUsers: boolean;
};

function parseArgs(argv: string[]): Options {
	let userId = "";
	let exportDir = DEFAULT_EXPORT_DIR;
	let remote = false;
	let mergeUsers = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--user-id") {
			userId = argv[++i] ?? "";
		} else if (arg === "--export-dir") {
			exportDir = argv[++i] ?? "";
		} else if (arg === "--remote") {
			remote = true;
		} else if (arg === "--merge-users") {
			mergeUsers = true;
		} else {
			throw new Error(`unknown argument: ${arg}`);
		}
	}
	if (!userId) throw new Error("--user-id <clerk user id> is required");
	if (!exportDir) throw new Error("--export-dir requires a path");
	return { userId, exportDir: resolve(exportDir), remote, mergeUsers };
}

function quote(value: string | null) {
	if (value === null) return "NULL";
	return `'${value.replace(/'/g, "''")}'`;
}

function orderFoldersParentsFirst(folders: OldFolder[]) {
	const byId = new Map(folders.map((f) => [f.id, f]));
	const ordered: OldFolder[] = [];
	const placed = new Set<string>();
	const visiting = new Set<string>();
	const visit = (folder: OldFolder) => {
		if (placed.has(folder.id)) return;
		if (visiting.has(folder.id)) {
			throw new Error(`folder cycle at ${folder.id}`);
		}
		visiting.add(folder.id);
		const parent = folder.parent_id ? byId.get(folder.parent_id) : undefined;
		if (parent) visit(parent);
		visiting.delete(folder.id);
		placed.add(folder.id);
		ordered.push(folder);
	};
	for (const folder of folders) visit(folder);
	return ordered;
}

function runWrangler(args: string[]) {
	return new Promise<string>((resolveRun, rejectRun) => {
		const proc = spawn(
			process.execPath,
			["x", "wrangler", "--cwd", PROJECT_ROOT, ...args],
			{ windowsHide: true }
		);
		let stdout = "";
		let stderr = "";
		proc.stdout.on("data", (chunk) => (stdout += chunk));
		proc.stderr.on("data", (chunk) => (stderr += chunk));
		proc.on("error", rejectRun);
		proc.on("close", (code) => {
			if (code === 0) resolveRun(stdout);
			else {
				rejectRun(
					new Error(
						`wrangler ${args.join(" ")} failed (${code})\n${stdout}\n${stderr}`
					)
				);
			}
		});
	});
}

async function executeSqlFile(file: string, remote: boolean) {
	await runWrangler([
		"d1",
		"execute",
		DATABASE,
		remote ? "--remote" : "--local",
		"--yes",
		"--file",
		file,
	]);
}

async function countRows(table: string, remote: boolean) {
	const stdout = await runWrangler([
		"d1",
		"execute",
		DATABASE,
		remote ? "--remote" : "--local",
		"--yes",
		"--json",
		"--command",
		`SELECT COUNT(*) AS n FROM ${table}`,
	]);
	const start = stdout.indexOf("[");
	const parsed = JSON.parse(stdout.slice(start)) as {
		results: { n: number }[];
	}[];
	return parsed[0].results[0].n;
}

async function putObject(
	key: string,
	file: string,
	contentType: string,
	remote: boolean
) {
	await runWrangler([
		"r2",
		"object",
		"put",
		`${BUCKET}/${key}`,
		"--file",
		file,
		"--content-type",
		contentType,
		remote ? "--remote" : "--local",
	]);
}

async function writeBatches(
	dir: string,
	name: string,
	statements: string[],
	remote: boolean
) {
	for (let i = 0; i < statements.length; i += BATCH_SIZE) {
		const batch = statements.slice(i, i + BATCH_SIZE);
		const file = join(dir, `${name}-${i / BATCH_SIZE}.sql`);
		await writeFile(file, `${batch.join("\n")}\n`);
		await executeSqlFile(file, remote);
	}
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const rows = JSON.parse(
		await readFile(join(options.exportDir, "rows.json"), "utf8")
	) as Export;
	const objects = JSON.parse(
		await readFile(join(options.exportDir, "objects.json"), "utf8")
	) as ObjectEntry[];
	const objectsByKey = new Map(objects.map((o) => [o.key, o]));

	const oldUsers = new Set<string>();
	for (const row of [...rows.folders, ...rows.files, ...rows.pastes]) {
		oldUsers.add(row.user_id);
	}
	if (oldUsers.size > 1 && !options.mergeUsers) {
		console.error(
			`export contains ${oldUsers.size} distinct user_ids; refusing to import.`
		);
		for (const user of [...oldUsers].sort()) console.error(`  ${user}`);
		console.error(
			"re-run with --merge-users to fold them all into --user-id."
		);
		process.exit(1);
	}

	const sqlDir = join(options.exportDir, "sql");
	await rm(sqlDir, { recursive: true, force: true });
	await mkdir(sqlDir, { recursive: true });

	const folderStatements = orderFoldersParentsFirst(rows.folders).map(
		(folder) =>
			`INSERT OR REPLACE INTO folders (id, user_id, name, parent_id, created_at) VALUES (${quote(
				folder.id
			)}, ${quote(options.userId)}, ${quote(folder.name)}, ${quote(
				folder.parent_id
			)}, ${quote(folder.created_at)});`
	);

	const uploads: { key: string; source: string; contentType: string }[] = [];
	const missingFileObjects: string[] = [];
	const fileStatements = rows.files.map((file) => {
		const key = `files/${file.id}/${file.name}`;
		const object = objectsByKey.get(file.path);
		if (object) {
			uploads.push({
				key,
				source: join(options.exportDir, "objects", ...file.path.split("/")),
				contentType: file.type || object.contentType,
			});
		} else {
			missingFileObjects.push(`${file.id} (${file.path})`);
		}
		return `INSERT OR REPLACE INTO files (id, user_id, name, key, size, type, folder_id, created_at, updated_at) VALUES (${quote(
			file.id
		)}, ${quote(options.userId)}, ${quote(file.name)}, ${quote(key)}, ${
			file.size
		}, ${quote(file.type)}, ${quote(file.folder_id)}, ${quote(
			file.created_at
		)}, ${quote(file.updated_at || file.created_at)});`;
	});

	const missingPasteObjects: string[] = [];
	const pasteStatements = rows.pastes.map((paste) => {
		const key = `pastes/${paste.id}.txt`;
		const source =
			objectsByKey.get(key) ?? objectsByKey.get(`pastes/${paste.name}.txt`);
		if (source) {
			uploads.push({
				key,
				source: join(options.exportDir, "objects", ...source.key.split("/")),
				contentType: "text/plain",
			});
		} else {
			missingPasteObjects.push(`${paste.id} (${paste.name})`);
		}
		return `INSERT OR REPLACE INTO pastes (id, user_id, name, syntax, folder_id, expires_at, created_at, updated_at) VALUES (${quote(
			paste.id
		)}, ${quote(options.userId)}, ${quote(paste.name)}, ${quote(
			paste.syntax || "plaintext"
		)}, ${quote(paste.folder_id)}, ${quote(paste.expires_at)}, ${quote(
			paste.created_at
		)}, ${quote(paste.updated_at || paste.created_at)});`;
	});

	await writeBatches(sqlDir, "folders", folderStatements, options.remote);
	await writeBatches(sqlDir, "files", fileStatements, options.remote);
	await writeBatches(sqlDir, "pastes", pasteStatements, options.remote);

	for (const upload of uploads) {
		await putObject(
			upload.key,
			upload.source,
			upload.contentType,
			options.remote
		);
	}

	console.log("=== import summary ===");
	console.log(`target: ${options.remote ? "remote" : "local"}`);
	console.log(`clerk user id: ${options.userId}`);
	console.log(`old user ids folded in: ${[...oldUsers].sort().join(", ")}`);
	console.log(`folders inserted: ${folderStatements.length}`);
	console.log(`files inserted: ${fileStatements.length}`);
	console.log(`pastes inserted: ${pasteStatements.length}`);
	console.log(`objects uploaded: ${uploads.length}`);
	if (missingFileObjects.length > 0) {
		console.log(`file rows with no exported object: ${missingFileObjects.length}`);
		for (const line of missingFileObjects) console.log(`  ${line}`);
	}
	if (missingPasteObjects.length > 0) {
		console.log(
			`paste rows with no exported content: ${missingPasteObjects.length}`
		);
		for (const line of missingPasteObjects) console.log(`  ${line}`);
	}

	if (!options.remote) {
		const mangled = uploads
			.map((u) => u.key)
			.filter((key) => new URL(`http://localhost/${key}`).pathname.slice(1) !== key);
		if (mangled.length > 0) {
			console.log(
				`keys stored percent-encoded by wrangler local mode: ${mangled.length}`
			);
			for (const key of mangled) console.log(`  ${key}`);
		}
	}

	console.log("");
	console.log("verification (SELECT COUNT(*)):");
	for (const table of ["folders", "files", "pastes"]) {
		console.log(`  ${table}: ${await countRows(table, options.remote)}`);
	}
}

await main();
