/**
 * Address lookup, backed by OpenStreetMap's Nominatim.
 *
 * Nominatim is free and needs no key, which is why it's here. The trade-offs
 * are real: roughly one request per second is the published limit, and South
 * African street-level coverage is weaker than a paid provider's. Everything
 * talks through this module so switching to Google Places later means
 * rewriting one file rather than every caller.
 */

const ENDPOINT = "https://nominatim.openstreetmap.org";

/** Biases results towards South Africa without excluding anywhere else. */
const COUNTRY_BIAS = "za";

export interface GeoResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
}

const toResult = (place: NominatimPlace): GeoResult => ({
  address: place.display_name,
  latitude: Number.parseFloat(place.lat),
  longitude: Number.parseFloat(place.lon),
});

/**
 * Suggestions for a partial address. Callers should debounce — Nominatim's
 * usage policy is about one request a second, and a request per keystroke
 * would breach it immediately.
 */
export const searchAddresses = async (
  queryText: string,
  signal?: AbortSignal,
  limit = 5
): Promise<GeoResult[]> => {
  const q = queryText.trim();
  // Below three characters the results are noise, and it's a wasted request.
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    format: "json",
    q,
    limit: String(limit),
    addressdetails: "1",
    countrycodes: COUNTRY_BIAS,
  });

  const response = await fetch(`${ENDPOINT}/search?${params}`, { signal });
  if (!response.ok) throw new Error(`Address search failed (${response.status})`);

  const data = (await response.json()) as NominatimPlace[];
  return data.map(toResult);
};

/** Turns coordinates into a readable address, falling back to the numbers. */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const params = new URLSearchParams({
    format: "json",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "16",
    addressdetails: "1",
  });

  try {
    const response = await fetch(`${ENDPOINT}/reverse?${params}`);
    const data = (await response.json()) as { display_name?: string };
    if (data.display_name) return data.display_name;
  } catch {
    // Fall through — coordinates are still a usable answer.
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};
