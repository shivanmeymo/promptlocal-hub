# 🔄 Migration Guide: Supabase Auth → Firebase Auth

This guide helps you migrate from the previous Supabase-only authentication to the new hybrid Firebase + Supabase architecture.

---

## 📋 What Changed?

### Before (Supabase Auth)
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, session } = useAuth();
// user was a Supabase User object
// session contained Supabase Session
```

### After (Firebase Auth + Supabase Data)
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, profile } = useAuth();
// user is now a Firebase User object
// session is removed
// profile comes from Supabase database
```

---

## 🔑 Key Differences

| Feature | Before (Supabase Auth) | After (Firebase Auth) |
|---------|------------------------|----------------------|
| **User Object** | `Supabase User` | `Firebase User` |
| **User ID** | `user.id` (UUID) | `user.uid` (string) |
| **Email** | `user.email` | `user.email` |
| **Session** | `session` object | Not exposed (handled internally) |
| **Profile** | From `profiles` table | From `profiles` table (same) |
| **Google Auth** | Supabase OAuth | Firebase OAuth |

---

## 🔧 Code Updates Needed

### 1. Update User ID References

**Before:**
```typescript
const userId = user.id;  // UUID from Supabase
```

**After:**
```typescript
const userId = user.uid;  // String from Firebase
```

### 2. Remove Session References

**Before:**
```typescript
const { user, session } = useAuth();
if (session) {
  // Do something with session
}
```

**After:**
```typescript
const { user } = useAuth();
if (user) {
  // Session is handled internally by Firebase
}
```

### 3. Update Database Foreign Keys

**Before (UUID):**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id)
);
```

**After (TEXT for Firebase UID):**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL  -- Firebase UID is a string
);

-- Update profiles table
ALTER TABLE profiles 
  ALTER COLUMN user_id TYPE TEXT;
```

### 4. Update All Queries

**Before:**
```typescript
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('user_id', user.id);  // Supabase UUID
```

**After:**
```typescript
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('user_id', user.uid);  // Firebase UID
```

---

## 📊 Database Migration

### Step 1: Backup Your Data
```bash
# Export existing data
supabase db dump > backup.sql
```

### Step 2: Update Profiles Table
```sql
-- Add new column for Firebase UID
ALTER TABLE profiles ADD COLUMN firebase_uid TEXT;

-- Copy existing Supabase IDs temporarily
UPDATE profiles SET firebase_uid = user_id::text;

-- Change user_id column type
ALTER TABLE profiles ALTER COLUMN user_id TYPE TEXT;

-- Add index
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

### Step 3: Update Related Tables
```sql
-- Update events table
ALTER TABLE events ALTER COLUMN user_id TYPE TEXT;

-- Update any other tables with user_id foreign keys
-- Repeat for: comments, favorites, bookmarks, etc.
```

### Step 4: Update RLS Policies
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policies for Firebase UID
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

---

## 🔐 Authentication Method Updates

### Sign Up

**Before:**
```typescript
const { signUp } = useAuth();
await signUp(email, password, fullName);
```

**After (Same API!):**
```typescript
const { signUp } = useAuth();
await signUp(email, password, fullName);
// Now uses Firebase Auth internally
```

### Sign In

**Before:**
```typescript
const { signIn } = useAuth();
await signIn(email, password);
```

**After (Same API!):**
```typescript
const { signIn } = useAuth();
await signIn(email, password);
// Now uses Firebase Auth internally
```

### Google Sign In

**Before:**
```typescript
const { signInWithGoogle } = useAuth();
await signInWithGoogle();
// Redirected to Supabase OAuth
```

**After:**
```typescript
const { signInWithGoogle } = useAuth();
await signInWithGoogle();
// Now uses Firebase OAuth (popup)
```

### Sign Out

**Before & After (Same!):**
```typescript
const { signOut } = useAuth();
await signOut();
```

---

## 🔄 Component Updates

### Example: Profile Component

**Before:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

function Profile() {
  const { user, profile } = useAuth();
  
  return (
    <div>
      <h1>{profile?.full_name}</h1>
      <p>User ID: {user?.id}</p>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

**After:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

function Profile() {
  const { user, profile } = useAuth();
  
  return (
    <div>
      <h1>{profile?.full_name}</h1>
      <p>User ID: {user?.uid}</p>  {/* Changed from user.id */}
      <p>Email: {user?.email}</p>
      {/* Can also access Firebase properties */}
      <img src={user?.photoURL || ''} alt="Avatar" />
    </div>
  );
}
```

### Example: Create Event

**Before:**
```typescript
const createEvent = async (eventData) => {
  const { user } = useAuth();
  
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      user_id: user.id,  // Supabase UUID
    });
};
```

**After:**
```typescript
const createEvent = async (eventData) => {
  const { user } = useAuth();
  
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      user_id: user.uid,  // Firebase UID
    });
};
```

---

## 🧪 Testing After Migration

