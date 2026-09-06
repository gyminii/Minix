# Minix

Personal cloud storage and code snippet manager.
Upload files, organize them in folders, save code snippets with syntax highlighting.
Live at [minix.minii.dev](https://minix.minii.dev), running on Cloudflare Workers.

## Now on Cloudflare

Minix migrated off Supabase to Cloudflare on 2026-09-04; it now runs on Cloudflare Workers via OpenNext.
Auth moved from Supabase Auth to Clerk, using Google sign-in.
File and folder metadata moved from Postgres to Cloudflare D1.
File and paste bytes moved from Supabase Storage to Cloudflare R2.
Realtime sync was dropped; the client now refetches on window focus and polls every 30 seconds instead.
Signed URLs were replaced by token-based share links served directly by the Worker.

## Why I Built This

Wanted to test Supabase on something real. It's Postgres with auth, storage, and realtime subscriptions bolted on. I wanted to see how far that gets you before you start fighting it.

Also needed a place to dump code snippets that wasn't GitHub Gists or Pastebin.

## Tech Decisions

The sections below describe the original 2025 build on Supabase.

### Supabase

It's Postgres. Supabase wraps it with:

- **Auth**: JWT-based, supports OAuth providers.
- **Storage**: S3-compatible bucket storage with signed URLs.
- **Realtime**: websocket subscriptions to database changes. This is the interesting part.

You get a client library and a dashboard, and you don't have to set up a database server. For a side project where I don't want to manage infrastructure, that's enough.

The tradeoff is that you're locked into their patterns. Anything Supabase doesn't support out of the box means raw SQL or edge functions.

For Minix, it was the right call at the time. File metadata in Postgres, files in their storage bucket, auth handled.

### Row Level Security (RLS)

This is the part of Supabase I'd keep. Instead of checking `user_id` in every query, you define policies at the database level:

```sql
CREATE POLICY "Users can only see their own files"
ON files FOR SELECT
USING (auth.uid() = user_id);
```

Now a query can't leak another user's files. The database enforces it, and Supabase injects the user context automatically.

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

It works, but there is a visible delay between the upload and the other tab updating. Fine for a file manager.

### TanStack Query + Zustand

Supabase gives you data fetching, but you still need client-side state management. TanStack Query handles server state: caching, background refetches, optimistic updates. Zustand handles UI state: which folder is open, what's selected.

Could've used just one, but separating server data from UI state keeps things cleaner. When a realtime event arrives, I invalidate the relevant query and it refetches.

### Signed URLs for Downloads

Files are private in Supabase Storage. To download, you generate a signed URL with an expiration:

```typescript
const { data } = await supabase.storage
  .from('minix')
  .createSignedUrl(path, 3600) // expires in 1 hour
```

The URL works for anyone who has it, but only for an hour. Good enough for personal use. If I needed tighter control, I'd proxy downloads through an API route that checks auth first.

### Pastebin with Syntax Highlighting

Pastes are stored in Supabase Storage as text files, metadata in Postgres. The syntax field tells the frontend which grammar to load. Highlighting is `react-syntax-highlighter` with the Prism build and a language selector.

Expiring pastes were easy to add. An `expires_at` timestamp, and either a scheduled function that deletes expired rows or a filter in the queries that hides them. I went with the filter.

## Stuff I Learned

**RLS is powerful but annoying to debug.** When queries return empty, you don't get an error. You get silence. Took me a while to realize my policy was wrong, not my query.

**Supabase Storage paths are picky.** Leading slashes, trailing slashes, bucket name in the path or not. It differs between methods, so read the docs for each one.

**Optimistic UI needs rollback.** TanStack Query makes optimistic updates easy, but you have to handle the failure case. If the upload fails, the file shouldn't stay in the UI.

**PWA caching and realtime don't mix well.** The service worker caches the app shell, but the data is realtime. Had to be careful about what gets cached and what doesn't.

## Stack

| What | Why |
|------|-----|
| Next.js 16 on Cloudflare Workers (OpenNext) | App Router, server actions for mutations |
| Clerk | Auth, Google sign-in |
| Cloudflare D1 | File and folder metadata |
| Cloudflare R2 | File and paste bytes |
| TanStack Query | Server state, caching, optimistic updates |
| Zustand | UI state without boilerplate |
| Tailwind + shadcn/ui | Styling and accessible components |
| Framer Motion | Drag-and-drop animations |
| react-syntax-highlighter | Paste highlighting, Prism build |
