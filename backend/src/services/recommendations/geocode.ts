import { MemoryCache } from './cache.js';
import { hasProviderKey, isRecommendationProviderAllowed } from '../../config/env.js';

type Coordinates = {
  latitude: number;
  longitude: number;
};

const geocodeCache = new MemoryCache<Coordinates>(1000 * 60 * 60 * 6);

export async function geocodeDestination(destination: string): Promise<Coordinates | null> {
  const cacheKey = destination.trim().toLowerCase();
  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY as string;
  const providers = [
    () => geocodeWithGoogle(destination, googleApiKey),
    () => geocodeWithNominatim(destination)
  ];

  for (const resolver of providers) {
    const result = await resolver();
    if (result) {
      geocodeCache.set(cacheKey, result);
      return result;
    }
  }

  return null;
}

async function geocodeWithGoogle(destination: string, apiKey: string): Promise<Coordinates | null> {
  if (!isRecommendationProviderAllowed('google') || !hasProviderKey('google')) {
    return null;
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.location,places.formattedAddress'
      },
      body: JSON.stringify({
        textQuery: destination,
        maxResultCount: 1
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      places?: Array<{
        location?: { latitude?: number; longitude?: number };
      }>;
    };

    const location = payload.places?.[0]?.location;
    if (location?.latitude == null || location.longitude == null) {
      return null;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude
    };
  } catch {
    return null;
  }
}

async function geocodeWithNominatim(destination: string): Promise<Coordinates | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', destination);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'TripBoard/0.1 (open-data-dev)',
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;

    const first = payload[0];
    if (!first?.lat || !first?.lon) {
      return null;
    }

    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon)
    };
  } catch {
    return null;
  }
}
