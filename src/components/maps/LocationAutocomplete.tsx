import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Keep track if script is loaded globally
let isScriptLoaded = false;
let isScriptLoading = false;
const scriptLoadCallbacks: Array<() => void> = [];

const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isScriptLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    if (isScriptLoading) {
      scriptLoadCallbacks.push(resolve);
      return;
    }

    isScriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
      scriptLoadCallbacks.forEach(cb => cb());
      scriptLoadCallbacks.length = 0;
    };

    script.onerror = () => {
      isScriptLoading = false;
      resolve(); // Resolve anyway to allow fallback
    };

    document.head.appendChild(script);
  });
};

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Enter location',
  className = '',
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fallbackSuggestions, setFallbackSuggestions] = useState<string[]>([]);
  const [showFallback, setShowFallback] = useState(false);

  // Swedish cities fallback
  const swedishLocations = [
    'Uppsala, Sweden',
    'Stockholm, Sweden',
    'Göteborg, Sweden',
    'Malmö, Sweden',
    'Lund, Sweden',
    'Linköping, Sweden',
    'Örebro, Sweden',
    'Västerås, Sweden',
    'Helsingborg, Sweden',
    'Norrköping, Sweden',
  ];

  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'se' }, // Restrict to Sweden
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          onChange(place.formatted_address);
        } else if (place?.name) {
          onChange(place.name);
        }
      });
    } catch (error) {
      console.error('Failed to initialize autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange]);

  const handleFallbackInput = useCallback((inputValue: string) => {
    onChange(inputValue);
    
    if (!isLoaded && inputValue.length > 1) {
      const filtered = swedishLocations.filter(loc =>
        loc.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFallbackSuggestions(filtered);
      setShowFallback(filtered.length > 0);
    } else {
      setShowFallback(false);
    }
  }, [isLoaded, onChange]);

  const selectFallbackLocation = (loc: string) => {
    onChange(loc);
    setShowFallback(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleFallbackInput(e.target.value)}
          onBlur={() => setTimeout(() => setShowFallback(false), 200)}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      
      {/* Fallback suggestions when Google API isn't available */}
      {showFallback && fallbackSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
          {fallbackSuggestions.map((loc, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm"
              onClick={() => selectFallbackLocation(loc)}
            >
              <MapPin className="w-3 h-3 inline mr-2 text-muted-foreground" />
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
