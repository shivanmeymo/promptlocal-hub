import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_CLIENT_ID = import.meta.env.VITE_GOOGLE_MAPS_CLIENT_ID || '';

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
    const base = 'https://maps.googleapis.com/maps/api/js';
    const params = new URLSearchParams();
    params.set('libraries', 'places');
    if (GOOGLE_MAPS_API_KEY) {
      params.set('key', GOOGLE_MAPS_API_KEY);
    } else if (GOOGLE_MAPS_CLIENT_ID) {
      // Fallback to client param if key is not provided
      params.set('client', GOOGLE_MAPS_CLIENT_ID);
    }
    script.src = `${base}?${params.toString()}`;
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
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const onChangeRef = useRef(onChange);
  const justSelectedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fallbackSuggestions, setFallbackSuggestions] = useState<string[]>([]);
  const [showFallback, setShowFallback] = useState(false);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        // Create a dummy div for PlacesService
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
      }
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || !autocompleteServiceRef.current || !value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Don't show suggestions if user just selected one
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: 'se' },
          types: ['geocode', 'establishment'],
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [value, isLoaded]);

  const handleInput = useCallback((inputValue: string) => {
    // Always update the parent value immediately when typing manually
    onChangeRef.current(inputValue);
    
    if (!isLoaded && inputValue.length > 1) {
      const filtered = swedishLocations.filter(loc =>
        loc.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFallbackSuggestions(filtered);
      setShowFallback(filtered.length > 0);
    } else {
      setShowFallback(false);
    }
  }, [isLoaded]);

  const selectSuggestion = (description: string) => {
    justSelectedRef.current = true;
    onChangeRef.current(description);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const selectFallbackLocation = (loc: string) => {
    justSelectedRef.current = true;
    onChangeRef.current(loc);
    setShowFallback(false);
  };

  const handleBlur = () => {
    // Delay hiding to allow click events to fire
    setTimeout(() => {
      setShowSuggestions(false);
      setShowFallback(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      
      {/* Google Maps suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm"
              onClick={() => selectSuggestion(suggestion.description)}
            >
              <MapPin className="w-3 h-3 inline mr-2 text-muted-foreground" />
              {suggestion.description}
            </button>
          ))}
        </div>
      )}
      
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
