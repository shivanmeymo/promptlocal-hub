import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface LocationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const NEARBY_CITIES = [
  'Stockholm',
  'Göteborg',
  'Malmö',
  'Uppsala',
];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const LocationDropdown: React.FC<LocationDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select location...',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  // Listen for city updates from automatic detection
  useEffect(() => {
    const handleCityUpdate = (e: CustomEvent) => {
      console.log('📍 LocationDropdown received city update:', e.detail);
      // The parent will update the value prop, no need to call onChange here
    };
    
    window.addEventListener('nit_city_updated', handleCityUpdate as EventListener);
    return () => {
      window.removeEventListener('nit_city_updated', handleCityUpdate as EventListener);
    };
  }, []);

  // Initialize Google Maps AutocompleteService
  useEffect(() => {
    if (!window.google?.maps?.places && GOOGLE_MAPS_API_KEY) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
      };
      document.head.appendChild(script);
    } else if (window.google?.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
  }, []);

  // Fetch autocomplete predictions when user types
  useEffect(() => {
    if (!customLocation || customLocation.length < 2) {
      setAutocompleteSuggestions([]);
      return;
    }

    if (!autocompleteServiceRef.current) {
      return;
    }

    const request = {
      input: customLocation,
      componentRestrictions: { country: 'se' },
      types: ['(cities)'],
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setAutocompleteSuggestions(predictions.map(p => p.description));
      } else {
        setAutocompleteSuggestions([]);
      }
    });
  }, [customLocation]);

  const handleCitySelect = (city: string) => {
    onChange(city);
    setOpen(false);
    setCustomLocation('');
    setAutocompleteSuggestions([]);
  };

  const handleCustomLocationSubmit = () => {
    if (customLocation.trim()) {
      // Extract city name from location (e.g., "Stockholm, Sweden" -> "Stockholm")
      const cityName = customLocation.trim().split(',')[0].trim();
      onChange(cityName);
      setOpen(false);
      setCustomLocation('');
      setAutocompleteSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomLocationSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Extract city name from suggestion (e.g., "Stockholm, Sweden" -> "Stockholm")
    const cityName = suggestion.split(',')[0].trim();
    onChange(cityName);
    setOpen(false);
    setCustomLocation('');
    setAutocompleteSuggestions([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">
              {value || <span className="text-muted-foreground italic">All Locations</span>}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0" 
        align="start" 
        side="bottom"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
      >
        <div className="flex flex-col">
          {/* Current Selection */}
          {value && (
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-primary/5">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{value}</span>
            </div>
          )}

          {/* Custom Location Input */}
          <div className="p-3 border-b relative">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Enter custom location..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                onClick={handleCustomLocationSubmit}
                disabled={!customLocation.trim()}
                size="sm"
              >
                Set
              </Button>
            </div>
            
            {/* Autocomplete Suggestions - Positioned absolutely */}
            {autocompleteSuggestions.length > 0 && (
              <div className="absolute left-3 right-3 top-[calc(100%-12px)] z-50 border rounded-md bg-popover shadow-lg overflow-hidden">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                  Suggestions
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors border-b last:border-b-0 bg-popover"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nearby Cities List */}
          <div className="max-h-[300px] overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nearby Cities
            </div>
            <div className="pb-2">
              {NEARBY_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 hover:bg-accent transition-colors',
                    value === city && 'bg-accent/50 font-medium'
                  )}
                >
                  {city}
                </button>
              ))}
              
              {/* All Locations Option */}
              <button
                onClick={() => handleCitySelect('')}
                className={cn(
                  'w-full text-left px-4 py-2.5 hover:bg-accent transition-colors border-t',
                  !value && 'bg-accent/50 font-medium'
                )}
              >
                <span className="text-muted-foreground italic">
                  All Locations
                </span>
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
