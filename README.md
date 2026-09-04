# Minix

Personal cloud storage + code snippet manager.
Think Google Drive meets Pastebin.
Upload files, organize them in folders, save code snippets with syntax highlighting.
Live at [minix.minii.dev](https://minix.minii.dev), running on Cloudflare Workers.

## Now on Cloudflare

Minix migrated off Supabase to Cloudflare on 2026-09-04; it now runs on Cloudflare Workers via OpenNext.
Auth moved from Supabase Auth to Clerk, using Google sign-in.
File and folder metadata moved from Postgres to Cloudflare D1.
File and paste bytes moved from Supabase Storage to Cloudflare R2.
Realtime sync was dropped; the client now refetches on window focus and polls every 30 seconds instead.
Signed URLs were replaced by token-based share links served directly by the Worker.
See `scripts/migrate/README.md` for the export and import scripts used to move the data.

## Why I Built This

Wanted to test the Supabase hype. Everyone talks about it like it's magic, but at the end of the day it's Postgres with some services bolted on — auth, storage, realtime subscriptions. I wanted to see how far that abstraction actually gets you before you start fighting it.

Also needed a place to dump code snippets that wasn't GitHub Gists (too slow) or Pastebin (ads everywhere).

## Tech Decisions

The sections below describe the original 2025 build on Supabase.

### Supabase — The Honest Take

It's Postgres. That's it. Supabase wraps Postgres with:

- **Auth** — JWT-based, supports OAuth providers. Works fine.
- **Storage** — S3-compatible bucket storage with signed URLs. Nothing special.
- **Realtime** — Websocket subscriptions to database changes. This is the interesting part.

The DX is good. You get a client library, a dashboard, and you don't have to set up a database server. For a side project where I don't want to manage infrastructure, it's convenient.

The tradeoff: you're locked into their patterns. Want to do something Supabase doesn't support out of the box? You're writing raw SQL or edge functions. The "magic" disappears fast when you go off the happy path.

For Minix, it was the right call. File metadata in Postgres, files in their storage bucket, auth handled. I didn't have to set up anything myself.

### Row Level Security (RLS)

This is where Supabase actually shines. Instead of checking `user_id` in every query, you define policies at the database level:

```sql
CREATE POLICY "Users can only see their own files"
ON files FOR SELECT
USING (auth.uid() = user_id);
```

Now it's impossible to accidentally leak another user's files. The database enforces it. Queries just work — Supabase injects the user context automatically.

Took some getting used to. When a query returns nothing and you expected data, it's either a bug or your RLS policy is blocking it. Debugging is less obvious than a simple `WHERE user_id = ?`.

### Realtime for Sync

When you upload a file on your phone, it should appear on your desktop without refreshing. Supabase Realtime subscribes to table changes over websockets.

```typescript
supabase
  .channel('files')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, 
    (payload) => { /* update local state */ }
  )
  .subscribe()
```

It works, but it's not instant-instant. There's a delay — maybe 100-300ms. Fine for a file manager, wouldn't use it for a multiplayer game.

### TanStack Query + Zustand

Supabase gives you data fetching, but you still need client-side state management. TanStack Query handles server state — caching, background refetches, optimistic updates. Zustand handles UI state — which folder is open, what's selected.

Could've used just one, but separating "data from the server" from "ephemeral UI state" keeps things cleaner. TanStack Query's cache invalidation plays nice with Supabase Realtime — when I get a realtime event, I invalidate the relevant query and it refetches.

### Signed URLs for Downloads

Files are private in Supabase Storage. To download, you generate a signed URL with an expiration:

```typescript
const { data } = await supabase.storage
  .from('minix')
  .createSignedUrl(path, 3600) // expires in 1 hour
```

The URL works for anyone who has it, but only for an hour. Good enough for personal use. If I needed tighter control, I'd proxy downloads through an API route that checks auth first.

### Pastebin with Syntax Highlighting

Pastes are stored in Supabase Storage as text files, metadata in Postgres. The syntax field tells the frontend which highlighter to use. Nothing fancy — just Prism.js with a language selector.

Expiring pastes were easy to add. A `expires_at` timestamp, and a cron job (Supabase has scheduled functions) that deletes expired rows. Or you can just filter them out in queries and let them pile up. I went with the lazy approach.

## Stuff I Learned

**RLS is powerful but annoying to debug** — When queries return empty, you don't get an error. You get silence. Took me a while to realize my policy was wrong, not my query.

**Supabase Storage paths are picky** — Leading slashes, trailing slashes, bucket names in the path or not — inconsistent across different methods. Read the docs carefully.

**Optimistic UI needs rollback** — TanStack Query makes optimistic updates easy, but you have to handle the failure case. If the upload fails, the file shouldn't stay in the UI.

**PWA caching and realtime don't mix well** — Service worker caches the app shell, but the data is realtime. Had to be careful about what gets cached and what doesn't.

## Stack

| What | Why |
|------|-----|
| Next.js 16 on Cloudflare Workers (OpenNext) | App Router, server actions for mutations |
| Clerk | Auth, Google sign-in |
| Cloudflare D1 | File and folder metadata |
| Cloudflare R2 | File and paste bytes |
| TanStack Query | Server state, caching, optimistic updates |
| Zustand | UI state without boilerplate |
| Tailwind + shadcn/ui | Fast styling, accessible components |
| Framer Motion | Smooth animations for drag-and-drop |
