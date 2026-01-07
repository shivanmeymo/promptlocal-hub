# Admin Setup Guide

## 1. Set Admin Email Environment Variable in Supabase

The admin email notifications are controlled by the `ADMIN_EMAIL` environment variable in your Supabase Edge Functions.

### Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Edge Functions**
4. Add the following environment variable:
   - **Name:** `ADMIN_EMAIL`
   - **Value:** `shivan.meymo@gmail.com`

5. Click **Save**

## 2. Create Admin User Role in Database

Run this SQL in your Supabase SQL Editor to grant admin role to your user:

```sql
-- First, find your Firebase user ID
-- You can get this from Firebase Console or by logging in and checking the browser console

-- Insert admin role for your user
-- Replace 'YOUR_FIREBASE_UID' with your actual Firebase UID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_FIREBASE_UID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### How to Find Your Firebase UID:

**Option 1: From Firebase Console**
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Authentication → Users
4. Find your email (shivan.meymo@gmail.com)
5. Copy the User UID

**Option 2: From Browser Console**
1. Log in to your app
2. Open Browser Developer Tools (F12)
3. Go to Console tab
4. Type: `localStorage.getItem('firebase:authUser:...')`
5. Look for the `uid` field in the output

**Option 3: Quick SQL to check existing users**
```sql
-- See existing user IDs in events table
SELECT DISTINCT user_id FROM public.events WHERE user_id IS NOT NULL LIMIT 10;
```

## 3. Verify Admin Access

1. Log out and log back in to your app
2. Navigate to: `https://your-domain.com/admin`
3. You should now see the Admin Dashboard with all pending events

## 4. Testing Email Notifications

After setting the `ADMIN_EMAIL` environment variable:

1. Create a new test event
2. Check your email (shivan.meymo@gmail.com) for the notification
3. The email should include:
   - Event details
   - Approve button
   - Reject button
   - Link to admin dashboard

## Troubleshooting

### Not Receiving Emails?

1. **Check Resend API Key:** Make sure `RESEND_API_KEY` is set in Supabase Edge Functions
2. **Check Spam Folder:** Emails might be filtered
3. **Verify Domain:** If using a custom domain, make sure it's verified in Resend
4. **Check Function Logs:**
   - Go to Supabase Dashboard → Edge Functions
   - Click on `notify-admin-new-event`
   - Check the logs for errors

### Can't Access Admin Dashboard?

1. Verify your user has the admin role in the database
2. Make sure you're logged in with the correct account
3. Check browser console for errors
4. Clear cache and cookies, then log in again

## Current Configuration

- **Admin Email:** shivan.meymo@gmail.com
- **Admin Dashboard Path:** `/admin`
- **Edge Function:** `notify-admin-new-event`
- **Database Table:** `user_roles`

## Next Steps

Once the admin role is configured:

1. You'll receive email notifications for all new events
2. You can approve/reject events directly from emails
3. You can manage all events from the Admin Dashboard
4. You can edit event details before approving
5. You can view event statistics and metrics
