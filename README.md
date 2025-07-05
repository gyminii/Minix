# Miinix

**Miinix** is a personal “Google Drive”-style file manager with a built-in Pastebin feature—all powered by Next.js and Supabase. Instead of juggling separate snippets and files, you can upload documents, images, and code snippets into one unified interface.

---

## 🚀 Features

- **File & Folder Management**  
  Upload, rename, delete, and organize files and folders in a tree view.
- **Real-Time Updates**  
  Changes by any client (new uploads, renames, deletes) sync instantly via Supabase Realtime.
- **Pastebin Snippets**  
  Create, edit, and share code/text snippets directly—no extra files required.
- **Previews & Downloads**  
  Preview images and text files in-app, or download any file with a single click.
- **Google OAuth**  
  Sign in using Google for fast, password-free authentication.
- **Responsive UI**  
  Mobile-friendly layout with drag-and-drop uploads and a clean, modern design.

---

## 🔧 Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript  
- **UI Components:** Tailwind CSS, Shadcn/UI, Framer Motion  
- **Backend & Database:** Supabase (Auth, Storage, Postgres Realtime)  
- **Storage:** Supabase Storage buckets for files  
- **Auth:** Supabase Auth with Google OAuth  
- **Deployment:** Vercel (recommended) or any Node-friendly host