### 1. Test Authentication
```typescript
// Sign up new user
await signUp('test@example.com', 'password123', 'Test User');

// Verify user in Firebase Console
// Verify profile created in Supabase

// Sign in
await signIn('test@example.com', 'password123');

// Check user object
console.log('Firebase UID:', user.uid);
console.log('Profile:', profile);
```

### 2. Test Database Queries
```typescript
// Create test data
const { data } = await supabase
  .from('events')
  .insert({
    title: 'Test Event',
    user_id: user.uid,
  });

// Fetch user's events
const { data: events } = await supabase
  .from('events')
  .select('*')
  .eq('user_id', user.uid);

console.log('User events:', events);
```

### 3. Test Google Sign In
```typescript
await signInWithGoogle();
// Should open popup and authenticate
// Check Firebase Console for new user
// Check Supabase for synced profile
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "user.id is undefined"
**Problem:** Code still references `user.id` instead of `user.uid`

**Solution:**
```typescript
// Find all instances in your code
// Replace user.id with user.uid
const userId = user.uid;  // ✅ Correct
```

### Issue 2: Profile not syncing
**Problem:** User authenticated but profile not in Supabase

**Solution:** Check `auth-sync.ts` - the sync happens automatically on auth state change

### Issue 3: RLS policies blocking queries
**Problem:** Row Level Security policies still expect Supabase auth

**Solution:** Update RLS policies to use Firebase UID:
```sql
-- Update policy
CREATE POLICY "Users can view own data"
  ON your_table FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

### Issue 4: Session not found
**Problem:** Code tries to access `session` object

**Solution:** Remove session references, Firebase handles this internally:
```typescript
// Before
if (session) { ... }

// After
if (user) { ... }
```

---

## 📝 Migration Checklist

- [ ] **Backup database** (Important!)
- [ ] **Update database schema**
  - [ ] Change `user_id` columns from UUID to TEXT
  - [ ] Update foreign key constraints
  - [ ] Update indexes
- [ ] **Update RLS policies**
  - [ ] Update all policies to use Firebase UID
- [ ] **Update code references**
  - [ ] Replace `user.id` with `user.uid`
  - [ ] Remove `session` references
  - [ ] Update all database queries
- [ ] **Test authentication**
  - [ ] Test sign up
  - [ ] Test sign in
  - [ ] Test Google OAuth
  - [ ] Test sign out
  - [ ] Test password update
- [ ] **Test database operations**
  - [ ] Test create operations
  - [ ] Test read operations
  - [ ] Test update operations
  - [ ] Test delete operations
- [ ] **Update Supabase Edge Functions**
  - [ ] Update to use Firebase UID
  - [ ] Update auth verification
- [ ] **Deploy changes**
  - [ ] Deploy database migrations
  - [ ] Deploy frontend code
  - [ ] Update environment variables

---

## 🔍 Files to Review

After migration, check these files for any hardcoded references:

1. **Components with auth:**
   - `src/pages/Profile.tsx`
   - `src/pages/CreateEvent.tsx`
   - `src/pages/ManageEvents.tsx`
   - Any component using `useAuth()`

2. **Database queries:**
   - Search for `.eq('user_id',`
   - Search for `user.id`
   - Check all Supabase queries

3. **Edge Functions:**
   - `supabase/functions/*/index.ts`
   - Update any user ID references

---

## 🚀 Rolling Back (If Needed)

If you need to rollback:

1. **Restore from backup:**
```bash
psql -h your-db-host -U postgres -d postgres < backup.sql
```

2. **Revert code changes:**
```bash
git revert HEAD
```

3. **Switch back to Supabase Auth:**
   - Restore old `AuthContext.tsx` from git history
   - Revert environment variables

---

## ✅ Post-Migration Validation

### Checklist
- [ ] Can sign up new users?
- [ ] Can sign in existing users?
- [ ] Google OAuth working?
- [ ] Profile data syncing?
- [ ] Database queries working?
- [ ] RLS policies allowing access?
- [ ] No console errors?
- [ ] Push notifications working?

### Monitoring
- Check Firebase Console for auth metrics
- Check Supabase Dashboard for database activity
- Monitor error logs in production

---

## 💡 Benefits After Migration

✅ **Better authentication** - Firebase Auth is industry-leading
✅ **More auth options** - Easy to add Facebook, Twitter, phone auth
✅ **Better security** - Firebase's built-in security features
✅ **Push notifications** - Already integrated with FCM
✅ **Cloud Functions** - Easy serverless functions
✅ **Keep Supabase strengths** - Still have PostgreSQL power

---

## 🆘 Need Help?

If you encounter issues during migration:

1. Check Firebase Console for auth errors
2. Check Supabase Dashboard for database errors
3. Review browser console for client errors
4. Check `auth-sync.ts` for profile sync issues
5. Verify environment variables are correct

---

## 📚 Related Documentation

- [HYBRID_SETUP.md](./HYBRID_SETUP.md) - Full architecture guide
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase push notifications
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Initial setup summary

---

**Good luck with your migration! 🚀**
