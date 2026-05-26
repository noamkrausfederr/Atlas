import { Router, Request, Response, NextFunction } from 'express';
import { getRecommendations } from '../services/recommendations/recommendationService.js';
import { RecommendationRequest } from '../services/recommendations/types.js';

const router = Router();

const rateLimitWindows = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitWindows.get(ip) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitWindows.set(ip, timestamps);
    res.status(429).json({ error: 'Too many requests, please slow down.' });
    return;
  }
  timestamps.push(now);
  rateLimitWindows.set(ip, timestamps);
  next();
}

router.post('/', rateLimit, async (req, res) => {
  const body = req.body as Partial<RecommendationRequest>;

  if (!body.destination?.trim()) {
    res.status(400).json({ error: 'destination is required' });
    return;
  }

  try {
    const result = await getRecommendations({
      destination: body.destination.trim(),
      accommodation: body.accommodation?.trim() || undefined,
      query: body.query,
      startDate: body.startDate,
      endDate: body.endDate,
      latitude: body.latitude,
      longitude: body.longitude,
      radiusMeters: body.radiusMeters,
      tripDays: body.tripDays,
      budget: body.budget,
      vibeTags: body.vibeTags ?? [],
      categories: body.categories ?? [],
      limit: body.limit,
      excludeCanonicalIds: body.excludeCanonicalIds ?? [],
      bypassCache: Boolean(body.bypassCache)
    });

    res.json(result);
  } catch (error) {
    console.error('Failed to build recommendations', error);
    res.status(500).json({ error: 'Failed to build recommendations' });
  }
});

export default router;
