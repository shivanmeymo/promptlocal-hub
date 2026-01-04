# Custom Domain Setup Guide with HTTPS

This guide ensures your application works securely on https://nowintown.se

## ✅ Code Changes (Already Dynamic)

Your codebase already uses `window.location.origin` for dynamic URLs, so it will automatically adapt to HTTPS:

- ✅ Password reset redirects: `${window.location.origin}/auth`
- ✅ OAuth callbacks: Uses current domain (HTTPS)
- ✅ Profile redirects: `${window.location.origin}/profile`

## 🔧 Firebase Console Configuration

### 1. Add Authorized Domain

1. Go to [Firebase Console](https://console.firebase.google.com/project/nowintown/authentication/settings)
2. Navigate to **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain**
4. Add: `nowintown.se`
5. Click **Add**

### 2. Update OAuth Redirect URIs (Google Cloud Console)

Since you're using Google Sign-In, you need to update Google Cloud:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=nowintown)
2. Find your OAuth 2.0 Client ID (the one used in your app)
3. Under **Authorized JavaScript origins**, add:
   - `https://nowintown.se`
4. Under **Authorized redirect URIs**, add:
   - `https://nowintown.se/__/auth/handler` (Firebase auth handler)
5. Click **Save**

**Important:** Only use HTTPS for production. HTTP is insecure and not supported by Firebase Auth.

## 🌐 Supabase Configuration

### Update Allowed Redirect URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/suueubckrgtiniymoxio/auth/url-configuration)
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add:
   - `https://nowintown.se/**` (wildcard for all paths)
4. Under **Site URL**, set to: `https://nowintown.se`
5. Click **Save**

## 📝 Environment Variables

Your `.env.local` is already configured correctly. No changes needed for the custom domain.

## 🔒 HTTPS Recommendation
Setup (Vercel - Automatic)

Since you're deploying on Vercel, HTTPS is **automatically enabled** for your custom domain:

### Step 1: Add Custom Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `nowintown.se`
6. Click **Add**

### Step 2: Configure DNS Records

Vercel will provide DNS records. Add these to your domain registrar:

### Vercel & DNS
- [ ] Add `nowintown.se` domain in Vercel Dashboard
- [ ] Configure DNS records at your domain registrar
- [ ] Wait for DNS propagation (can take up to 48 hours)
- [ ] Verify SSL certificate is issued (green padlock in browser)
- [ ] Test HTTPS redirect works (http:// redirects to https://)

### Firebase & OAuth
- [ ] Add `nowintown.se` to Firebase authorized domains
- [ ] Update Google OAuth redirect URIs in Google Cloud Console (HTTPS only)
- [ ] Update Supabase redirect URLs (HTTPS only)

### Testing
- [ ] Test login with email/password on `https://nowintown.se`
- [ ] Test Google sign-in on `https://nowintown.se`
- [ ] Test password reset on `https://nowintown.se`
- [ ] Verify all pages load correctly with HTTPS
- [ ] Check browser console for mixed content warnings
- [ ] Test on mobile devices
- [ ] Verify SSL certificate is valid (check certificate details
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: Auto or 3600
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto or 3600
```

### Step 3: SSL Certificate (Automatic)

Vercel automatically provisions SSL certificate from Let's Encrypt:
- Certificate generation takes 1-5 minutes
- Auto-renews every 90 days
- HTTPS is enforced by default

### Step 4: Force HTTPS Redirect

Add this to your vercel.json to enforce HTTPS:
## 🚀 Deployment Checklist

- [ ] Add `nowintown.se` to Firebase authorized domains
- [ ] Update Google OAuth redirect URIs in Google Cloud Console
- [ ] Update Supabase redirect URLs
- [ ] Test login with email/password on `nowintown.se`
- [ ] Test Google sign-in on `nowintown.se`
- [ ] Test password reset on `nowintown.se`
- [ ] Verify all pages load correctly
- [ ] Check browser console for CORS errors
- [ ] Test on mobile devices
- [ ] Enable HTTPS (strongly recommended)

## 🐛 Troubleshooting

### Google Sign-In Fails

**Error:** "redirect_uri_mismatch" or "origin_mismatch"

**Solution:** 
- Verify `nowintown.se` is in **Authorized JavaScript origins** in Google Cloud Console
- Verify Firebase auth handler URL is in **Authorized redirect URIs**
- Clear browser cache and try again

### Firebase Auth Error

**Error:** "auth/unauthorized-domain"

**Solution:**
- Verify `nowintown.se` is in Firebase Console → Authentication → Settings → Authorized domains
- Wait 5-10 minutes for changes to propagate

### CORS Errors

**Error:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
- Check Supabase Edge Functions CORS configuration
- Verify Supabase allows `nowintown.se` in redirect URLs
- Check browser developer tools for the actual request origin

## 📚 Additional Resources

- [Firebase Authorized Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#customize-domains)
- [Google OAuth Configuration](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth#configure-redirect-urls)

---

**Note:** Your code is already domain-agnostic using `window.location.origin`. You only need to update the external service configurations above.
