# Fix: Firebase Google Sign-In "auth/invalid-credential" Error

## Problem
When logging in with Google as shivan.meymo@gmail.com, you get:
```
Firebase error: auth/invalid-credential
```

## Root Causes
1. Firebase OAuth Client ID not configured properly
2. Authorized domains not set in Firebase Console
3. OAuth consent screen not configured in Google Cloud Console

## Solution: Step-by-Step Fix

### Step 1: Configure Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `nowintown`
3. **Navigate to Authentication**:
   - Click "Authentication" in left sidebar
   - Go to "Sign-in method" tab
   - Find "Google" provider

4. **Enable Google Sign-In**:
   - Click on Google
   - Toggle "Enable" switch to ON
   - **Important**: Note down the "Web client ID" (starts with numbers, ends with `.apps.googleusercontent.com`)
   - Click "Save"

### Step 2: Add Authorized Domains

Still in Firebase Console → Authentication → Settings:

1. **Go to "Authorized domains" tab**
2. **Add these domains**:
   - `localhost` (already there by default)
   - Your production domain (e.g., `nowintown.se`)
   - Any other domains you use (e.g., `www.nowintown.se`)

3. Click "Add domain" for each one

### Step 3: Configure Google Cloud Console OAuth

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select your Firebase project**
3. **Navigate to**:
   - APIs & Services → Credentials
4. **Find your OAuth 2.0 Client ID** (should match Firebase's Web client ID)
5. **Click Edit** (pencil icon)
6. **Add Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost
   https://YOUR_DOMAIN.com
   https://www.YOUR_DOMAIN.com
   ```

7. **Add Authorized redirect URIs**:
   ```
   http://localhost:5173
   http://localhost
   https://YOUR_DOMAIN.com
   https://www.YOUR_DOMAIN.com
   https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler
   ```

8. Click "Save"

### Step 4: Configure OAuth Consent Screen

In Google Cloud Console:

1. **Navigate to**: APIs & Services → OAuth consent screen
2. **User Type**: External (unless you have Google Workspace)
3. **Fill in required fields**:
   - App name: `NowInTown`
   - User support email: `shivan.meymo@gmail.com`
   - Developer contact: `shivan.meymo@gmail.com`
4. **Add Test Users** (if in Testing mode):
   - Click "Add Users"
   - Add: `shivan.meymo@gmail.com`
   - This is **CRITICAL** if your app is in Testing mode
5. Click "Save and Continue"

### Step 5: Verify Firebase Configuration in Code

Check that your Firebase config in code matches Firebase Console:

1. **Open**: `src/integrations/firebase/client.ts`
2. **Verify these values match Firebase Console** (Project Settings → General):
   - API Key
   - Auth Domain  
   - Project ID
   - App ID

### Step 6: Test the Fix

1. **Clear browser cache and cookies**
2. **Restart dev server**:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
   npm run dev
   ```
3. **Open browser** and navigate to login page
4. **Try Google Sign-In** with `shivan.meymo@gmail.com`

## Common Issues & Solutions

### Issue: "This app hasn't been verified"
**Solution**: 
- Your OAuth consent screen is in "Testing" mode
- Add `shivan.meymo@gmail.com` as a test user in OAuth consent screen
- OR publish the app for production

### Issue: "redirect_uri_mismatch"
**Solution**:
- Check that `http://localhost:5173` is in Authorized redirect URIs
- Check that your Firebase auth domain redirect is included:
  `https://nowintown.firebaseapp.com/__/auth/handler`

### Issue: Still "auth/invalid-credential"
**Solution**:
- Make sure OAuth consent screen has test users if in Testing mode
- Verify the Web client ID in Firebase matches Google Cloud Console
- Try incognito/private browser window
- Check browser console for more detailed error messages

### Issue: "Access blocked: This app's request is invalid"
**Solution**:
- OAuth consent screen not properly configured
- Missing required fields in OAuth consent screen
- App domain verification needed

## Quick Checklist

✅ Firebase Authentication → Google provider enabled  
✅ Authorized domains added (localhost + production)  
✅ Google Cloud Console OAuth client configured  
✅ Authorized JavaScript origins added  
✅ Authorized redirect URIs added  
✅ OAuth consent screen configured  
✅ Test user (`shivan.meymo@gmail.com`) added (if in Testing mode)  
✅ Browser cache cleared  
✅ Dev server restarted  

## Alternative: Enable Email/Password Login

If Google Sign-In continues to have issues, you can use email/password:

1. **Firebase Console** → Authentication → Sign-in method
2. **Enable "Email/Password"**
3. **Create account for admin**:
   ```javascript
   // In browser console after visiting /auth:
   // Use the Sign Up tab with:
   // Email: shivan.meymo@gmail.com
   // Password: [your secure password]
   // Name: Shivan Meymo
   ```

## Support Links

- Firebase Authentication Docs: https://firebase.google.com/docs/auth/web/google-signin
- OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent
- Firebase Console: https://console.firebase.google.com

---

**Need Help?**
Check browser console (F12) for detailed error messages. The error code will help identify the specific issue.
