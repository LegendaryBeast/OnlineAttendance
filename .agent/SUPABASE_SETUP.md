# Supabase Setup Guide

This backend has been migrated from MongoDB (Mongoose) to **Supabase** (Postgres + Supabase Auth + Supabase Storage for attendance photos, replacing Cloudinary), while continuing to run as an Express app on Vercel. Follow these steps to get it running.

> ⚠️ **Existing data**: This migration does not copy your existing MongoDB data or Cloudinary-hosted photos. Users, classes, courses, and attendance history in MongoDB will **not** appear in Supabase automatically, and old `imageUrl` values pointing at Cloudinary won't be moved to Supabase Storage (they'll keep working as long as your Cloudinary account exists, since we're not deleting anything there — just no longer uploading new photos to it). If you need any of this carried over, say so and we'll write a one-off migration script — otherwise this is a fresh start.

## 1. Create a Supabase project

1. Go to https://supabase.com/dashboard and sign in (or create an account).
2. Click **New project**.
3. Choose an organization, name the project (e.g. `digital-attendance`), set a strong database password (save it somewhere safe — you likely won't need it directly, but keep it), pick a region close to your users (e.g. Singapore for Bangladesh), and create the project.
4. Wait ~2 minutes for provisioning.

## 2. Get your API credentials

In the project dashboard: **Project Settings → API**.

You need three values:
- **Project URL** → `SUPABASE_URL`
- **anon public** key → `SUPABASE_ANON_KEY`
- **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep this secret — it bypasses all database security. Never put it in frontend code.)

Give these to me (or paste them straight into `backend/.env`, copied from `backend/.env.example`) and I'll wire them in / you can fill them in yourself:

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`backend/.env` is already gitignored, so this never gets committed.

## 3. Run the database schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Copy the entire contents of [backend/supabase/schema.sql](../backend/supabase/schema.sql) and run it.
3. This creates the `profiles`, `courses`, `classes`, `attendance`, and `cumulative_attendance` tables (replacing the old Mongoose models), one helper function for atomic attendance-count increments, and a public `attendance-photos` storage bucket (replacing Cloudinary).

You can re-run it safely later (uses `create table if not exists`), but it won't pick up column changes to tables that already exist.

### Storage bucket note

The `attendance-photos` bucket is created **public**, so uploaded photo URLs work as plain public links (same as Cloudinary's `secure_url` did) — anyone with the link can view a photo, but no one can list, upload, or delete without the `service_role` key, which only the backend has. If you'd rather photos not be publicly linkable at all, tell me and I'll switch it to a private bucket with signed, expiring URLs instead (slightly more backend code, no frontend impact).

## 4. Configure Google Sign-In in Supabase

Your frontend still uses the Google Identity Services button (One Tap-style), sending an ID token to `/api/auth/google`. The backend now hands that token to **Supabase Auth** (`signInWithIdToken`) instead of verifying it itself — Supabase creates/logs in the user directly.

1. In Supabase: **Authentication → Sign In / Providers → Google**.
2. Toggle it **on**.
3. Under **Client IDs**, add your existing Google OAuth Client ID:
   ```
   590867699522-0cobj67nq9m575n9h0enbvje0gs52nch.apps.googleusercontent.com
   ```
   (This is the same Client ID already used in `frontend/js/auth.js` and `frontend/index.html` — no new Google Cloud OAuth client needed.)
4. Supabase's dashboard may also ask for a **Client Secret** to fully enable the provider toggle, even though the ID-token sign-in flow itself doesn't strictly require one. If it does:
   - Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
   - Open your existing OAuth 2.0 Client ID (`SUST Digital Attendance Web` or similar).
   - Copy its **Client secret** (or generate one if it doesn't have one) and paste it into Supabase.
5. Save.

### What you do NOT need to change in Google Cloud Console

Because the frontend keeps using Google Identity Services directly (not a redirect-based OAuth flow), you do **not** need to add Supabase's callback URL to "Authorized redirect URIs", and the existing "Authorized JavaScript origins" (`http://localhost:5500`, your production frontend origin, etc.) stay exactly as they are.

## 5. Set environment variables

**Local development** — `backend/.env`:
```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3000
```

**Vercel** (production backend) — Project → Settings → Environment Variables:
- Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Remove the old `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SESSION_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — none of these are read by the backend anymore.
- Redeploy after saving (Vercel → Deployments → Redeploy, or push a commit).

## 6. Test locally

```bash
cd backend
npm install
npm run dev
```

Then, from `frontend/`, run your usual local server and test:
- Register a new account with a `@student.sust.edu` / `@sust.edu` email
- Log in with email/password
- Log in with Google (One Tap button on the login page)
- Create a class/course (as teacher), submit attendance (as student)
- Export attendance to Excel
- Confirm a non-SUST Google account is rejected

## 7. Deploy

Push to your normal branch — Vercel will redeploy the backend automatically (`backend/vercel.json` is unchanged). Frontend needs no changes or redeploy for this migration.
