# Production Security Checklist

This document outlines critical security tasks that must be completed before deploying to production.

## ✅ Completed

- [x] Firebase Authentication configured (Email/Password + Google OAuth)
- [x] Database schema migrated to support Firebase UIDs (TEXT instead of UUID)
- [x] User sync between Firebase and Supabase implemented
- [x] Role-based access control (RBAC) utility created
- [x] Password reset migrated from Supabase to Firebase
- [x] Documentation created (AUTHENTICATION_GUIDE.md)

## 🔴 Critical - Must Complete Before Production

### 1. Server-Side Token Verification

**Status:** Not implemented  
**Priority:** HIGH  
**Risk:** Without this, malicious users can forge user IDs

**Tasks:**
- [ ] Implement Firebase Admin SDK in Supabase Edge Functions
- [ ] Create middleware to verify Firebase ID tokens
- [ ] Update all Edge Functions to require valid Firebase token
- [ ] Reject requests without valid token

**Example Implementation:**
```typescript
// In Supabase Edge Function
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Verify token middleware
async function verifyFirebaseToken(authHeader: string) {
  const token = authHeader.replace('Bearer ', '');
  const decodedToken = await getAuth().verifyIdToken(token);
  return decodedToken.uid; // This is the verified Firebase UID
}
```

### 2. Re-Enable Row Level Security (RLS)

**Status:** Disabled (for development)  
**Priority:** HIGH  
**Risk:** Any user can read/modify any data

**Tasks:**
- [ ] Design RLS policies that work with Firebase UIDs
- [ ] Test policies in development environment
- [ ] Create migration to enable RLS on all tables
- [ ] Verify policies work with current application flow

**Example Policy:**
```sql
-- Allow users to read only their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (user_id = current_setting('request.jwt.claim.sub'));
```

### 3. API Rate Limiting

**Status:** Not implemented  
**Priority:** MEDIUM  
**Risk:** Abuse, DDoS, excessive costs

**Tasks:**
- [ ] Implement rate limiting in Supabase Edge Functions
- [ ] Set reasonable limits per endpoint (e.g., 100 requests/hour)
- [ ] Add rate limit headers to responses
- [ ] Log rate limit violations

**Tools:**
- Use `@upstash/redis` for distributed rate limiting
- Or use Cloudflare for API gateway rate limiting

### 4. Environment Variable Security

**Status:** Partially implemented  
**Priority:** MEDIUM  
**Risk:** Accidental exposure of API keys

**Tasks:**
- [ ] Review all environment variables in .env.local
- [ ] Ensure VITE_* prefix only for public variables
- [ ] Move sensitive keys to server-side only
- [ ] Add .env.local to .gitignore (verify it's there)
- [ ] Document all required env vars in README

### 5. Input Validation & Sanitization

**Status:** Basic validation exists  
**Priority:** MEDIUM  
**Risk:** XSS, SQL injection, data corruption

**Tasks:**
- [ ] Add Zod or Yup schemas for all user inputs
- [ ] Validate all data before database operations
- [ ] Sanitize HTML content in event descriptions
- [ ] Escape special characters in search queries

### 6. CORS Configuration

**Status:** Unknown  
**Priority:** MEDIUM  
**Risk:** Unauthorized cross-origin requests

**Tasks:**
- [ ] Configure CORS in Supabase Edge Functions
- [ ] Whitelist only your production domain(s)
- [ ] Test CORS headers in production environment

### 7. Logging & Monitoring

**Status:** Basic console.log exists  
**Priority:** LOW  
**Risk:** Difficult to debug production issues

**Tasks:**
- [ ] Set up structured logging (e.g., Sentry, LogRocket)
- [ ] Log authentication failures
- [ ] Log authorization failures (RBAC checks)
- [ ] Set up alerts for critical errors
- [ ] Monitor Firebase usage and costs

## 🟡 Recommended - Should Complete Soon

### 8. Two-Factor Authentication (2FA)

**Status:** Not implemented  
**Priority:** LOW  
**Risk:** Account takeover via password compromise

**Tasks:**
- [ ] Implement Firebase Multi-Factor Authentication
- [ ] Add UI for 2FA enrollment
- [ ] Test 2FA flow with authenticator apps

### 9. Email Verification Enforcement

**Status:** Not enforced  
**Priority:** LOW  
**Risk:** Fake accounts, spam

**Tasks:**
- [ ] Require email verification before accessing features
- [ ] Add UI prompts for unverified users
- [ ] Test verification flow

### 10. Account Deletion

**Status:** Partial implementation exists  
**Priority:** LOW  
**Risk:** GDPR compliance issues

**Tasks:**
- [ ] Ensure Firebase user deletion also deletes Supabase data
- [ ] Test account deletion flow end-to-end
- [ ] Add confirmation dialog with re-authentication

## 🔵 Future Enhancements

- [ ] Implement session management (refresh tokens)
- [ ] Add IP-based security (geo-blocking, suspicious activity)
- [ ] Implement OAuth with additional providers (Apple, Facebook)
- [ ] Add account recovery mechanisms
- [ ] Implement audit logging for sensitive operations

## Testing Checklist

Before deploying to production, test the following scenarios:

- [ ] User registration with email/password
- [ ] User login with email/password
- [ ] User login with Google OAuth
- [ ] Password reset flow
- [ ] Email change flow
- [ ] Account deletion flow
- [ ] Admin creating events (RBAC check)
- [ ] Non-admin attempting to create events (should fail)
- [ ] User accessing their own data
- [ ] User attempting to access other user's data (should fail when RLS enabled)

## Deployment Steps

1. Complete all "Critical" tasks above
2. Run full test suite
3. Enable RLS policies
4. Deploy to staging environment
5. Perform security audit
6. Monitor logs for 24 hours in staging
7. Deploy to production
8. Monitor logs closely for first 48 hours

## Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)

---

**Last Updated:** 2025-01-06  
**Status:** Development - Not Ready for Production
