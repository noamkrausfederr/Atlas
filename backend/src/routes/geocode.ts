import { Router } from 'express';
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

router.get('/autocomplete', async (req, res) => {
  const text = String(req.query.text ?? '').trim();
  const destination = String(req.query.destination ?? '').trim();

  if (text.length < 2) {
    res.json({ suggestions: [] });
    return;
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    res.json({ suggestions: [] });
    return;
  }

  try {
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text', text);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('limit', '6');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('format', 'json');

    if (destination) {
      const coords = await resolveDestinationCoords(destination);
      if (coords) {
        url.searchParams.set('bias', `proximity:${coords.lng},${coords.lat}`);
      }
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      res.json({ suggestions: [] });
      return;
    }

    const data = await response.json() as {
      results?: Array<{
        name?: string;
        formatted?: string;
        address_line1?: string;
        address_line2?: string;
        city?: string;
        country?: string;
        lon?: number;
        lat?: number;
      }>;
    };

    const suggestions = (data.results ?? [])
      .filter((item) => item.formatted)
      .map((item) => ({
        name: item.name || item.address_line1 || item.formatted?.split(',')[0] || '',
        address: item.formatted ?? '',
        city: item.city ?? '',
        country: item.country ?? '',
        lat: item.lat,
        lng: item.lon
      }));

    res.json({ suggestions });
  } catch {
    res.json({ suggestions: [] });
  }
});

export default router;
