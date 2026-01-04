# 🚀 Hybrid Architecture: Firebase + Supabase

This project uses a **hybrid architecture** combining the best of both platforms:

- **Firebase** → Authentication & Cloud Functions
- **Supabase** → PostgreSQL Database & Real-time subscriptions

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                    │
└─────────────────────────────────────────────────────────┘
                │                    │
                ▼                    ▼
┌─────────────────────┐    ┌─────────────────────────┐
│  Firebase Services  │    │  Supabase Services      │
├─────────────────────┤    ├─────────────────────────┤
│ • Authentication    │    │ • PostgreSQL Database   │
│ • Cloud Functions   │    │ • Real-time subs        │
│ • Cloud Messaging   │    │ • Storage               │
│ • Analytics         │    │ • Row Level Security    │
└─────────────────────┘    └─────────────────────────┘
```

---

## 🎯 Why This Architecture?

### Firebase Advantages
✅ **Best-in-class Authentication**
- Social logins (Google, Facebook, Twitter, etc.)
- Email/password with verification
- Phone authentication
- Anonymous auth
- Custom token authentication

✅ **Serverless Cloud Functions**
- Auto-scaling
- No server management
- Pay-per-use pricing
- Built-in security

✅ **Push Notifications**
- FCM (Firebase Cloud Messaging)
- Cross-platform support

### Supabase Advantages
✅ **Powerful PostgreSQL Database**
- Full SQL support
- Complex queries & joins
- ACID compliance
- PostGIS for geospatial data

✅ **Row Level Security (RLS)**
- Fine-grained access control
- Policy-based security

✅ **Real-time Subscriptions**
- Live data updates
- Presence tracking

✅ **Built-in Storage**
- File uploads
- CDN integration

---

## 📁 Project Structure

```
src/
├── integrations/
│   ├── firebase/
│   │   ├── client.ts          # Firebase initialization
│   │   ├── auth.ts            # Authentication methods
│   │   ├── messaging.ts       # Push notifications
│   │   └── functions.ts       # Cloud Functions utilities
│   │
│   └── supabase/
│       ├── client.ts          # Supabase initialization
│       ├── auth-sync.ts       # Sync Firebase auth with Supabase
│       └── types.ts           # Database types
│
├── contexts/
│   └── AuthContext.tsx        # Unified auth context (Firebase-based)
│
└── hooks/
    ├── useFirebaseMessaging.ts
    └── use-toast.ts
```

---

## 🔐 Authentication Flow

### 1. User Signs Up/In (Firebase)
```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginComponent() {
  const { signIn, signInWithGoogle } = useAuth();
  
  // Email/Password
  await signIn(email, password);
  
  // Google OAuth
  await signInWithGoogle();
}
```

### 2. Profile Synced to Supabase
When a user authenticates with Firebase, their profile is automatically synced to Supabase:

```typescript
// This happens automatically in AuthContext
await syncUserProfile(
  firebaseUser.uid,      // Firebase UID as primary key
  firebaseUser.email,
  firebaseUser.displayName,
  firebaseUser.photoURL
);
```

### 3. Database Queries Use Firebase UID
```typescript
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  // Query user's data using Firebase UID
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.uid);
}
```

---

## 🔑 Key Files Explained

### 1. Firebase Authentication (`src/integrations/firebase/auth.ts`)
Central module for all Firebase Auth operations:
- Sign up/in with email
- Social authentication (Google, etc.)
- Password management
- Account deletion
- Token management

### 2. Auth Sync (`src/integrations/supabase/auth-sync.ts`)
Bridges Firebase Auth with Supabase data:
- Creates/updates user profiles in Supabase
- Syncs user information
- Deletes profiles on account deletion

### 3. Auth Context (`src/contexts/AuthContext.tsx`)
Unified authentication state management:
- Uses Firebase for authentication
- Manages user state
- Fetches profile from Supabase
- Provides auth methods to components

---

## 📊 Database Schema

### Profiles Table (Supabase)
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,  -- Firebase UID
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
```

### Events Table Example
```sql
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,  -- Firebase UID
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view events
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO PUBLIC
  USING (true);

-- Policy: Users can create their own events
CREATE POLICY "Users can create own events"
  ON events FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');
```

---

## 🔥 Firebase Cloud Functions

### Setup
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

2. Create functions in `functions/src/index.ts`:
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Example: Send notification when event is created
export const notifyEventCreated = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    
    // Send FCM notification
    const payload = {
      notification: {
        title: 'New Event!',
        body: event.title,
      },
    };
    
    await admin.messaging().sendToTopic('new-events', payload);
  });

// Example: HTTP callable function
export const processPayment = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }
  
  // Process payment logic here
  return { success: true, transactionId: '12345' };
});
```

### Call from React App
```typescript
import { callFunction } from '@/integrations/firebase/functions';

