import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import { reverseGeocode, searchAddresses, type GeoResult } from '@/lib/geocoding';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  selectedLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
}

/** Nominatim asks for roughly one request a second; this stays well inside it. */
const DEBOUNCE_MS = 450;

export const LocationPicker = ({ onLocationSelect, selectedLocation }: LocationPickerProps) => {
  const [address, setAddress] = useState(selectedLocation?.address || '');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const { requestLocation, loading } = useGeolocation();
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  // Set when a suggestion is picked, so the resulting value change doesn't
  // immediately trigger a fresh search for the text we just inserted.
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const q = address.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchAddresses(q, controller.signal));
        setOpen(true);
      } catch (error) {
        // Aborts are the normal case on every keystroke, not a failure.
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const choose = (result: GeoResult) => {
    skipNextSearch.current = true;
    setAddress(result.address);
    setResults([]);
    setOpen(false);
    onLocationSelect(result);
  };

  const handleCurrentLocation = async () => {
    // requestLocation returns the fix directly; reading latitude/longitude off
    // the hook here would give the previous render's values.
    const coords = await requestLocation();
    if (!coords) return;

    const resolved = await reverseGeocode(coords.latitude, coords.longitude);
    skipNextSearch.current = true;
    setAddress(resolved);
    setResults([]);
    setOpen(false);
    onLocationSelect({
      address: resolved,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    toast({ title: 'Location set', description: resolved });
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Reminder Location (Optional)</Label>

      <div className="space-y-3">
        <div className="relative" ref={containerRef}>
          <Input
            placeholder="Start typing an address…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            autoComplete="off"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}

          {open && results.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-medium">
              {results.map((result) => (
                <li key={`${result.latitude},${result.longitude}`}>
                  <button
                    type="button"
                    // mousedown, so the input doesn't blur and close the list
                    // before the click lands.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(result);
                    }}
                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">{result.address}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {open && !searching && address.trim().length >= 3 && results.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              No matches. Try a suburb or city as well as the street.
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleCurrentLocation}
          disabled={loading}
          className="w-full"
        >
          <Navigation className="mr-2 h-4 w-4" />
          {loading ? 'Getting location…' : 'Use Current Location'}
        </Button>

        {selectedLocation && selectedLocation.address && (
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedLocation.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    skipNextSearch.current = true;
                    setAddress('');
                    setResults([]);
                    onLocationSelect({ address: '', latitude: 0, longitude: 0 });
                  }}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
