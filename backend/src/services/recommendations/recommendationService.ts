import { buildProviders, dedupePlaces } from './providers.js';
import { MemoryCache } from './cache.js';
import { geocodeDestination } from './geocode.js';
import {
  NormalizedPlace,
  PlaceSourceAttribution,
  RankedRecommendation,
  RecommendationRequest,
  RecommendationResponse,
  TravelCategory
} from './types.js';

const DEFAULT_CATEGORIES: TravelCategory[] = ['restaurant', 'cafe', 'attraction'];
const recommendationCache = new MemoryCache<RecommendationResponse>(1000 * 60 * 15);
const FOOD_AND_DRINK_CATEGORIES = new Set<TravelCategory>(['restaurant', 'cafe', 'bar']);
const LANDMARK_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'near',
  'from',
  'that',
  'this',
  'dans',
  'avec',
  'pour',
  'sur',
  'les',
  'des',
  'du',
  'de',
  'della',
  'delle',
  'dello',
  'dell',
  'del',
  'der',
  'die',
  'das',
  'van',
  'von',
  'la',
  'le',
  'el',
  'los',
  'las',
  'place',
  'street',
  'road',
  'rue',
  'via',
  'avenue',
  'boulevard',
  'piazza',
  'plaza',
  'square',
  'bridge',
  'parvis',
  'forecourt',
  'john',
  'paul',
  'ii'
]);

function categoryMatchesRequest(placeCategory: TravelCategory, requestedCategories: TravelCategory[] = []) {
  if (requestedCategories.includes(placeCategory)) {
    return true;
  }

  return (
    (placeCategory === 'experience' && requestedCategories.includes('attraction')) ||
    (placeCategory === 'attraction' && requestedCategories.includes('experience'))
  );
}

function scorePlace(place: NormalizedPlace, request: RecommendationRequest) {
  let score = 0;

  score += (place.rating ?? 0) * 18;
  score += Math.min(place.reviewCount ?? 0, 2000) / 80;

  if (categoryMatchesRequest(place.category, request.categories)) {
    score += 18;
  }

  if (request.vibeTags?.length) {
    const normalizedTags = request.vibeTags.map((tag) => tag.toLowerCase());
    const tagMatches = place.tags.filter((tag) => normalizedTags.includes(tag.toLowerCase())).length;
    score += tagMatches * 8;
  }

  if (request.budget === 'budget' && (place.priceLevel ?? 2) <= 2) {
    score += 10;
  }
  if (request.budget === 'mid-range' && (place.priceLevel ?? 2) === 2) {
    score += 10;
  }
  if (request.budget === 'luxury' && (place.priceLevel ?? 0) >= 3) {
    score += 10;
  }

  if (place.category === 'restaurant' || place.category === 'cafe') {
    score += 4;
  }

  return score;
}

function cleanRecommendationSummary(place: NormalizedPlace) {
  const description = place.description?.trim();
  if (!description) {
    return place.name;
  }

  if (/^a live place recommendation near /i.test(description)) {
    const sourceSummary = place.sourceAttributions.find((source) => source.summary)?.summary?.trim();
    if (sourceSummary && !/^a live place recommendation near /i.test(sourceSummary)) {
      return sourceSummary;
    }
    return place.name;
  }

  return description;
}

function buildReason(place: NormalizedPlace, request: RecommendationRequest) {
  const vibeLine = request.vibeTags?.length
    ? `Matches ${request.vibeTags.slice(0, 2).join(' and ')} vibes.`
    : 'Fits the destination rhythm well.';
  const socialProof = place.rating && place.reviewCount
    ? `Strong signal from ${place.reviewCount} reviews with a ${place.rating.toFixed(1)} rating.`
    : 'Worth validating with live provider details.';

  return `${cleanRecommendationSummary(place)}. ${vibeLine} ${socialProof}`;
}

function rankPlaces(places: NormalizedPlace[], request: RecommendationRequest): RankedRecommendation[] {
  return places
    .map((place) => ({
      ...place,
      score: scorePlace(place, request),
      reason: buildReason(place, request)
    }))
    .sort((left, right) => right.score - left.score);
}

function hasProvider(place: RankedRecommendation, provider: PlaceSourceAttribution['provider']) {
  return place.sourceAttributions.some((source) => source.provider === provider);
}

function tokenizeForSimilarity(value?: string) {
  return new Set(
    (value ?? '')
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, ' ')
      .toLowerCase()
      .split(/[\s_-]+/)
      .filter((token) => token.length >= 4)
      .filter((token) => !LANDMARK_STOP_WORDS.has(token))
  );
}

function countOverlap(left: Set<string>, right: Set<string>) {
  let count = 0;
  for (const token of left) {
    if (right.has(token)) {
      count += 1;
    }
  }
  return count;
}

