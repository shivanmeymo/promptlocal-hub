# Backend Switching Guide

## Overview

This application now supports switching between Firebase and Supabase backend providers with minimal code changes. The adapter pattern allows you to:

1. **Switch providers by changing one config file**
2. **Run in hybrid mode** (e.g., Firebase auth + Supabase database)
3. **Migrate incrementally** from one provider to another
4. **Test different providers** without refactoring your entire codebase

## Current Configuration

The backend configuration is centralized in [src/config/backend.ts](../src/config/backend.ts):

```typescript
export const BACKEND_CONFIG = {
  auth: 'firebase',      // Currently using Firebase for authentication
  database: 'supabase',  // Currently using Supabase for database
  storage: 'supabase',   // Currently using Supabase for storage
  functions: 'supabase', // Currently using Supabase for edge functions
  realtime: 'supabase',  // Currently using Supabase for realtime
};
```

## How to Switch Providers

### 1. Authentication Provider

**Switch from Firebase to Supabase Auth:**

```typescript
// In src/config/backend.ts
export const BACKEND_CONFIG = {
  auth: 'supabase',  // Changed from 'firebase'
  // ...
};
```

Then use the adapter in your code:

```typescript
// Instead of direct Firebase imports
import { getAuthAdapter } from '@/adapters/factory';

const auth = getAuthAdapter();

// All methods work the same regardless of provider
const { user, error } = await auth.signIn(email, password);
```

### 2. Database Provider

**Switch from Supabase to Firebase (Firestore):**

> ⚠️ **Note:** Firebase Database adapter not yet implemented. Only Supabase is currently available.

```typescript
// In src/config/backend.ts
export const BACKEND_CONFIG = {
  database: 'firebase',  // When implemented
  // ...
};
```

Use the adapter:

```typescript
import { getDatabaseAdapter } from '@/adapters/factory';

const db = getDatabaseAdapter();

// Get events
const { data, error } = await db.getEvents({ status: 'approved' });

// Create event
const { data, error } = await db.createEvent(eventData);
```

### 3. Storage Provider

Use the storage adapter for file uploads:

```typescript
import { getStorageAdapter } from '@/adapters/factory';

const storage = getStorageAdapter();

// Upload file
const { data, error } = await storage.upload('path/to/file.jpg', file);

// Get public URL
const url = storage.getPublicUrl('path/to/file.jpg');

// Delete file
await storage.delete('path/to/file.jpg');
```

### 4. Functions Provider

Use the functions adapter for serverless functions:

```typescript
import { getFunctionsAdapter } from '@/adapters/factory';

const functions = getFunctionsAdapter();

// Invoke function
const { data, error } = await functions.invoke('function-name', {
  body: { param1: 'value' },
});
```

## Hybrid Mode

You can mix and match providers for different services:

```typescript
export const BACKEND_CONFIG = {
  auth: 'firebase',      // Use Firebase for auth (better OAuth support)
  database: 'supabase',  // Use Supabase for database (PostgreSQL)
  storage: 'supabase',   // Use Supabase for storage
  functions: 'supabase', // Use Supabase Edge Functions (Deno runtime)
  realtime: 'supabase',  // Use Supabase for realtime subscriptions
};

export const HYBRID_MODE = {
  // When true, user profiles are synced between Firebase Auth and Supabase
  syncUserProfiles: true,
  
  // Which provider is the source of truth for user data
  primaryAuthProvider: 'firebase',
};
```

## Migration Guide

### Incremental Migration Strategy

1. **Phase 1: Add Adapters (Current)**
   - ✅ Create adapter interfaces
   - ✅ Implement Firebase auth adapter
   - ✅ Implement Supabase adapters (auth, database, storage, functions)
   - ✅ Update factory to use real adapters

2. **Phase 2: Refactor Core Components**
   - Update `AuthContext` to use auth adapter
   - Update pages to use database adapter
   - Update storage operations to use storage adapter
   - Update function calls to use functions adapter

3. **Phase 3: Test & Validate**
   - Test with current config (Firebase auth + Supabase database)
   - Test switching auth provider
   - Test switching database provider
   - Test hybrid mode

4. **Phase 4: Clean Up**
   - Remove direct Firebase/Supabase imports
   - Update documentation
   - Add migration helpers

## Adapter API Reference

### IAuthAdapter

```typescript
interface IAuthAdapter {
  signUp(email: string, password: string, metadata?: { displayName?: string }): Promise<Result>;
  signIn(email: string, password: string): Promise<Result>;
  signInWithGoogle(): Promise<Result>;
  signOut(): Promise<Result>;
  getCurrentUser(): AuthUser | null;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  sendPasswordResetEmail(email: string): Promise<Result>;
  updatePassword(newPassword: string): Promise<Result>;
  linkPassword(password: string): Promise<Result>;
  deleteAccount(): Promise<Result>;
}
```

### IDatabaseAdapter

