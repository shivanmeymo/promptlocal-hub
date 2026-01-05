const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export type LatLng = { lat: number; lng: number };

// Simple in-memory cache for geocoding
const geocodeCache = new Map<string, LatLng>();

export const getCurrentPosition = (): Promise<LatLng> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

export const geocodeAddress = async (address: string): Promise<LatLng | null> => {
  if (!address) return null;
  if (geocodeCache.has(address)) return geocodeCache.get(address)!;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      const ll = { lat, lng };
      geocodeCache.set(address, ll);
      return ll;
    }
  } catch (e) {
    console.error('Failed to geocode address', address, e);
  }
  return null;
};

export const reverseGeocode = async (coords: LatLng): Promise<string | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address as string;
    }
  } catch (e) {
    console.error('Failed to reverse geocode', coords, e);
  }
  return null;
};

// Diacritic-insensitive normalize
const norm = (s: string) => s
  .normalize('NFD')
  .replace(/\p{Diacritic}+/gu, '')
  .toLowerCase();

// Try to get city/locality from Google Geocoding response
const extractLocality = (result: any): string | null => {
  if (!result) return null;
  const comps: any[] = result.address_components || [];
  const typesPriority = [
    'locality',
    'postal_town',
    'administrative_area_level_3',
    'administrative_area_level_2',
  ];
  for (const type of typesPriority) {
    const comp = comps.find(c => (c.types || []).includes(type));
    if (comp?.long_name) return comp.long_name as string;
  }
  // Fallback: sublocality_level_1
  const sub = comps.find(c => (c.types || []).includes('sublocality'));
  return sub?.long_name || null;
};

// Map ASCII variants to Swedish diacritics for our supported cities
const swedishCityCanon = (name: string): string => {
  const map: Record<string, string> = {
    'stockholm': 'Stockholm',
    'goteborg': 'Göteborg', 'gothenburg': 'Göteborg',
    'malmo': 'Malmö',
    'umea': 'Umeå',
    'vasteras': 'Västerås',
    'uppsala': 'Uppsala',
  };
  const key = norm(name);
  return map[key] || name;
};

// Common municipalities/neighborhoods mapped to primary cities
const cityAliases: Record<string, string> = {
  // Stockholm region
  'solna': 'Stockholm',
  'sundbyberg': 'Stockholm',
  'nacka': 'Stockholm',
  'taby': 'Stockholm',
  'tyreso': 'Stockholm',
  'huddinge': 'Stockholm',
  'bromma': 'Stockholm',
  'vasastan': 'Stockholm',
  'sodermalm': 'Stockholm',
  'ostermalm': 'Stockholm',
  // Göteborg region
  'molndal': 'Göteborg',
  'partille': 'Göteborg',
  'kungsbacka': 'Göteborg',
  'hisings backa': 'Göteborg',
  'hisings kärra': 'Göteborg',
  'hisingen': 'Göteborg',
  // Malmö region
  'lund': 'Malmö',
  'vellinge': 'Malmö',
  'limhamn': 'Malmö',
  // Uppsala region
  'knivsta': 'Uppsala',
};

export const reverseGeocodeCity = async (coords: LatLng, allowedCities: string[]): Promise<string | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    // Prefer locality from best result
    const locality = extractLocality(data.results[0]);
    const candidates = new Set<string>();
    if (locality) candidates.add(locality);
    // Add all locality-like components from all results as fallback candidates
    for (const r of data.results) {
      const l = extractLocality(r);
      if (l) candidates.add(l);
    }
    // Compare against allowedCities using diacritic-insensitive match and canonical mapping
    const allowedNorm = allowedCities.map(c => ({ orig: c, n: norm(c) }));
    for (const cand of candidates) {
      const cn = norm(cand);
      // Alias mapping first (e.g., Solna -> Stockholm)
      const alias = cityAliases[cn];
      if (alias) {
        const aMatch = allowedNorm.find(a => a.orig === alias);
        if (aMatch) return aMatch.orig;
      }
      const canon = norm(swedishCityCanon(cand));
      const match = allowedNorm.find(a => a.n === cn || a.n === canon);
      if (match) return match.orig;
    }
    // If still not found, try substring containment
    for (const cand of candidates) {
      const cn = norm(cand);
      const alias = cityAliases[cn];
      if (alias) {
        const aMatch = allowedNorm.find(a => a.orig === alias);
        if (aMatch) return aMatch.orig;
      }
      const match = allowedNorm.find(a => cn.includes(a.n) || a.n.includes(cn));
      if (match) return match.orig;
    }
  } catch (e) {
    console.error('Failed to determine city from reverse geocode', coords, e);
  }
  return null;
};

export const haversineKm = (a: LatLng, b: LatLng): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng));
  return R * c;
};