function areCoordinatesClose(left: RankedRecommendation, right: RankedRecommendation, maxMeters: number) {
  if (left.lat == null || left.lng == null || right.lat == null || right.lng == null) {
    return false;
  }

  const latDeltaMeters = Math.abs(left.lat - right.lat) * 111_000;
  const averageLatRadians = ((left.lat + right.lat) / 2) * (Math.PI / 180);
  const lngDeltaMeters = Math.abs(left.lng - right.lng) * 111_000 * Math.cos(averageLatRadians);
  return Math.hypot(latDeltaMeters, lngDeltaMeters) <= maxMeters;
}

function isLandmarkLike(place: RankedRecommendation) {
  return !FOOD_AND_DRINK_CATEGORIES.has(place.category);
}

function areTooSimilar(left: RankedRecommendation, right: RankedRecommendation) {
  const nearby = areCoordinatesClose(left, right, 250);
  if (!nearby) {
    return false;
  }

  const nameTokensLeft = tokenizeForSimilarity(left.name);
  const nameTokensRight = tokenizeForSimilarity(right.name);
  if (countOverlap(nameTokensLeft, nameTokensRight) >= 2) {
    return true;
  }

  if (!isLandmarkLike(left) || !isLandmarkLike(right)) {
    return false;
  }

  const combinedLeft = tokenizeForSimilarity(`${left.name} ${left.address ?? ''}`);
  const combinedRight = tokenizeForSimilarity(`${right.name} ${right.address ?? ''}`);
  return countOverlap(combinedLeft, combinedRight) >= 2;
}

function selectRecommendations(ranked: RankedRecommendation[], limit: number) {
  const preferredProviders: Array<PlaceSourceAttribution['provider']> = ['geoapify', 'opentripmap', 'ticketmaster'];
  const selected: RankedRecommendation[] = [];
  const selectedIds = new Set<string>();

  for (const provider of preferredProviders) {
    const match = ranked.find(
      (place) =>
        !selectedIds.has(place.canonicalId) &&
        hasProvider(place, provider) &&
        !selected.some((candidate) => areTooSimilar(candidate, place))
    );
    if (!match) continue;
    selected.push(match);
    selectedIds.add(match.canonicalId);
    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const place of ranked) {
    if (selectedIds.has(place.canonicalId)) continue;
    if (selected.some((candidate) => areTooSimilar(candidate, place))) continue;
    selected.push(place);
    selectedIds.add(place.canonicalId);
    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

export async function getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
  const limit = Math.min(Math.max(request.limit ?? 8, 1), 20);
  const excludeCanonicalIds = Array.from(new Set((request.excludeCanonicalIds ?? []).filter(Boolean))).sort();
  const cacheKey = JSON.stringify({
    destination: request.destination.trim().toLowerCase(),
    startDate: request.startDate,
    endDate: request.endDate,
    latitude: request.latitude,
    longitude: request.longitude,
    radiusMeters: request.radiusMeters,
    tripDays: request.tripDays,
    budget: request.budget,
    vibeTags: request.vibeTags ?? [],
    categories: request.categories ?? [],
    limit,
    excludeCanonicalIds
  });

  if (!request.bypassCache) {
    const cached = recommendationCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const providers = buildProviders();
  const categories = request.categories?.length ? request.categories : DEFAULT_CATEGORIES;
  const providerFetchLimit = Math.min(Math.max(limit + excludeCanonicalIds.length, limit), 40);
  const resolvedCoordinates =
    request.latitude != null && request.longitude != null
      ? { latitude: request.latitude, longitude: request.longitude }
      : await geocodeDestination(request.destination);
  const providerContext = {
    destination: request.destination,
    startDate: request.startDate,
    endDate: request.endDate,
    latitude: resolvedCoordinates?.latitude,
    longitude: resolvedCoordinates?.longitude,
    radiusMeters: request.radiusMeters ?? 2000,
    categories,
    limit: providerFetchLimit
  };

  const enabledNonMockProviders = providers.filter((provider) => provider.name !== 'mock' && provider.enabled());
  const fetched = await Promise.all(
    (enabledNonMockProviders.length ? enabledNonMockProviders : providers.filter((provider) => provider.name === 'mock'))
      .map((provider) => provider.fetchPlaces(providerContext))
  );

  const places = dedupePlaces(fetched.flat());
  const excludedIds = new Set(excludeCanonicalIds);
  const unseenPlaces = rankPlaces(places, request).filter((place) => !excludedIds.has(place.canonicalId));
  const ranked = selectRecommendations(unseenPlaces, limit);
  const providersUsed = ranked.length
    ? Array.from(new Set(ranked.flatMap((place) => place.sourceAttributions.map((source) => source.provider))))
    : ['mock' as const];

  const response = {
    destination: request.destination,
    recommendations: ranked,
    providersUsed,
    usedMockData: providersUsed.length === 1 && providersUsed[0] === 'mock'
  };

  if (!request.bypassCache) {
    recommendationCache.set(cacheKey, response);
  }

  return response;
}