// Call the function
const result = await callFunction('processPayment', {
  amount: 1000,
  currency: 'USD',
});
```

---

## 🔔 Push Notifications Flow

1. **User enables notifications** (see FIREBASE_SETUP.md)
2. **Store FCM token in Supabase**:
```typescript
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function NotificationSetup() {
  const { requestPermission } = useFirebaseMessaging();
  const { user } = useAuth();
  
  const enableNotifications = async () => {
    const token = await requestPermission();
    
    if (token && user) {
      // Store in Supabase
      await supabase.from('fcm_tokens').upsert({
        user_id: user.uid,
        token: token,
      });
    }
  };
}
```

3. **Send notifications via Firebase Function**:
```typescript
// In Firebase Function
export const sendEventNotification = functions.https.onCall(async (data) => {
  const { userId, title, body } = data;
  
  // Get user's FCM token from Supabase
  const { data: tokenData } = await supabase
    .from('fcm_tokens')
    .select('token')
    .eq('user_id', userId)
    .single();
  
  // Send via FCM
  await admin.messaging().send({
    token: tokenData.token,
    notification: { title, body },
  });
});
```

---

## 🛠️ Common Patterns

### Pattern 1: Authenticated Query
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const { user } = useAuth();

if (user) {
  const { data } = await supabase
    .from('user_events')
    .select('*')
    .eq('user_id', user.uid);
}
```

### Pattern 2: Real-time Subscription
```typescript
useEffect(() => {
  if (!user) return;
  
  const subscription = supabase
    .channel('events')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'events',
      filter: `user_id=eq.${user.uid}`,
    }, (payload) => {
      console.log('New event:', payload.new);
    })
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, [user]);
```

### Pattern 3: File Upload (Supabase Storage)
```typescript
const uploadFile = async (file: File) => {
  const { user } = useAuth();
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${user.uid}/${file.name}`, file);
  
  return data?.path;
};
```

---

## 🔒 Security Best Practices

### 1. Row Level Security (RLS)
Always enable RLS on Supabase tables:
```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### 2. Validate Firebase Tokens
In Supabase, you can verify Firebase tokens:
```sql
CREATE OR REPLACE FUNCTION get_firebase_uid()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claims')::json->>'sub';
END;
$$ LANGUAGE plpgsql;
```

### 3. Secure Firebase Functions
```typescript
// Always check authentication
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
}

// Validate input
if (!data.eventId || typeof data.eventId !== 'string') {
  throw new functions.https.HttpsError('invalid-argument', 'Invalid event ID');
}
```

---

## 🧪 Testing

### Test Firebase Auth
```typescript
import { signInWithEmail } from '@/integrations/firebase/auth';

describe('Firebase Auth', () => {
  it('should sign in user', async () => {
    const result = await signInWithEmail('test@example.com', 'password');
    expect(result.user).toBeDefined();
  });
});
```

### Test Supabase Queries
```typescript
import { supabase } from '@/integrations/supabase/client';

describe('Supabase Queries', () => {
  it('should fetch events', async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .limit(10);
    
    expect(error).toBeNull();
    expect(data).toHaveLength(10);
  });
});
```

---

## 📈 Monitoring & Analytics

### Firebase Analytics
```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';
import { firebaseApp } from '@/integrations/firebase/client';

const analytics = getAnalytics(firebaseApp);

// Log custom events
logEvent(analytics, 'event_created', {
  event_name: 'Summer Festival',
  location: 'Stockholm',
});
```

### Supabase Logs
Monitor database performance in Supabase Dashboard:
- Query performance
- API usage
- Error logs

---

## 🚀 Deployment

### Environment Variables

**Production `.env`:**
```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
VITE_FIREBASE_VAPID_KEY=your_vapid_key

# Supabase
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Deploy Firebase Functions
```bash
firebase deploy --only functions
```

### Deploy Frontend
```bash
npm run build
# Deploy to Vercel, Netlify, or your hosting provider
```

---

## 💡 Tips & Tricks

1. **Use Firebase UID consistently** - Always use `user.uid` as the foreign key
2. **Leverage Supabase's PostgreSQL** - Use complex queries, joins, and views
3. **Real-time when needed** - Use Supabase subscriptions for live updates
4. **Cache Firebase tokens** - Don't call `getIdToken()` on every request
5. **Monitor costs** - Both Firebase and Supabase have generous free tiers

---

## 🆘 Troubleshooting

### Issue: User profile not syncing
**Solution:** Check `auth-sync.ts` and ensure profile table exists

### Issue: RLS policies blocking queries
**Solution:** Verify policies allow access with Firebase UID

### Issue: Firebase function not callable
**Solution:** Ensure CORS is configured and user is authenticated

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Firebase + Supabase Guide](https://supabase.com/docs/guides/integrations/firebase-auth)

---

## ✨ Summary

This hybrid architecture gives you:
- ✅ **Best authentication** (Firebase)
- ✅ **Powerful database** (Supabase PostgreSQL)
- ✅ **Serverless functions** (Firebase Functions)
- ✅ **Real-time capabilities** (Supabase)
- ✅ **Push notifications** (FCM)
- ✅ **File storage** (Supabase Storage)

**You get the best of both worlds!** 🚀