```typescript
interface IDatabaseAdapter {
  // Events
  getEvents(options?: { userId?: string; status?: string; category?: string; limit?: number }): Promise<Result>;
  getEvent(id: string): Promise<Result>;
  createEvent(event: Partial<Event>): Promise<Result>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Result>;
  deleteEvent(id: string): Promise<Result>;
  
  // Profiles
  getProfile(userId: string): Promise<Result>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Result>;
  
  // Generic methods
  query<T>(table: string, options?: QueryOptions): Promise<Result>;
  insert<T>(table: string, data: Partial<T> | Partial<T>[]): Promise<Result>;
  update<T>(table: string, filters: Record<string, any>, updates: Partial<T>): Promise<Result>;
  delete(table: string, filters: Record<string, any>): Promise<Result>;
}
```

### IStorageAdapter

```typescript
interface IStorageAdapter {
  upload(path: string, file: File, options?: { bucket?: string; contentType?: string }): Promise<Result>;
  getPublicUrl(path: string, options?: { bucket?: string }): string;
  delete(path: string, options?: { bucket?: string }): Promise<Result>;
}
```

### IFunctionsAdapter

```typescript
interface IFunctionsAdapter {
  invoke<TRequest, TResponse>(
    functionName: string,
    options?: { body?: TRequest; headers?: Record<string, string>; method?: string }
  ): Promise<Result>;
}
```

## Benefits of Adapter Pattern

### 1. **Flexibility**
Switch providers without touching application code:
```typescript
// Change this
BACKEND_CONFIG.auth = 'firebase';

// To this
BACKEND_CONFIG.auth = 'supabase';

// No other code changes needed!
```

### 2. **Type Safety**
All adapters implement the same interfaces, ensuring consistent API:
```typescript
// Both adapters have the same methods
const firebaseAuth: IAuthAdapter = new FirebaseAuthAdapter();
const supabaseAuth: IAuthAdapter = new SupabaseAuthAdapter();

// TypeScript ensures they're compatible
```

### 3. **Testability**
Easy to mock adapters for testing:
```typescript
class MockAuthAdapter implements IAuthAdapter {
  async signIn() {
    return { user: mockUser, error: null };
  }
  // ...
}
```

### 4. **Hybrid Mode Support**
Use the best provider for each service:
- Firebase: Better OAuth providers, mobile SDKs
- Supabase: PostgreSQL, real-time subscriptions, built-in RLS

### 5. **Migration Safety**
Test new providers without breaking production:
```typescript
// Test Supabase auth in development
if (import.meta.env.DEV) {
  BACKEND_CONFIG.auth = 'supabase';
} else {
  BACKEND_CONFIG.auth = 'firebase';
}
```

## Current Status

### ✅ Implemented
- Firebase Auth Adapter
- Supabase Auth Adapter
- Supabase Database Adapter
- Supabase Storage Adapter
- Supabase Functions Adapter
- Configuration system
- Factory pattern

### 🔄 In Progress
- Refactoring existing code to use adapters
- Testing provider switching

### ⏳ Planned
- Firebase Database Adapter (Firestore)
- Firebase Storage Adapter
- Firebase Functions Adapter
- Realtime Adapters
- Migration helpers
- Comprehensive tests

## Troubleshooting

### "Adapter not yet implemented" Error

If you see this error, it means the adapter for your chosen provider hasn't been created yet. Currently implemented:

- ✅ Firebase Auth
- ✅ Supabase Auth
- ✅ Supabase Database
- ✅ Supabase Storage
- ✅ Supabase Functions
- ❌ Firebase Database (Firestore) - Not yet implemented
- ❌ Firebase Storage - Not yet implemented
- ❌ Firebase Functions - Not yet implemented

### Provider Switching Not Working

1. Check [src/config/backend.ts](../src/config/backend.ts) is updated
2. Restart dev server to pick up config changes
3. Clear browser cache/localStorage
4. Check console for adapter initialization logs

### Hybrid Mode Issues

If using hybrid mode with Firebase auth + Supabase database:
1. Ensure `HYBRID_MODE.syncUserProfiles = true`
2. Check user profile sync in AuthContext
3. Verify Firebase UID is used as `user_id` in Supabase profiles table

## Example: Complete Migration

### Before (Direct Firebase/Supabase)

```typescript
// Multiple imports throughout codebase
import { auth } from '@/integrations/firebase/auth';
import { supabase } from '@/integrations/supabase/client';

// Auth
const user = auth.currentUser;
await signInWithEmailAndPassword(auth, email, password);

// Database
const { data } = await supabase.from('events').select('*');
```

### After (Using Adapters)

```typescript
// Single import
import { getAuthAdapter, getDatabaseAdapter } from '@/adapters/factory';

// Auth (works with both Firebase and Supabase)
const auth = getAuthAdapter();
const user = auth.getCurrentUser();
await auth.signIn(email, password);

// Database (works with both providers)
const db = getDatabaseAdapter();
const { data } = await db.getEvents();
```

## Next Steps

1. **Refactor AuthContext** - Use `getAuthAdapter()` instead of direct Firebase import
2. **Update Pages** - Use `getDatabaseAdapter()` for database operations
3. **Test Switching** - Try switching providers in config and test functionality
4. **Implement Missing Adapters** - Add Firebase database/storage adapters if needed
5. **Remove Direct Imports** - Gradually eliminate direct Firebase/Supabase imports

---

**Questions or Issues?** Check the adapter implementations in [src/adapters/](../src/adapters/) or review the interface definitions in [src/adapters/interfaces.ts](../src/adapters/interfaces.ts).
