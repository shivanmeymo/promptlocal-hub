import React, { useMemo, useCallback, useState } from 'react';
import { GoogleMap as GoogleMapComponent, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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
const SINGLE_LOCATION_ZOOM = 17; // Close-up view for individual addresses
const MULTI_LOCATION_ZOOM = 12; // Overview for multiple events

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
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [loadError, setLoadError] = useState(false);

  const { isLoaded, loadError: apiLoadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: 'google-map-script',
  });

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
    if (apiLoadError) {
      setLoadError(true);
    }
  }, [apiLoadError]);

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

  const openInGoogleMaps = useCallback(() => {
    const location = singleLocation || (events[0]?.location);
    if (location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
    }
  }, [singleLocation, events]);

  // Error/Loading fallback UI
  if (loadError || apiLoadError) {
    return (
      <div 
        className="rounded-xl bg-muted flex flex-col items-center justify-center gap-4 p-6"
        style={{ height }}
      >
        <MapPin className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium text-foreground">
            {language === 'sv' ? 'Kartan kunde inte laddas' : 'Map could not be loaded'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {singleLocation || events[0]?.location || ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openInGoogleMaps} className="gap-2">
          <ExternalLink className="w-4 h-4" />
          {language === 'sv' ? 'Öppna i Google Maps' : 'Open in Google Maps'}
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className="rounded-xl bg-muted animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <MapPin className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  const currentZoom = singleLocation ? SINGLE_LOCATION_ZOOM : (markers.length === 1 ? SINGLE_LOCATION_ZOOM : zoom);

  return (
    <GoogleMapComponent
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={currentZoom}
      options={mapOptions}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          onClick={() => handleMarkerClick(marker.id)}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40),
          }}
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
  );
};

export default GoogleMapWrapper;
