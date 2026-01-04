# Firebase Push Notifications Setup

This document explains how Firebase Cloud Messaging (FCM) is configured in the NowInTown project.

## Configuration

### Environment Variables
The following Firebase environment variables are configured in `.env` and `.env.local`:

```env
VITE_FIREBASE_API_KEY="AIzaSyAhGmqZ6j2TNGzJIGVNOIgKMZzYVAXcVCk"
VITE_FIREBASE_AUTH_DOMAIN="nowintown.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="nowintown"
VITE_FIREBASE_STORAGE_BUCKET="nowintown.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="952844850642"
VITE_FIREBASE_APP_ID="1:952844850642:web:23fc9836e25f3684c5240b"
VITE_FIREBASE_MEASUREMENT_ID="G-Z79MH31ZCJ"
VITE_FIREBASE_VAPID_KEY="BJsfVMF3f37-tJw20qBv0SplcQ6WGw201S5oQSX76CIMmnqQkaMItjLOUMX6JIF7-a3ORhJK72-CyDHA2oFZUqk"
```

## Files Created

### 1. Firebase Messaging Module
**Location:** `src/integrations/firebase/messaging.ts`

Provides core FCM functionality:
- `initializeMessaging()` - Initialize Firebase Messaging
- `requestNotificationPermission()` - Request permission and get FCM token
- `onForegroundMessage()` - Listen for foreground messages
- `isNotificationSupported()` - Check browser support

### 2. React Hook
**Location:** `src/hooks/useFirebaseMessaging.ts`

React hook for easy integration:
```typescript
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';

function MyComponent() {
  const { token, isSupported, permission, requestPermission } = useFirebaseMessaging();
  
  const handleEnableNotifications = async () => {
    const fcmToken = await requestPermission();
    if (fcmToken) {
      // Save token to your backend/database
      console.log('FCM Token:', fcmToken);
    }
  };
  
  return (
    <button onClick={handleEnableNotifications}>
      Enable Notifications
    </button>
  );
}
```

### 3. Service Worker
**Location:** `public/firebase-messaging-sw.js`

Handles background notifications when the app is not in focus.

## Usage Examples

### Basic Usage
```typescript
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';

function NotificationButton() {
  const { requestPermission, isSupported, permission } = useFirebaseMessaging();
  
  if (!isSupported) {
    return <p>Notifications not supported</p>;
  }
  
  if (permission === 'granted') {
    return <p>Notifications enabled ✅</p>;
  }
  
  return (
    <button onClick={requestPermission}>
      Enable Push Notifications
    </button>
  );
}
```

### Advanced Usage - Saving Token
```typescript
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { supabase } from '@/integrations/supabase/client';

function NotificationManager() {
  const { requestPermission } = useFirebaseMessaging();
  
  const enableNotifications = async () => {
    const token = await requestPermission();
    
    if (token) {
      // Save token to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_fcm_tokens')
          .upsert({ 
            user_id: user.id, 
            fcm_token: token,
            updated_at: new Date().toISOString()
          });
      }
    }
  };
  
  return <button onClick={enableNotifications}>Enable</button>;
}
```

## Testing

### Test Notifications in Browser Console
```javascript
// Request permission and get token
const messaging = firebase.messaging();
const token = await messaging.getToken({
  vapidKey: 'BJsfVMF3f37-tJw20qBv0SplcQ6WGw201S5oQSX76CIMmnqQkaMItjLOUMX6JIF7-a3ORhJK72-CyDHA2oFZUqk'
});
console.log('Token:', token);
```

### Send Test Notification from Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Select your web app
5. Send test message

### Send Notification via API
```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "New Event in Town!",
      "body": "Check out the latest event",
      "icon": "/favicon.png"
    },
    "data": {
      "event_id": "123",
      "url": "/events/123"
    }
  }'
```

## Database Schema (Optional)

If you want to store FCM tokens in Supabase:

```sql
CREATE TABLE user_fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

-- Enable RLS
ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own tokens
CREATE POLICY "Users can manage own FCM tokens"
  ON user_fcm_tokens
  FOR ALL
  USING (auth.uid() = user_id);
```

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure `firebase-messaging-sw.js` is in the `public/` folder
- Make sure you're testing on `https://` or `localhost`

### Permission Denied
- Clear browser site settings and try again
- Check if notifications are blocked in browser settings

### Token Not Generated
- Verify VAPID key is correct in `.env`
- Check Firebase Console → Project Settings → Cloud Messaging
- Ensure Web Push certificates are configured

## Security Notes

⚠️ **Important:**
- Never commit `.env` or `.env.local` files with real credentials
- VAPID key is public and can be included in frontend code
- Server key (for sending notifications) should NEVER be in frontend code
- Use Supabase Edge Functions or backend API to send notifications

## Next Steps

1. **Store FCM tokens in database** - Save tokens when users enable notifications
2. **Send notifications from backend** - Use Supabase Edge Functions
3. **Handle token refresh** - Update tokens when they change
4. **Add notification preferences** - Let users choose what notifications they want
5. **Track notification engagement** - Monitor clicks and conversions
