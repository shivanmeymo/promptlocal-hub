# How to Fix Google Maps API "REQUEST_DENIED" Error

## Current Issue
The Google Maps Geocoding API is returning: `REQUEST_DENIED - The provided API key is invalid.`

## Temporary Solution (Already Implemented)
✅ **Fallback city selection is now active!** Users can:
1. Manually select their city from the dropdown filter
2. The selected city is saved to localStorage
3. The city appears in the Navbar header
4. Future visits remember the selected city

**No API key needed for this to work!**

## Permanent Solution: Fix the Google Maps API Key

### Step 1: Enable Geocoding API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `nowintown`
3. Navigate to **APIs & Services** > **Library**
4. Search for **"Geocoding API"**
5. Click on it and press **"Enable"**

### Step 2: Check API Restrictions
1. Go to **APIs & Services** > **Credentials**
2. Find your API key: `AIzaSyBawwL76SLwc2MyMpY4VzecP3A-dNyAb7MY`
3. Click on it to edit
4. Under **"API restrictions"**:
   - If "Restrict key" is selected, make sure **"Geocoding API"** is in the allowed list
   - OR select "Don't restrict key" (less secure but easier for testing)
5. Under **"Website restrictions"**:
   - Make sure `localhost` is allowed
   - Add: `localhost:5173/*` and `http://localhost:5173/*`
   - Also add your production domain: `nowintown.se/*`

### Step 3: Verify API Key
After making changes:
1. Wait 1-2 minutes for changes to propagate
2. Reload http://localhost:5173/
3. Check browser console - you should see:
   - ✅ Status: OK
   - ✅ Matched city: Stockholm (or your actual city)
   - ✅ Updated filters with location
   - 🗺️ Navbar: City updated event received

## How the Feature Works Now

### Without Valid API Key (Current):
1. User visits site
2. Browser asks for location permission
3. Geocoding fails (API key invalid)
4. **User manually selects city from dropdown**
5. City saved to localStorage
6. City appears in Navbar: "Din stad: Stockholm"
7. Filter shows selected city
8. Future visits remember the choice

### With Valid API Key (After Fix):
1. User visits site
2. Browser asks for location permission
3. **City automatically detected**
4. City saved to localStorage  
5. City appears in Navbar: "Din stad: Stockholm"
6. Filter automatically selects detected city
7. Future visits skip detection (use saved city)

## Testing the Fix

After enabling the Geocoding API:

```javascript
// Open browser console and run:
fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=59.8515,17.6558&key=YOUR_API_KEY')
  .then(r => r.json())
  .then(data => console.log('Status:', data.status, 'Results:', data.results?.length))
```

Should return:
- `Status: OK Results: 5+` ✅

If it still says `REQUEST_DENIED`, check:
1. API key copied correctly
2. Geocoding API is enabled
3. No restrictive API/website restrictions
4. Waited 2 minutes after changes

## Alternative: Use a Different API Key

If the current key can't be fixed, create a new one:
1. Go to **APIs & Services** > **Credentials**
2. Click **"+ CREATE CREDENTIALS"** > **"API key"**
3. Copy the new key
4. Update `.env.local`:
   ```
   VITE_GOOGLE_MAPS_API_KEY="your_new_api_key_here"
   ```
5. Make sure to enable **Geocoding API** for the new key
6. Restart dev server: `npm run dev`

## Cost Estimate

Google Maps Geocoding API pricing (as of 2026):
- **Free tier**: 40,000 requests/month
- **After free tier**: $5 per 1,000 requests

For NowInTown usage:
- 1 request per unique user's first visit
- Subsequent visits use localStorage (no API calls)
- **Estimated monthly cost**: $0 (well under free tier)

## Production Deployment

Before deploying to `nowintown.se`:
1. ✅ Enable Geocoding API
2. ✅ Add `nowintown.se/*` and `https://nowintown.se/*` to API restrictions
3. ✅ Test on production URL
4. ❌ Do NOT commit API key to git (already in .env.local which is .gitignored)

## Support

If you need help:
- Google Cloud Console: https://console.cloud.google.com/
- API Key Management: https://console.cloud.google.com/apis/credentials
- Geocoding API Docs: https://developers.google.com/maps/documentation/geocoding
