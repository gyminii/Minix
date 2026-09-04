# Supabase to Cloudflare migration

One-time migration of the old Supabase project (`zlstvdhqvdbmcadbnkti`) into D1 (`minix`) and R2 (`minix`).

## 1. Export from Supabase (read-only)

```
bun run scripts/migrate/export-supabase.ts [--out <dir>]
```

Reads `.env.supabase` for `SUPABASE_SERVICE_ROLE_KEY`, pages every row of `folders`, `files` and `pastes` into `<dir>/rows.json`, walks the whole `minix` bucket, downloads every object to `<dir>/objects/<key>`, and records key, size, content type and sha256 in `<dir>/objects.json`.
It then prints row counts, distinct user ids, object counts and bytes, and a reconciliation list of dangling rows and orphan objects.
The default `--out` is the session scratchpad export directory.

## 2. Import into Cloudflare

```
bun run scripts/migrate/import-to-cloudflare.ts --user-id <clerk user id> [--export-dir <dir>] [--remote] [--merge-users]
```

Row ids are preserved, every old Supabase `user_id` is rewritten to the given Clerk user id, folders are inserted parents-first, `files.key` becomes `files/<id>/<name>`, paste content is written to `pastes/<id>.txt`, and `updated_at` falls back to `created_at`.
Rows go in as `INSERT OR REPLACE` through `wrangler d1 execute` in batches of 50, so the script can be re-run safely.
Without `--remote` it targets the local D1 and R2 state under `.wrangler/`.

The importer refuses to run when the export contains more than one distinct `user_id`, which the current export does (see below); pass `--merge-users` to fold them all into the single `--user-id`.

## Prerequisites

The wrangler API token needs the R2 scope (`Workers R2 Storage:Edit`) in addition to D1, otherwise `wrangler r2 object put --remote` fails.
The real Clerk production user id is only known after the first sign-in on the Cloudflare deployment, so run the import after signing in once.
Run `bunx wrangler d1 migrations apply minix (--local|--remote)` before the first import so the tables exist.

## Known data issues

The `files` table has rows under two Supabase user ids (29 + 1); the second one owns a single file, `trickster.avif`.
The old `files` rows carry no `updated_at` value at all, so every imported file gets `updated_at = created_at`.
The bucket holds 20 objects that no row references (19 stale `files/` uploads and `pastes/Untitled Paste.txt`); they are exported but not imported.
The one surviving paste stored its content only under the old name-based key `pastes/Untitled Paste 2.txt`, which the importer rewrites to `pastes/<id>.txt`.
`wrangler r2 object put --local` percent-encodes keys before storing them, so a name containing a space lands under a key the Worker cannot read; this only affects the local rehearsal, since the remote path sends the key through the R2 REST API, and the importer prints any affected keys.
