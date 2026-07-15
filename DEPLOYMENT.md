# Deployment Guide: Supabase + Vercel

This guide outlines the step-by-step process to deploy the **Digital Attendance System** using **Supabase** for database, auth, and storage, and **Vercel** for hosting the separate backend and frontend.

---

## 🛠️ Step 1: Set up Supabase

### 1. Create a Supabase Project
1. Sign in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project** and select your organization.
3. Configure the project:
   - **Name**: e.g., `digital-attendance`
   - **Database Password**: Set a secure password and save it.
   - **Region**: Choose a region close to your user base.
4. Click **Create new project** and wait a few minutes for provisioning.

### 2. Retrieve API Keys
Once the project is ready, navigate to **Project Settings → API** in the sidebar. Copy the following keys (you will need them in Step 2):
* **Project URL** (`SUPABASE_URL`)
* **anon public** (`SUPABASE_ANON_KEY`)
* **service_role secret** (`SUPABASE_SERVICE_ROLE_KEY`) — *Keep this secure!*

### 3. Run the Database Schema
1. In the Supabase sidebar, open **SQL Editor**.
2. Click **New query**.
3. Copy the entire contents of [backend/supabase/schema.sql](backend/supabase/schema.sql) and paste them into the SQL editor.
4. Click **Run**. This establishes the tables (`profiles`, `courses`, `classes`, `attendance`, `cumulative_attendance`) and automatically creates a public storage bucket named `attendance-photos` for class photos.

### 4. Enable Google Sign-In (Optional)
If you want to use the Google One Tap login feature:
1. Navigate to **Authentication → Provider → Google** in the Supabase sidebar.
2. Toggle it **ON**.
3. Under **Client IDs**, add your Google OAuth Client ID:
   ```
   590867699522-0cobj67nq9m575n9h0enbvje0gs52nch.apps.googleusercontent.com
   ```
4. Enter the corresponding **Client Secret** (retrievable from your Google Cloud Console credentials page).
5. Save the configuration.

---

## 🚀 Step 2: Deploy the Backend to Vercel

Since this is a split frontend/backend monorepo, we will deploy them as two separate Vercel projects pointing to the same Git repository.

### 1. Create a New Project on Vercel
1. Go to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New... → Project**.
3. Import your Git repository containing this code.

### 2. Configure Backend Settings
1. Name the project (e.g., `attendance-api-backend`).
2. Next to **Root Directory**, click **Edit** and select the `backend` folder.
3. Keep the **Framework Preset** as **Other** (Vercel will detect `vercel.json` and build the serverless functions).
4. Expand **Environment Variables** and add:
   * `SUPABASE_URL`: (your Supabase URL)
   * `SUPABASE_ANON_KEY`: (your Supabase anon key)
   * `SUPABASE_SERVICE_ROLE_KEY`: (your Supabase service_role key)
5. Click **Deploy**.
6. Once deployed, copy your production backend URL (e.g., `https://attendance-api-backend.vercel.app`).

---

## 💻 Step 3: Configure & Deploy the Frontend to Vercel

### 1. Configure the API Endpoint using Environment Variables
The frontend is configured to automatically inject your backend URL at build time using Vercel environment variables. You do not need to modify any JavaScript files directly!

### 2. Deploy Frontend on Vercel
1. Back on the Vercel Dashboard, click **Add New... → Project**.
2. Select the same Git repository.
3. Name the project (e.g., `digital-attendance`).
4. Set the **Root Directory** to `frontend`.
5. Keep **Framework Preset** as **Other**.
6. Expand **Build and Output Settings**:
   * **Build Command**: `npm run build` (This runs `build.js` which swaps `http://localhost:3000/api` with your Vercel environment variable).
   * **Output Directory**: `.` (representing the root of the frontend folder which contains `index.html`).
7. Expand **Environment Variables** and add:
   * **Key**: `BACKEND_URL`
   * **Value**: `https://attendance-api-backend.vercel.app/api` (Make sure it starts with `https://` and ends with `/api`)
8. Click **Deploy**.

---

## 🔍 Step 4: Verify Your Deployment

Once both deployments are successful:
1. Open the frontend Vercel URL.
2. Try registering a test teacher and student account.
3. Validate that requests successfully ping the backend Vercel URL and persist data in your Supabase tables.
4. Try uploading a student verification photo to ensure the Supabase Storage bucket works correctly.
