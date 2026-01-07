# Admin Email Notifications & Dashboard - Implementation Summary

## 🎯 What Was Done

### 1. **Admin Email Notification System** ✅
- Email notifications are already implemented via the `notify-admin-new-event` Edge Function
- The function is triggered automatically when a new event is created
- Admin receives email with:
  - Event details (title, organizer, date, location, category, price)
  - Event description and organizer info
  - **Approve** button (direct link)
  - **Reject** button (direct link)
  - Link to admin dashboard

### 2. **Admin Dashboard Enhancements** ✅
- Added **Edit** button for all events (not just pending ones)
- Admin can now edit ANY event, including events created by other users
- Maintained all existing features:
  - View event statistics (pending, approved, rejected, total)
  - Filter events by status
  - Approve/reject events with notes
  - View detailed event information

### 3. **Permission System** ✅
- Modified `EditEvent.tsx` to check for admin role
- Admins can edit events they don't own
- Regular users can only edit their own events
- Proper permission checks in place

### 4. **Bug Fixes** ✅
- Fixed all form state management issues in `CreateEvent.tsx`
- Changed all `setFormData({ ...formData, ... })` to `setFormData(prev => ({ ...prev, ... }))`
- This prevents stale closures and ensures location field doesn't disappear when selecting category
- Fixed TypeScript errors (changed `user.id` to `user.uid` for Firebase User)

## 📝 Setup Required

### **Issue: Admin Not Receiving Emails**

The admin email environment variable needs to be configured in Supabase. Here's how:

### Step 1: Set Environment Variable in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Settings** → **Edge Functions**
4. Click **"Add Secret"** or **"Environment Variables"**
5. Add:
   - **Name:** `ADMIN_EMAIL`
   - **Value:** `shivan.meymo@gmail.com`
6. Click **Save**
7. **Important:** Restart your Edge Functions or redeploy them for the change to take effect

### Step 2: Grant Admin Role to Your User

You need to add your user to the `user_roles` table with the 'admin' role.

#### Option A: Using the Quick SQL Script

1. Open Supabase SQL Editor
2. Open the file: `grant-admin-quick.sql`
3. Follow the instructions in the file:
   - First, run the SELECT query to find your Firebase UID
   - Then, uncomment and replace `YOUR_FIREBASE_UID_HERE` with your actual UID
   - Run the INSERT query to grant admin role
   - Run the verify SELECT query to confirm

#### Option B: Using the PowerShell Script

1. Open PowerShell in the project directory
2. Run: `.\setup-admin.ps1`
3. Follow the interactive prompts

#### Option C: Manual SQL

Run this in Supabase SQL Editor:

```sql
-- Find your Firebase UID from existing events
SELECT DISTINCT user_id, COUNT(*) as event_count
FROM public.events 
WHERE user_id IS NOT NULL 
GROUP BY user_id
ORDER BY event_count DESC;

-- Replace YOUR_FIREBASE_UID with the UID from above
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_FIREBASE_UID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify
SELECT * FROM public.user_roles WHERE user_id = 'YOUR_FIREBASE_UID';
```

### Step 3: Apply Database Migration (Optional)

If you want to use the helper function:

1. Go to Supabase SQL Editor
2. Run the migration: `supabase/migrations/20260107_add_admin_user.sql`
3. This creates a reusable function: `grant_admin_role('firebase_uid')`

## ✅ Testing

After setup, test the following:

### 1. Test Admin Email Notifications
1. Log out and log back in
2. Create a new test event
3. Submit the event
4. Check email at `shivan.meymo@gmail.com`
5. You should receive an email with event details and approve/reject buttons

### 2. Test Admin Dashboard
1. Navigate to: `https://your-domain.com/admin`
2. You should see:
   - Statistics cards (Pending, Approved, Rejected, Total)
   - All events with status filters
   - Edit button on all events (not just your own)
   - Approve/Reject buttons on pending events

### 3. Test Admin Edit Permissions
1. From admin dashboard, click **Edit** on any event
2. You should be able to edit the event even if you didn't create it
3. Regular users should only be able to edit their own events

## 🐛 Troubleshooting

### Not Receiving Emails?

1. **Check Environment Variable:**
   - Go to Supabase Dashboard → Settings → Edge Functions
   - Verify `ADMIN_EMAIL` is set to `shivan.meymo@gmail.com`
   - Restart Edge Functions after adding the variable

2. **Check Resend API Key:**
   - Make sure `RESEND_API_KEY` is set in Edge Functions
   - Verify your Resend account is active

3. **Check Function Logs:**
   - Go to Supabase Dashboard → Edge Functions
   - Click on `notify-admin-new-event`
   - Check logs for errors

4. **Check Spam Folder:**
   - Emails might be filtered to spam
   - Add `onboarding@resend.dev` to contacts

5. **Verify Domain:**
   - If using custom domain, verify it in Resend dashboard
   - Check DNS records are correct

### Can't Access Admin Dashboard?

1. **Verify Admin Role:**
   ```sql
   SELECT * FROM public.user_roles 
   WHERE user_id = 'YOUR_FIREBASE_UID' AND role = 'admin';
   ```

2. **Check Logged In User:**
   - Open browser console
   - Check if you're logged in with the correct email
   - Firebase UID should match the one in user_roles table

3. **Clear Cache:**
   - Clear browser cache and cookies
   - Log out and log back in
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Can't Edit Other Users' Events?

1. Make sure you have admin role in database
2. Log out and log back in after granting admin role
3. Check browser console for any errors

## 📁 Files Modified

### Created Files:
1. `ADMIN_SETUP.md` - Detailed setup guide
2. `setup-admin.sh` - Bash script for Linux/Mac
3. `setup-admin.ps1` - PowerShell script for Windows
4. `grant-admin-quick.sql` - Quick SQL for granting admin role
5. `supabase/migrations/20260107_add_admin_user.sql` - Migration with helper function

### Modified Files:
1. `src/pages/CreateEvent.tsx` - Fixed form state management with callback setState
2. `src/pages/AdminDashboard.tsx` - Added Edit button, fixed TypeScript errors
3. `src/pages/EditEvent.tsx` - Added admin permission check

## 🔑 Key Features

### Admin Capabilities:
- ✅ Receive email notifications for all new events
- ✅ Approve events directly from email
- ✅ Reject events directly from email
- ✅ View all events in admin dashboard
- ✅ Filter events by status (pending, approved, rejected, all)
- ✅ View detailed event information
- ✅ Edit ANY event (including events by other users)
- ✅ Add admin notes when approving/rejecting
- ✅ View event statistics and metrics

### Email Content:
- Event title
- Organizer name and email
- Date, time, and location
- Category and price
- Event description
- About the organizer (if provided)
- Direct approve/reject buttons
- Link to admin dashboard
- Token-based authentication (expires in 7 days)

## 🚀 Next Steps

1. **Set the ADMIN_EMAIL environment variable** in Supabase Edge Functions
2. **Grant admin role** to your user in the database
3. **Test email notifications** by creating a new event
4. **Access admin dashboard** at `/admin`
5. **(Optional) Add more admins** by inserting more rows in user_roles table

## 📧 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the detailed setup guide in `ADMIN_SETUP.md`
3. Check Supabase Edge Function logs for errors
4. Verify all environment variables are set correctly

---

**Admin Email:** shivan.meymo@gmail.com  
**Admin Dashboard:** https://your-domain.com/admin  
**Edge Function:** notify-admin-new-event  
**Database Table:** user_roles
