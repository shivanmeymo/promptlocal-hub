# Admin Setup Guide for NowInTown

## Granting Admin Access to shivan.meymo@gmail.com

### Quick Setup Steps:

1. **Log in to your Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your NowInTown project

2. **Get the Firebase UID for shivan.meymo@gmail.com**
   
   Option A - From the app:
   - Log in to the app as shivan.meymo@gmail.com
   - Open browser console (F12)
   - You'll see: "👤 Firebase user authenticated: shivan.meymo@gmail.com"
   - Look for the user object in the logs to find the `uid`
   
   Option B - From Supabase:
   - Go to: Table Editor → profiles
   - Find the row where email = 'shivan.meymo@gmail.com'
   - Copy the `id` value (this is the Firebase UID)

3. **Grant Admin Role**
   - Go to: SQL Editor in Supabase Dashboard
   - Run this query (replace `YOUR_FIREBASE_UID` with the actual UID):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_FIREBASE_UID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

   Alternative method (if you know the email):
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE email = 'shivan.meymo@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

4. **Verify Admin Access**
   - Run this query to confirm:
```sql
SELECT ur.*, p.email 
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.role = 'admin';
```

5. **Access Admin Dashboard**
   - Log in as shivan.meymo@gmail.com
   - Navigate to: `/admin` or click "Admin Dashboard" from the user menu
   - You should see the full admin interface

## Admin Features

The admin dashboard includes:

### 📊 Statistics Overview
- Pending events count
- Approved events count
- Rejected events count
- Total events
- Total registered users
- Events created this month

### 🎯 Event Management
- **View all events** across all statuses (pending, approved, rejected)
- **Approve events** - Make events visible to the public
- **Reject events** - Decline events with optional admin notes
- **Edit any event** - Full editing permissions for all events
- **Add admin notes** - Leave internal notes on events

### 📝 Event Details View
- Complete event information
- Organizer details
- Category and pricing
- Date/time information
- Location details
- Event images
- Admin notes history

### 🎨 Admin Permissions
As an admin, you can:
1. **Manage Events**: Approve, reject, or edit any event
2. **View All Data**: Access to all events regardless of status
3. **Edit Others' Events**: Full edit access to events created by other users
4. **Add Internal Notes**: Leave notes for other admins
5. **Monitor Statistics**: Track platform growth and activity

## Admin Navigation

### Accessing Admin Features:

1. **Admin Dashboard**: `/admin` - Central hub for event management
2. **User Menu**: Click your profile picture → "Admin Dashboard"
3. **Direct Edit**: From admin dashboard, click "Edit" on any event

### Admin Dashboard Tabs:

- **Pending** - Events waiting for approval (🟡)
- **Approved** - Published events (🟢)  
- **Rejected** - Declined events (🔴)
- **All** - Complete event list

## Troubleshooting

### "Access Denied" message?
- Verify admin role was granted correctly
- Check that you're logged in as shivan.meymo@gmail.com  
- Clear browser cache and log out/in again
- Verify the Firebase UID matches between profiles table and user_roles table

### Admin Dashboard not appearing in menu?
- Role check happens on page load
- Try refreshing the page
- Verify the `user_roles` table exists with correct permissions

### Can't edit other users' events?
- Check EditEvent.tsx has admin role checking
- Verify user_roles query is working
- Check browser console for errors

## Security Notes

- Admin role is stored in Supabase `user_roles` table
- All admin actions are verified server-side
- Admin dashboard requires authentication
- RLS policies protect admin-only data
- Firebase Authentication provides user identity

## Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Verify Supabase configuration
3. Check Firebase Authentication status
4. Review Edge Function logs in Supabase Dashboard

## Email Notifications

The admin (shivan.meymo@gmail.com) receives email notifications for:
- ✅ New event submissions (via notify-admin-new-event function)
- 📧 Contact form messages (via send-contact-notification function)

Make sure environment variables are set in Supabase:
- `RESEND_API_KEY` = Your Resend API key
- `ADMIN_EMAIL` = shivan.meymo@gmail.com

---

**Admin Email**: shivan.meymo@gmail.com  
**Role Required**: `admin` in `user_roles` table  
**Dashboard URL**: `/admin`
