# Authentication & Authorization Documentation

## Authentication Flow

### Current Setup: Firebase for Auth + Supabase for Data

**Firebase handles:**
- User sign-in/sign-up (Email/Password, Google OAuth)
- Session management
- Token generation

**Supabase handles:**
- All data storage
- User profiles (linked by Firebase UID)
- Events, roles, subscriptions

---

## Protected Operations

### Authentication Required ✅

These operations require a logged-in Firebase user:

1. **Profile Management**
   - View own profile: `GET /profiles?user_id=eq.{firebaseUid}`
   - Update own profile: `PATCH /profiles?user_id=eq.{firebaseUid}`
   - Delete own profile: Firebase Auth deletion triggers Supabase cleanup

2. **Event Management**
   - Create event: `POST /events` (requires user_id from Firebase)
   - Update own event: `PATCH /events?user_id=eq.{firebaseUid}`
   - Delete own event: `DELETE /events?user_id=eq.{firebaseUid}`

3. **Subscriptions**
   - Subscribe to events: `POST /event_subscribers`
   - Unsubscribe: `DELETE /event_subscribers`

4. **Admin Operations**
   - Check user role: `GET /user_roles?user_id=eq.{firebaseUid}`
   - Approve/reject events (admin only)
   - View all pending events (admin only)

### No Authentication Required 🌐

Public operations:

1. **Browsing**
   - View approved events: `GET /events?status=eq.approved`
   - View public events: `GET /events_public`
   - Search events

2. **Contact Forms**
   - Send contact message (with Turnstile CAPTCHA)

---

## Implementation Checklist

### Current Status

- ✅ Firebase Auth configured (Email/Password + Google)
- ✅ User sync to Supabase on login
- ✅ RLS disabled (app-level security)
- ⚠️ **No server-side validation** - Anyone with Supabase URL can modify data

### Required Improvements for Production

#### High Priority 🔴

- [ ] Add Firebase token verification in Supabase Edge Functions
- [ ] Implement role-based access control (RBAC)
- [ ] Add rate limiting to prevent abuse
- [ ] Validate user permissions before sensitive operations

#### Medium Priority 🟡

- [ ] Re-enable RLS with custom Firebase token validation
- [ ] Add audit logging for admin actions
- [ ] Implement API key rotation strategy

#### Low Priority 🟢

- [ ] Add session timeout handling
- [ ] Implement refresh token logic
- [ ] Add MFA (Multi-Factor Authentication)

---

## Code Examples

### Checking if User is Authenticated

```typescript
// In React components
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile } = useAuth();
  
  if (!user) {
    return <div>Please sign in</div>;
  }
  
  // User is authenticated, proceed with Firebase UID
  const firebaseUid = user.uid;
}
```

### Checking User Role

```typescript
const checkAdmin = async (firebaseUid: string) => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', firebaseUid)
    .eq('role', 'admin')
    .maybeSingle();
    
  return !!data;
};
```

### Server-Side Token Validation (TODO)

```typescript
// In Supabase Edge Function
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

export async function handler(req: Request) {
  // Get Firebase token from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    
    // Now use firebaseUid for Supabase operations
    // ...
  } catch (error) {
    return new Response('Invalid token', { status: 401 });
  }
}
```

---

## Security Considerations

### Current Vulnerabilities

1. **No Server-Side Validation**
   - Supabase API keys are public
   - Anyone can call Supabase REST API directly
   - **Mitigation**: Trust client-side checks temporarily, implement server validation ASAP

2. **No Rate Limiting**
   - Users can spam API calls
   - **Mitigation**: Add Supabase Edge Functions with rate limiting

3. **RLS Disabled**
   - Database has no built-in security
   - **Mitigation**: All security logic in application code

### Best Practices

1. **Never trust client-side data**
2. **Always verify Firebase UID matches the resource owner**
3. **Check user roles before admin operations**
4. **Validate all inputs**
5. **Log sensitive operations**

---

## Testing Authentication

### Manual Testing Checklist

- [ ] Sign up with email/password
- [ ] Sign in with Google
- [ ] Create event (authenticated)
- [ ] Try to edit someone else's event (should fail)
- [ ] Access admin panel (should check role)
- [ ] Sign out and try protected action (should fail)

### Browser Console Tests

```javascript
// Check if user is authenticated
console.log('Current user:', useAuth().user);

// Try to access profiles
supabase.from('profiles').select('*').then(r => console.log(r));

// Check your own profile
const uid = useAuth().user?.uid;
supabase.from('profiles').select('*').eq('user_id', uid).then(r => console.log(r));
```
