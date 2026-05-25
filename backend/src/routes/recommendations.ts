import { Router } from 'express';
import { getRecommendations } from '../services/recommendations/recommendationService.js';
import { RecommendationRequest } from '../services/recommendations/types.js';

const router = Router();

router.post('/', async (req, res) => {
  const body = req.body as Partial<RecommendationRequest>;

  if (!body.destination?.trim()) {
    res.status(400).json({ error: 'destination is required' });
    return;
  }

  try {
    const result = await getRecommendations({
      destination: body.destination.trim(),
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
