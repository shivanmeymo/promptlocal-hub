# ⚡ Quick Start: Fix Admin Email Notifications

## The Problem
Admin email (shivan.meymo@gmail.com) is not receiving notifications when new events are submitted.

## The Solution
Two simple steps:

---

## ✅ STEP 1: Set Admin Email in Supabase

1. Go to: https://supabase.com/dashboard
2. Select your NowInTown project
3. Click: **Settings** (left sidebar)
4. Click: **Edge Functions**
5. Find the **Secrets** or **Environment Variables** section
6. Click: **Add New Secret**
7. Enter:
   - **Name:** `ADMIN_EMAIL`
   - **Value:** `shivan.meymo@gmail.com`
8. Click: **Save**

**⚠️ Important:** After saving, click **"Restart Edge Functions"** or wait a few minutes for the change to take effect.

---

## ✅ STEP 2: Grant Admin Role in Database

### Find Your Firebase UID:

**Easiest Method:** From your app
1. Log in to your app with: shivan.meymo@gmail.com
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for any logs showing your user info
5. Find your UID (it looks like: `xY1C7mBJjWNiVOCeLZfdSSjV4Mz2`)

**OR** from Firebase Console:
1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click: **Authentication** → **Users**
4. Find: shivan.meymo@gmail.com
5. Copy the **User UID**

### Grant Admin Access:

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Paste this SQL (**replace `YOUR_UID_HERE` with your actual Firebase UID**):

```sql
-- Grant admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_UID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify it worked
SELECT * FROM public.user_roles WHERE role = 'admin';
```

4. Click **Run**
5. You should see your UID in the results

---

## ✅ STEP 3: Test It Works

1. **Log out** of your app
2. **Log back in** with shivan.meymo@gmail.com
3. **Create a test event**
4. **Submit the event**
5. **Check your email** (shivan.meymo@gmail.com)
   - You should receive an email within 1-2 minutes
   - Email will have event details + Approve/Reject buttons

6. **Visit the admin dashboard:**
   - Go to: `https://your-domain.com/admin`
   - You should see all events
   - You can click **Edit** on any event
   - You can approve/reject pending events

---

## 🎉 Done!

You now have:
- ✅ Email notifications for new events
- ✅ Admin dashboard access
- ✅ Ability to edit any event
- ✅ Approve/reject permissions
- ✅ All bugs fixed (location field issue resolved)

---

## 🐛 Still Not Working?

### Email Not Received?
1. Check spam folder
2. Wait 2-3 minutes (sometimes delayed)
3. Check Supabase Edge Function logs:
   - Dashboard → Edge Functions → `notify-admin-new-event` → Logs
4. Verify `ADMIN_EMAIL` variable is set correctly
5. Make sure `RESEND_API_KEY` is also set in Edge Functions

### Can't Access /admin?
1. Clear browser cache
2. Log out and log back in
3. Verify admin role in database (run the SELECT query above)
4. Check browser console for errors (F12)

### Need Help?
Check these files for more details:
- `ADMIN_SETUP.md` - Full setup guide
- `ADMIN_IMPLEMENTATION.md` - Complete implementation details
- `grant-admin-quick.sql` - SQL helper script

---

**Questions?** Double-check that:
1. ✅ `ADMIN_EMAIL` = `shivan.meymo@gmail.com` (in Supabase Edge Functions)
2. ✅ Your Firebase UID is in `user_roles` table with role = `admin`
3. ✅ You're logged in with the correct email
4. ✅ Edge Functions are restarted after adding the env variable
