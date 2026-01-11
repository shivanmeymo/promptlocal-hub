# Firebase Backend Setup Instructions

## Step 1: Download Firebase Service Account Key

The backend needs **Firebase Admin SDK credentials**, which are different from the frontend credentials.

### How to Get It:

1. Go to [Firebase Console](https://console.firebase.google.com/project/nowintown/settings/serviceaccounts)
2. Click the **"Service accounts"** tab
3. Click **"Generate New Private Key"** button
4. Click **"Generate Key"** in the confirmation dialog
5. A JSON file will download (e.g., `nowintown-firebase-adminsdk-xxxxx.json`)

### Save the File:

```bash
# Copy the downloaded file to the server directory
cp ~/Downloads/nowintown-firebase-adminsdk-*.json server/firebase-service-account.json
```

⚠️ **IMPORTANT:** This file contains sensitive credentials! Never commit it to Git (it's already in `.gitignore`).

## Step 2: Get Supabase Service Role Key

The backend needs the **service_role** key (NOT the anon key).

### How to Get It:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/suueubckrgtiniymoxio/settings/api)
2. Find the **"service_role"** key in the Project API keys section
3. Click the eye icon to reveal it
4. Copy the key

⚠️ **IMPORTANT:** This key bypasses Row Level Security! Never use it in the frontend.

## Step 3: Create Backend .env File

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=3001
NODE_ENV=development

# Firebase Admin SDK - Path to service account JSON
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Supabase - Service Role Key (from Supabase Dashboard)
SUPABASE_URL=https://suueubckrgtiniymoxio.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<paste-your-service-role-key-here>

# CORS - Allow frontend to access backend
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

LOG_LEVEL=debug
```

## Step 4: Install Backend Dependencies

```bash
cd server
npm install
```

## Step 5: Run Database Migration

```bash
# From the root directory (not inside server/)
npx supabase db push
```

Or run the SQL manually:
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/suueubckrgtiniymoxio/sql)
2. Copy contents of `supabase/migrations/20260111_backend_api_schema.sql`
3. Paste and click "Run"

## Step 6: Start Backend Server

```bash
cd server
npm run dev
```

You should see:
```
═══════════════════════════════════════════════
🚀 NowInTown API Server
═══════════════════════════════════════════════
📡 Server running on: http://localhost:3001
🌍 Environment: development
🔥 Firebase Auth: Enabled
⚡ Supabase DB: Connected
═══════════════════════════════════════════════
```

## Step 7: Start Frontend (in another terminal)

```bash
# From root directory
npm run dev
```

## Verify Setup

1. Open [http://localhost:5173](http://localhost:5173)
2. Sign in with Google or create an account
3. Try creating an event
4. Check backend terminal - you should see:
   ```
   🔐 Token verified for user: <firebase-uid>
   ✅ User authenticated: <uuid> (<email>)
   ✅ Created event: <event-id> by user <uuid>
   ```

## Troubleshooting

### "FIREBASE_SERVICE_ACCOUNT_PATH is required"
- Download service account JSON from Firebase Console
- Save as `server/firebase-service-account.json`
- Verify path in `server/.env`

### "SUPABASE_SERVICE_ROLE_KEY is required"
- Get service_role key from Supabase Dashboard > Settings > API
- Paste in `server/.env`
- **NOT** the anon key!

### "Failed to verify token"
- Make sure backend is using the correct Firebase project
- Check that service account JSON matches your Firebase project
- Try signing out and back in

### "Connection refused"
- Make sure backend is running (`cd server && npm run dev`)
- Check that `VITE_API_URL=http://localhost:3001` is in frontend `.env`
- Verify port 3001 is not in use

## Project Structure

```
nowintown/
├── .env                          # Frontend environment (✅ configured)
├── server/
│   ├── .env                      # Backend environment (⚠️ needs setup)
│   ├── firebase-service-account.json  # ⚠️ Download from Firebase Console
│   ├── package.json
│   └── src/
│       ├── server.ts
│       ├── services/
│       └── routes/
└── supabase/
    └── migrations/
        └── 20260111_backend_api_schema.sql  # Run this migration
```

## Next Steps After Setup

Once everything is running:

1. Test creating an event through the frontend
2. Verify it appears in Supabase Dashboard
3. Check that you can only edit/delete your own events
4. Test with multiple users (different Google accounts)

## Production Deployment

When ready to deploy:

1. Deploy backend to Railway/Render/Cloud Run
2. Update frontend `.env.production`:
   ```env
   VITE_API_URL=https://your-backend-url.com
   ```
3. Update backend `ALLOWED_ORIGINS` to include production frontend URL
4. Deploy frontend to Vercel/Netlify

See [BACKEND_API_GUIDE.md](../BACKEND_API_GUIDE.md) for detailed deployment instructions.
