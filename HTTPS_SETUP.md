# Custom Domain Setup Guide with HTTPS

This guide ensures your application works securely on https://nowintown.se

## ✅ Code Changes Completed

Your codebase is now configured for HTTPS:

- ✅ Security headers added to vercel.json (HSTS, CSP, etc.)
- ✅ Canonical URL updated to HTTPS
- ✅ Dynamic URLs use `window.location.origin` (auto-adapts to HTTPS)
- ✅ Password reset redirects work with HTTPS
- ✅ OAuth callbacks work with HTTPS

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
   - `https://nowintown.se/__/auth/handler`
5. Click **Save**

**Important:** Only use HTTPS for production. HTTP is insecure and not supported by Firebase Auth.

## 🌐 Supabase Configuration

### Update Allowed Redirect URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/suueubckrgtiniymoxio/auth/url-configuration)
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add:
   - `https://nowintown.se/**`
4. Under **Site URL**, set to: `https://nowintown.se`
5. Click **Save**

## 🔒 HTTPS Setup (Vercel - Automatic)

Since you're deploying on Vercel, HTTPS is **automatically enabled** for your custom domain.

### Step 1: Add Custom Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `nowintown.se`
6. Click **Add**

### Step 2: Configure DNS Records

Vercel will provide DNS records. Add these to your domain registrar:

**Option A: Using A Record (Recommended)**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Option B: Using CNAME**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Step 3: SSL Certificate (Automatic)

Vercel automatically provisions SSL certificate from Let's Encrypt:
- ✅ Certificate generation takes 1-5 minutes
- ✅ Auto-renews every 90 days
- ✅ HTTPS is enforced by default
- ✅ HTTP automatically redirects to HTTPS

### Step 4: Security Headers (Already Configured)

Your `vercel.json` now includes these security headers:

- **HSTS**: Forces HTTPS for 1 year, includes subdomains
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables browser XSS protection
- **Referrer-Policy**: Controls referrer information

## 🚀 Deployment Checklist

### Vercel & DNS
- [ ] Add `nowintown.se` domain in Vercel Dashboard
- [ ] Configure DNS A or CNAME records at your domain registrar
- [ ] Wait for DNS propagation (15 minutes to 48 hours)
- [ ] Verify SSL certificate is issued (green padlock in browser)
- [ ] Test HTTP→HTTPS redirect works automatically

### Firebase & OAuth
- [ ] Add `nowintown.se` to Firebase authorized domains
- [ ] Update Google OAuth redirect URIs (HTTPS only)
- [ ] Update Supabase redirect URLs (HTTPS only)

### Testing
- [ ] Visit `http://nowintown.se` - should redirect to HTTPS
- [ ] Test login with email/password on `https://nowintown.se`
- [ ] Test Google sign-in on `https://nowintown.se`
- [ ] Test password reset on `https://nowintown.se`
- [ ] Check browser console for mixed content warnings
- [ ] Verify SSL certificate details (click padlock icon)
- [ ] Test on mobile devices
- [ ] Run [SSL Labs Test](https://www.ssllabs.com/ssltest/)

## 🐛 Troubleshooting

### DNS Not Resolving

**Issue:** Website not loading after adding domain

**Solution:**
- DNS changes can take up to 48 hours to propagate globally
- Use [WhatsMyDNS](https://whatsmydns.net) to check propagation status
- Clear browser DNS cache: Chrome → `chrome://net-internals/#dns` → Clear cache
- Try accessing from different network (mobile data vs WiFi)

### SSL Certificate Not Issued

**Issue:** "Your connection is not private" or "NET::ERR_CERT_COMMON_NAME_INVALID"

**Solution:**
- Vercel needs valid DNS records before issuing certificate
- Check Vercel dashboard for certificate status
- Ensure DNS records point to Vercel correctly
- Wait 5-10 minutes after DNS is configured
- Contact Vercel support if it takes longer than 1 hour

### Google Sign-In Fails

**Error:** "redirect_uri_mismatch" or "origin_mismatch"

**Solution:**
- Verify `https://nowintown.se` (with HTTPS) is in Google Cloud Console
- Verify `https://nowintown.se/__/auth/handler` is in Authorized redirect URIs
- Changes take effect immediately, but clear browser cache
- Check you're using the correct OAuth Client ID

### Firebase Auth Error

**Error:** "auth/unauthorized-domain"

**Solution:**
- Verify `nowintown.se` is in Firebase authorized domains (without protocol)
- Wait 5-10 minutes for Firebase changes to propagate
- Try in incognito/private browsing mode
- Check Firebase Console logs for specific errors

### Mixed Content Warnings

**Issue:** Console shows "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource"

**Solution:**
- Check all external resources use HTTPS (images, fonts, scripts)
- Your code already uses HTTPS for external APIs
- Update any hardcoded `http://` URLs to `https://`

## 📊 Performance & SEO

With HTTPS enabled, you get:

- ✅ **Better SEO**: Google ranks HTTPS sites higher
- ✅ **HTTP/2**: Faster page loads (automatic with HTTPS)
- ✅ **Service Workers**: Enable PWA features, push notifications
- ✅ **Geolocation API**: Requires HTTPS
- ✅ **Camera/Microphone**: Browser requires HTTPS
- ✅ **Trust**: Green padlock increases user confidence

## 📚 Additional Resources

- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [Vercel DNS Configuration](https://vercel.com/docs/concepts/projects/domains/add-a-domain#option-1:-using-a-nameserver)
- [Firebase Authorized Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#customize-domains)
- [Google OAuth Configuration](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth#configure-redirect-urls)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

---

## Summary

Your code is ready for HTTPS! Just complete these steps:

1. **Vercel**: Add domain, configure DNS
2. **Wait**: DNS propagation (15 mins - 48 hours)
3. **Firebase**: Add `nowintown.se` to authorized domains
4. **Google Cloud**: Add HTTPS URLs to OAuth settings
5. **Supabase**: Add HTTPS URLs to redirect configuration
6. **Test**: Verify everything works on `https://nowintown.se`

Your application will automatically use HTTPS for all operations thanks to `window.location.origin`.
