// OpenNext bakes every .env value into .open-next/cloudflare/next-env.mjs, which the Worker imports.
// Only build-time public values may ship; secrets are Worker secrets and reach process.env at runtime.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ALLOW = /^NEXT_PUBLIC_/;
// Value shapes only, never variable names: the server bundle legitimately contains
// `process.env.LIVEKIT_API_SECRET` and friends as literal property accesses.
const SECRET_PATTERNS = [
	/sk_(test|live)_[A-Za-z0-9]{16,}/, // Clerk secret key
];
const root = ".open-next";
const envFile = join(root, "cloudflare", "next-env.mjs");

const src = readFileSync(envFile, "utf8");
const out = src.replace(/export const (\w+) = (\{.*?\});/gs, (_, mode, json) => {
	const obj = JSON.parse(json);
	const kept = Object.fromEntries(Object.entries(obj).filter(([k]) => ALLOW.test(k)));
	return `export const ${mode} = ${JSON.stringify(kept)};`;
});
writeFileSync(envFile, out);

function walk(dir, hits) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, hits);
		else if (name === ".env" || name.startsWith(".env.")) continue;
		else {
			const text = readFileSync(p, "latin1");
			for (const re of SECRET_PATTERNS) if (re.test(text)) hits.push(`${p} (${re})`);
		}
	}
	return hits;
}
const hits = walk(root, []);
if (hits.length) {
	console.error("Secrets found in build output; refusing to continue:\n" + hits.join("\n"));
	process.exit(1);
}
console.log("baked env stripped to public keys; no secrets in build output");
