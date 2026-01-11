# 🚀 Quick Reference: Backend Setup

## ⚠️ You Need Two Things:

### 1️⃣ Firebase Service Account JSON
**Where:** [Firebase Console - Service Accounts](https://console.firebase.google.com/project/nowintown/settings/serviceaccounts)  
**What:** Click "Generate New Private Key" → Download JSON file  
**Save as:** `server/firebase-service-account.json`

### 2️⃣ Supabase Service Role Key
**Where:** [Supabase Dashboard - API Settings](https://supabase.com/dashboard/project/suueubckrgtiniymoxio/settings/api)  
**What:** Copy the **service_role** key (NOT the anon key!)  
**Paste in:** `server/.env` as `SUPABASE_SERVICE_ROLE_KEY=...`

## ✅ Setup Steps

```bash
# 1. Get Firebase service account JSON (see above)
#    Save as: server/firebase-service-account.json

# 2. Get Supabase service role key (see above)
#    Edit server/.env and paste the key

# 3. Install dependencies
cd server
npm install

# 4. Run database migration (from root directory)
cd ..
npx supabase db push

# 5. Start backend
cd server
npm run dev
```

## 🎯 Expected Output

When backend starts successfully:
```
✅ Configuration validated successfully
✅ Firebase Admin SDK initialized
✅ Supabase client initialized
📡 Server running on: http://localhost:3001
```

## 🔥 Start Frontend (in another terminal)

```bash
npm run dev
```

## ✅ Test It Works

1. Open http://localhost:5173
2. Sign in with Google
3. Create an event
4. Check backend terminal for logs:
   - `🔐 Token verified for user: ...`
   - `✅ User authenticated: ...`
   - `✅ Created event: ...`

## 🚨 Common Issues

| Error | Solution |
|-------|----------|
| `FIREBASE_SERVICE_ACCOUNT_PATH is required` | Download service account JSON from Firebase Console |
| `SUPABASE_SERVICE_ROLE_KEY is required` | Get service_role key from Supabase Dashboard |
| `Failed to verify token` | Check Firebase service account matches your project |
| `Connection refused` | Make sure backend is running on port 3001 |

## 📁 Files You Created

```
✅ .env (frontend) - Already configured with VITE_API_URL
⚠️ server/.env - Needs Supabase service role key
⚠️ server/firebase-service-account.json - Needs to be downloaded
```

## 📖 Full Documentation

- [server/SETUP.md](./SETUP.md) - Detailed setup instructions
- [BACKEND_API_GUIDE.md](../BACKEND_API_GUIDE.md) - Complete guide
- [BACKEND_QUICKSTART.md](../BACKEND_QUICKSTART.md) - Quick commands

---

**Current Status:**
- ✅ Frontend configured with Firebase credentials
- ✅ Frontend configured with backend API URL
- ⚠️ Backend needs Firebase service account JSON
- ⚠️ Backend needs Supabase service role key
- ⚠️ Database migration needs to be run

**Next Step:** Download Firebase service account JSON file!
