# City Detection and Filtering Feature

## Overview
Implemented automatic city detection and filtering for Swedish users visiting the NowInTown website.

## Features Implemented

### 1. **Six Biggest Swedish Cities Dropdown** ✅
   - Replaced free-text location input with a dropdown select
   - Cities included:
     - Stockholm
     - Göteborg
     - Malmö
     - Umeå
     - Västerås
     - Uppsala
   - Located in: `src/components/events/EventFilters.tsx` (lines ~222-246)

### 2. **Automatic City Detection** ✅
   - On page load, requests user's geolocation permission
   - Uses browser's Geolocation API via `getCurrentPosition()`
   - Reverse geocodes coordinates to match one of the 6 cities
   - Falls back gracefully if user denies permission
   - Located in: `src/pages/Index.tsx` (lines ~118-137)

### 3. **City Display in Header** ✅
   - Shows detected city in the Navbar: "Din stad: Stockholm" (Swedish) or "Your city: Stockholm" (English)
   - Displays as a pill badge in the desktop navigation
   - Updates reactively when city changes
   - Located in: `src/components/layout/Navbar.tsx` (lines ~127-132)

### 4. **Automatic Filter Synchronization** ✅
   - Filter location dropdown automatically selects detected city
   - User sees their current city pre-selected in filters
   - Clearly indicates events are filtered by their location
   - Syncs via `initialLocation` prop from Index to EventFilters

### 5. **Persistent Storage** ✅
   - Detected city saved to `localStorage` as `nit_user_city`
   - Custom event `nit_city_updated` dispatched on changes
   - Navbar listens for updates and refreshes display
   - Survives page refreshes

## Technical Implementation

### Geolocation Flow
```
User visits site
    ↓
Request geolocation permission
    ↓
Get coordinates (lat, lng)
    ↓
Reverse geocode with Google Maps API
    ↓
Match to nearest Swedish city (with aliases)
    ↓
Update filters.location state
    ↓
Save to localStorage
    ↓
Dispatch custom event
    ↓
Navbar updates display
```

### City Matching Algorithm
- Uses `reverseGeocodeCity()` from `src/lib/geo.ts`
- Diacritic-insensitive matching (Göteborg = Goteborg = Gothenburg)
- Handles suburbs/municipalities (e.g., Solna → Stockholm, Lund → Malmö)
- See `cityAliases` map in `geo.ts` for full mapping

### Components Modified
1. **EventFilters.tsx**
   - Added `initialLocation` prop
   - Changed location input to `<Select>` dropdown
   - Auto-syncs when `initialLocation` changes via `useEffect`

2. **Index.tsx**
   - Added city detection `useEffect` on mount
   - Passes `filters.location` as `initialLocation` to EventFilters
   - Updates localStorage and dispatches custom event

3. **Navbar.tsx**
   - Added `userCity` state
   - Listens to `nit_city_updated` custom event
   - Displays city badge in desktop navigation

## User Experience

### First Visit
1. User arrives at homepage
2. Browser prompts: "Allow location access?"
3. If accepted:
   - City detected automatically
   - Header shows: "Din stad: Uppsala"
   - Filter dropdown pre-selects: "Uppsala"
   - Events filtered to Uppsala
4. If denied:
   - No city shown in header
   - Filter defaults to "Alla städer" (All cities)
   - User can manually select city

### Subsequent Visits
- City loaded from localStorage
- No geolocation prompt (already have it)
- Instant filtering on page load

### Manual Override
- User can change city anytime via dropdown
- Selection persists for session
- New selection updates header and filters

## Testing Checklist

- [x] City detection works on first visit
- [x] Header displays detected city
- [x] Filter dropdown pre-selects detected city
- [x] Events filter by selected city
- [x] Manual city change updates both header and results
- [x] Graceful handling when geolocation denied
- [x] City persists after page refresh
- [x] All 6 Swedish cities appear in dropdown
- [x] "Alla städer" (All cities) option available
- [x] Works in both Swedish and English

## Browser Compatibility

### Geolocation API Support
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (desktop and mobile)
- ✅ Opera
- ⚠️ Requires HTTPS in production (except localhost)

### LocalStorage Support
- Universal support across all modern browsers

## Future Enhancements

### Potential Improvements
1. **IP-based fallback**: If user denies geolocation, use IP-to-location API
2. **More cities**: Expand beyond top 6 to include more Swedish cities
3. **Proximity radius**: Show events within X km of detected location
4. **City history**: Remember multiple recently viewed cities
5. **Automatic re-detection**: Prompt to update city if user travels
6. **City-specific landing pages**: SEO-optimized pages per city

### Known Limitations
1. Geolocation requires user permission
2. Only works for the 6 predefined cities
3. Suburbs mapped to main city (may not be desired behavior)
4. Requires Google Maps API key for reverse geocoding

## Related Files

- `src/components/events/EventFilters.tsx` - Filter UI
- `src/pages/Index.tsx` - Main page with city detection
- `src/components/layout/Navbar.tsx` - Header with city display
- `src/lib/geo.ts` - Geolocation utilities
- `src/contexts/LanguageContext.tsx` - i18n support

## Environment Variables

Requires Google Maps API key:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Deployment Notes

**CRITICAL**: Geolocation API only works:
- On localhost (any protocol)
- On HTTPS domains
- Will fail on HTTP in production

Ensure your domain has HTTPS configured (already done for nowintown.se via Vercel).
