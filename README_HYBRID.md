# 🎯 Quick Start: Firebase + Supabase Hybrid

Your project now uses **Firebase for Authentication** and **Supabase for Data**.

---

## 🚀 Quick Start

### 1. Use Authentication

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile, signIn, signOut } = useAuth();
  
  if (!user) {
    return <button onClick={() => signIn(email, password)}>Sign In</button>;
  }
  
  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
      <p>Firebase UID: {user.uid}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### 2. Query Data

```typescript
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function MyEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    if (user) {
      supabase
        .from('events')
        .select('*')
        .eq('user_id', user.uid)  // Use Firebase UID
        .then(({ data }) => setEvents(data));
    }
  }, [user]);
  
  return <EventList events={events} />;
}
```

### 3. Enable Push Notifications

```typescript
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';

function NotificationButton() {
  const { requestPermission, isSupported } = useFirebaseMessaging();
  
  if (!isSupported) return null;
  
  return (
    <button onClick={requestPermission}>
      Enable Notifications
    </button>
  );
}
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/integrations/firebase/auth.ts` | Firebase Auth methods |
| `src/integrations/firebase/functions.ts` | Cloud Functions utilities |
| `src/integrations/firebase/messaging.ts` | Push notifications |
| `src/integrations/supabase/client.ts` | Supabase database client |
| `src/integrations/supabase/auth-sync.ts` | Sync Firebase → Supabase |
| `src/contexts/AuthContext.tsx` | Unified auth context |
| `src/hooks/useFirebaseMessaging.ts` | Push notification hook |

---

## 🔑 Important Changes

### User Object
- **Before:** `user.id` (Supabase UUID)
- **After:** `user.uid` (Firebase string)

### Auth Context
- **Before:** `const { user, session } = useAuth()`
- **After:** `const { user, profile } = useAuth()`

### Database Queries
Always use `user.uid` for Firebase UID:
```typescript
.eq('user_id', user.uid)
```

---

## 📚 Full Documentation

- **[HYBRID_SETUP.md](./HYBRID_SETUP.md)** - Complete architecture guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migrate from Supabase Auth
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Push notifications setup

---

## 🎯 Common Tasks

### Sign Up User
```typescript
const { signUp } = useAuth();
await signUp('user@example.com', 'password123', 'Full Name');
```

### Sign In with Google
```typescript
const { signInWithGoogle } = useAuth();
await signInWithGoogle();
```

### Create Database Record
```typescript
const { user } = useAuth();

await supabase.from('events').insert({
  title: 'My Event',
  user_id: user.uid,  // Important: use user.uid
});
```

### Real-time Subscription
```typescript
supabase
  .channel('events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'events',
  }, (payload) => {
    console.log('New event:', payload.new);
  })
  .subscribe();
```

---

## ✨ You're All Set!

Your app now has:
- ✅ Firebase Authentication
- ✅ Supabase PostgreSQL Database
- ✅ Push Notifications
- ✅ Cloud Functions Ready
- ✅ Real-time Capabilities

**Happy coding! 🚀**
