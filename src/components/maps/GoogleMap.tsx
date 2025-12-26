import React, { useMemo, useCallback } from 'react';
import { GoogleMap as GoogleMapComponent, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBKPUkBChJ6bgDQHz2cF0nPH_MYqRwBbtw';

interface MapEvent {
  id: string;
  title: string;
  location: string;
  start_date: string;
  category?: string;
}

interface GoogleMapProps {
  events?: MapEvent[];
  singleLocation?: string;
  height?: string;
  zoom?: number;
  onEventClick?: (eventId: string) => void;
}

const defaultCenter = { lat: 59.8586, lng: 17.6389 }; // Uppsala, Sweden

const mapContainerStyle = {
  width: '100%',
  borderRadius: '0.75rem',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

// Simple geocoding cache
const geocodeCache = new Map<string, { lat: number; lng: number }>();

export const GoogleMapWrapper: React.FC<GoogleMapProps> = ({
  events = [],
  singleLocation,
  height = '400px',
  zoom = 12,
  onEventClick,
}) => {
  const { language } = useLanguage();
  const [markers, setMarkers] = React.useState<Array<{ id: string; title: string; position: { lat: number; lng: number } }>>([]);
  const [selectedMarker, setSelectedMarker] = React.useState<string | null>(null);
  const [mapCenter, setMapCenter] = React.useState(defaultCenter);

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (geocodeCache.has(address)) {
      return geocodeCache.get(address)!;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const position = { lat, lng };
        geocodeCache.set(address, position);
        return position;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }, []);

  React.useEffect(() => {
    const geocodeLocations = async () => {
      if (singleLocation) {
        const position = await geocodeAddress(singleLocation);
        if (position) {
          setMarkers([{ id: 'single', title: singleLocation, position }]);
          setMapCenter(position);
        }
      } else if (events.length > 0) {
        const newMarkers: Array<{ id: string; title: string; position: { lat: number; lng: number } }> = [];
        
        for (const event of events.slice(0, 50)) {
          const position = await geocodeAddress(event.location);
          if (position) {
            newMarkers.push({ id: event.id, title: event.title, position });
          }
        }
        
        setMarkers(newMarkers);
        
        if (newMarkers.length > 0) {
          const avgLat = newMarkers.reduce((sum, m) => sum + m.position.lat, 0) / newMarkers.length;
          const avgLng = newMarkers.reduce((sum, m) => sum + m.position.lng, 0) / newMarkers.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
        }
      }
    };

    geocodeLocations();
  }, [events, singleLocation, geocodeAddress]);

  const containerStyle = useMemo(() => ({
    ...mapContainerStyle,
    height,
  }), [height]);

  const handleMarkerClick = useCallback((markerId: string) => {
    setSelectedMarker(markerId);
    if (onEventClick && markerId !== 'single') {
      onEventClick(markerId);
    }
  }, [onEventClick]);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMapComponent
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={singleLocation ? 15 : zoom}
        options={mapOptions}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => handleMarkerClick(marker.id)}
          />
        ))}
        
        {selectedMarker && markers.find(m => m.id === selectedMarker) && (
          <InfoWindow
            position={markers.find(m => m.id === selectedMarker)!.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2">
              <p className="font-medium text-sm text-foreground">
                {markers.find(m => m.id === selectedMarker)?.title}
              </p>
              {selectedMarker !== 'single' && (
                <button
                  onClick={() => onEventClick?.(selectedMarker)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  {language === 'sv' ? 'Visa event' : 'View event'}
                </button>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMapComponent>
    </LoadScript>
  );
};

export default GoogleMapWrapper;
