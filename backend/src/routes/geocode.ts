import { Router } from 'express';
import { hasProviderKey } from '../config/env.js';
import { geocodeDestination } from '../services/recommendations/geocode.js';

const router = Router();

const destinationCoordCache = new Map<string, { lat: number; lng: number } | null>();

async function resolveDestinationCoords(destination: string) {
  const key = destination.trim().toLowerCase();
  if (destinationCoordCache.has(key)) return destinationCoordCache.get(key);
  const coords = await geocodeDestination(destination);
  const result = coords ? { lat: coords.latitude, lng: coords.longitude } : null;
  destinationCoordCache.set(key, result);
  return result;
}

type AutocompleteSuggestion = {
  name: string;
  address: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  source?: 'google' | 'geoapify';
};

async function fetchGoogleAutocomplete(text: string, destination?: string): Promise<AutocompleteSuggestion[]> {
  if (!hasProviderKey('google')) {
    return [];
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY as string;
  const body: Record<string, unknown> = {
    input: text,
    inputOffset: text.length,
    includeQueryPredictions: false
  };

  if (destination) {
    const coords = await resolveDestinationCoords(destination);
    if (coords) {
      body.locationBias = {
        circle: {
          center: {
            latitude: coords.lat,
            longitude: coords.lng
          },
          radius: 50000
        }
      };
      body.origin = {
        latitude: coords.lat,
        longitude: coords.lng
      };
    }
  }

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;
  };

  return (data.suggestions ?? [])
    .map((item) => item.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction?.text?.text))
    .map((prediction) => ({
      name: prediction.structuredFormat?.mainText?.text || prediction.text?.text || '',
      address: prediction.text?.text || '',
      city: '',
      country: '',
      placeId: prediction.placeId,
      source: 'google' as const
    }));
}

async function fetchGeoapifyAutocomplete(text: string, destination?: string): Promise<AutocompleteSuggestion[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.searchParams.set('text', text);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('limit', '10');
  url.searchParams.set('format', 'json');

  if (destination) {
    const coords = await resolveDestinationCoords(destination);
    if (coords) {
      url.searchParams.set('bias', `proximity:${coords.lng},${coords.lat}`);
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    return [];
  }

  const data = await response.json() as {
    results?: Array<{
      name?: string;
      formatted?: string;
      address_line1?: string;
      city?: string;
      country?: string;
      lon?: number;
      lat?: number;
    }>;
  };

  return (data.results ?? [])
    .filter((item) => item.formatted)
    .map((item) => ({
      name: item.name || item.address_line1 || item.formatted?.split(',')[0] || '',
      address: item.formatted ?? '',
      city: item.city ?? '',
      country: item.country ?? '',
      lat: item.lat,
      lng: item.lon,
      source: 'geoapify' as const
    }));
}

router.get('/autocomplete', async (req, res) => {
  const text = String(req.query.text ?? '').trim();
  const destination = String(req.query.destination ?? '').trim();

  if (text.length < 2) {
    res.json({ suggestions: [] });
    return;
  }

  if (!hasProviderKey('google') && !process.env.GEOAPIFY_API_KEY) {
    res.json({ suggestions: [] });
    return;
  }

  try {
    const suggestions = await fetchGoogleAutocomplete(text, destination) || [];
    if (suggestions.length > 0) {
      res.json({ suggestions });
      return;
    }

    res.json({ suggestions: await fetchGeoapifyAutocomplete(text, destination) });
  } catch {
    res.json({ suggestions: [] });
  }
});

export default router;
