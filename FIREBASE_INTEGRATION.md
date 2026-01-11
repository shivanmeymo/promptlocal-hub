# Firebase Integration

## Purpose

Firebase is used **EXCLUSIVELY** for authentication and Google ecosystem features in this application.

## What Firebase Provides

### 1. Authentication
- ✅ Email/Password authentication
- ✅ Google OAuth sign-in
- ✅ Password reset and recovery
- ✅ Account management
- ✅ Multi-provider account linking

### 2. Cloud Messaging (Push Notifications)
- ✅ Browser push notifications
- ✅ Foreground message handling
- ✅ FCM token management
- ✅ Service worker integration

## What Firebase Does NOT Provide

This app **does not use** the following Firebase services:

- ❌ Cloud Firestore (database) → **Uses Supabase PostgreSQL instead**
- ❌ Firebase Storage → **Uses Supabase Storage instead**
- ❌ Cloud Functions → **Uses Supabase Edge Functions instead**
- ❌ Realtime Database → **Uses Supabase Real-time instead**
- ❌ Firebase Analytics → Not implemented
- ❌ Performance Monitoring → Not implemented

## Architecture

```
┌─────────────────────────────────────────┐
│         User Authentication             │
│         ┌─────────────┐                 │
│         │   Firebase  │                 │
│         │    Auth     │                 │
│         └──────┬──────┘                 │
│                │                         │
│                │ Sync User Profile      │
│                ↓                         │
│    ┌────────────────────────┐           │
│    │   Supabase Database    │           │
│    │   (PostgreSQL)         │           │
│    └────────────────────────┘           │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  All App Data & Operations      │    │
│  │  - Events                       │    │
│  │  - User Profiles                │    │
│  │  - Images (Storage)             │    │
│  │  - Edge Functions               │    │
│  │  - Real-time Updates            │    │
│  └─────────────────────────────────┘    │
│          Supabase Platform              │
└─────────────────────────────────────────┘
```

## Configuration

### Firebase Configuration
Located in [src/integrations/firebase/client.ts](../src/integrations/firebase/client.ts)

Environment variables required:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=your-vapid-key  # For push notifications
```

### Backend Configuration
Located in [src/config/backend.ts](../src/config/backend.ts)

```typescript
export const BACKEND_CONFIG = {
  auth: 'firebase',      // Firebase for auth (RECOMMENDED)
  database: 'supabase',  // Supabase for database (FIXED)
  storage: 'supabase',   // Supabase for storage (FIXED)
  functions: 'supabase', // Supabase for functions (FIXED)
  realtime: 'supabase',  // Supabase for realtime (FIXED)
};
```

## Key Files

### Authentication
- **[src/integrations/firebase/auth.ts](../src/integrations/firebase/auth.ts)** - Firebase Auth implementation
- **[src/adapters/firebase/auth.ts](../src/adapters/firebase/auth.ts)** - Firebase Auth Adapter (implements common interface)
- **[src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)** - React context using auth adapter

### Cloud Messaging
- **[src/integrations/firebase/messaging.ts](../src/integrations/firebase/messaging.ts)** - FCM implementation
- **[src/hooks/useFirebaseMessaging.ts](../src/hooks/useFirebaseMessaging.ts)** - React hook for push notifications
- **[public/firebase-messaging-sw.js](../public/firebase-messaging-sw.js)** - Service worker for background messages

### Profile Sync
- **[src/integrations/supabase/auth-sync.ts](../src/integrations/supabase/auth-sync.ts)** - Syncs Firebase users to Supabase

## User Flow

### Sign In Flow
1. User clicks "Sign in with Google"
2. Firebase handles Google OAuth
3. Firebase returns authenticated user
4. App syncs user profile to Supabase:
   ```typescript
   await syncUserProfile(
     firebaseUser.id,
     firebaseUser.email,
     firebaseUser.displayName,
     firebaseUser.photoURL
   );
   ```
5. App fetches full profile from Supabase
6. User is authenticated and ready to use the app

### Data Operations Flow
1. User creates an event
2. App uses Supabase database adapter:
   ```typescript
   const dbAdapter = getDatabaseAdapter();
   await dbAdapter.createEvent(eventData);
   ```
3. Event stored in Supabase PostgreSQL
4. Firebase is NOT involved in data operations

## Why This Architecture?

### Benefits of Using Firebase for Auth Only

1. **Best Google OAuth Integration**
   - Native Google sign-in support
   - Seamless user experience
   - Automatic token refresh

2. **Security**
   - Industry-leading security practices
   - Automatic XSS/CSRF protection
   - Built-in rate limiting

3. **Mobile Support**
   - Excellent iOS and Android SDKs
   - Native app integration ready
   - Push notification infrastructure

4. **Developer Experience**
   - Well-documented APIs
   - Large community support
   - Extensive testing tools

### Benefits of Using Supabase for Everything Else

1. **PostgreSQL Database**
   - Full SQL capabilities
   - ACID compliance
   - Complex queries and joins

2. **Cost Effective**
   - Generous free tier
   - Predictable pricing
   - No Firebase Firestore document limits

3. **Open Source**
   - Self-hostable if needed
   - No vendor lock-in
   - Community contributions

4. **Modern Stack**
   - TypeScript-first
   - RESTful and GraphQL APIs
   - Real-time subscriptions built-in

## Limitations

### What You Can't Do

❌ **Cannot use Firebase Database** - All data operations must use Supabase  
❌ **Cannot use Firebase Storage** - All file uploads must use Supabase  
❌ **Cannot use Firebase Functions** - All serverless logic must use Supabase Edge Functions

### What Happens If You Try

If you attempt to configure Firebase for database, storage, or functions:

```typescript
// This will throw an error:
export const BACKEND_CONFIG = {
  database: 'firebase',  // ❌ ERROR!
};

// Error message:
// "Firebase Database is not supported. This app uses Supabase for database.
//  Firebase is only for authentication and Google ecosystem features."
```

## Migration Notes

### Moving Away from Firebase (Not Recommended)

If you want to move authentication to Supabase:

**Pros:**
- Single backend provider
- Simpler configuration
- One less service to manage

**Cons:**
- ❌ Lose best-in-class Google OAuth
- ❌ Lose push notification infrastructure
- ❌ More complex mobile integration
- ❌ Need to migrate all existing users

**How to migrate:**
1. Change config: `auth: 'supabase'`
2. Export Firebase users
3. Import users to Supabase
4. Update email templates
5. Test authentication flow
6. Migrate production users

⚠️ **Warning:** This is a major migration and not recommended unless absolutely necessary.

## Google Cloud Console Setup

To use Firebase Authentication:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Google Analytics (optional)

2. **Enable Authentication Providers**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google
   - Add authorized domains

3. **Configure OAuth Consent Screen**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services → OAuth consent screen
   - Add app information
   - Add scopes: email, profile
   - Add test users (if in development)

4. **Setup Cloud Messaging** (Optional)
   - Go to Project Settings → Cloud Messaging
   - Generate VAPID key
   - Add to environment variables

## Troubleshooting

### "Google Sign-In not working"
- Check OAuth consent screen configuration
- Verify authorized domains include localhost and production domain
- Ensure user is added as test user (if app in testing mode)

### "Push notifications not working"
- Verify VAPID key is configured
- Check service worker registration
- Ensure HTTPS in production (required for notifications)

### "User not found in database"
- Check profile sync in AuthContext
- Verify Supabase connection
- Check user_id field matches Firebase UID

## Related Documentation

- [Backend Architecture Guide](./BACKEND_SWITCHING_GUIDE.md)
- [Supabase Setup](./README.md)
- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
