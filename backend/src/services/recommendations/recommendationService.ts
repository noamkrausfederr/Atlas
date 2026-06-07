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
const EVENT_QUERY_PATTERN = /\b(concert|concerts|show|shows|theatre|theater|performance|performances|event|events|gig|gigs|festival|festivals|opera|ballet|comedy|live music|musical|musicals)\b/i;
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
const HISTORICAL_FACT_TERMS = [
  'bombing attempt',
  'bombing',
  'terrorist attack',
  'attack',
  'assassination',
  'massacre',
  'riot',
  'revolt',
  'uprising',
  'battle',
  'war',
  'fire',
  'collapse',
  'accident',
  'disaster',
  'incident',
  'siege',
  'execution'
];
const NON_ACTIONABLE_SUBFEATURE_TERMS = [
  'spire',
  'transept',
  'facade',
  'façade',
  'roof space',
  'cross-section',
  'foundation stone',
  'bell tower'
];
const NON_ACTIONABLE_ATTRACTION_TAGS = [
  'artwork',
  'sculpture',
  'memorial',
  'historic_architecture',
  'monuments_and_memorials'
];
const ACTIONABLE_ATTRACTION_TAG_PATTERN =
  /(museum|gallery|shopping|mall|market|park|garden|theatre|theater|cinema|venue|tour|cruise|boat|castle|palace|cathedral|church|tower|zoo|aquarium|amusement|theme_park)/i;

function categoryMatchesRequest(placeCategory: TravelCategory, requestedCategories: TravelCategory[] = []) {
  return requestedCategories.includes(placeCategory);
}

function tokenizeQuery(value?: string) {
  return Array.from(tokenizeForSimilarity(value));
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

  const queryTokens = tokenizeQuery(request.query);
  if (queryTokens.length) {
    const searchableText = [place.name, place.description, place.address, ...place.tags].filter(Boolean).join(' ').toLowerCase();
    const queryMatches = queryTokens.filter((token) => searchableText.includes(token)).length;
    score += queryMatches * 12;
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

function buildReason(place: NormalizedPlace, _request: RecommendationRequest) {
  return cleanRecommendationSummary(place);
}

function textIncludesAnyTerm(value: string, terms: string[]) {
  const normalized = value.normalize('NFKD').replace(/[^\w\s-]/g, ' ').toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function isHistoricalFactLike(place: NormalizedPlace) {
  const joinedText = [place.name, place.description, ...place.tags].filter(Boolean).join(' ');
  if (!joinedText) {
    return false;
  }

  if (textIncludesAnyTerm(joinedText, HISTORICAL_FACT_TERMS)) {
    return true;
  }

  return /\bon\s+\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\b/.test(place.description ?? '');
}

function isActionableAttraction(place: NormalizedPlace) {
  if (place.category !== 'attraction') {
    return true;
  }

  const joinedText = [place.name, place.description, ...place.tags].filter(Boolean).join(' ');
  if (textIncludesAnyTerm(joinedText, NON_ACTIONABLE_SUBFEATURE_TERMS)) {
    return false;
  }

  if (place.tags.some((tag) => NON_ACTIONABLE_ATTRACTION_TAGS.some((blocked) => tag.toLowerCase().includes(blocked)))) {
    return false;
  }

  const hasRealLocationSignal = Boolean(place.address || place.websiteUrl || (place.lat != null && place.lng != null));
  const hasVenueLikeTag = place.tags.some((tag) => ACTIONABLE_ATTRACTION_TAG_PATTERN.test(tag));

  return hasRealLocationSignal && hasVenueLikeTag;
}

function isTicketmasterPlace(place: NormalizedPlace) {
  return place.sourceAttributions.some((source) => source.provider === 'ticketmaster');
}

function isActionableRecommendation(place: NormalizedPlace) {
  if (isTicketmasterPlace(place)) {
    return true;
  }

  if (isHistoricalFactLike(place)) {
    return false;
  }

  return isActionableAttraction(place);
}

function isEventSearch(request: RecommendationRequest): boolean {
  return EVENT_QUERY_PATTERN.test(request.query ?? '');
}

export function filterPlacesByRequestedCategories(
  places: NormalizedPlace[],
  requestedCategories: TravelCategory[] = []
) {
  if (!requestedCategories.length) {
    return places;
  }

  return places.filter((place) => categoryMatchesRequest(place.category, requestedCategories));
}

export function rankPlaces(places: NormalizedPlace[], request: RecommendationRequest): RankedRecommendation[] {
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

function isGoogleOnlyPlace(place: RankedRecommendation) {
  return hasProvider(place, 'google') && place.sourceAttributions.every((source) => source.provider === 'google');
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

function selectRecommendations(ranked: RankedRecommendation[], limit: number, preferEvents = false) {
  const selected: RankedRecommendation[] = [];
  const selectedIds = new Set<string>();

  if (preferEvents) {
    for (const place of ranked) {
      if (selected.length >= limit) break;
      if (!hasProvider(place, 'ticketmaster')) continue;
      if (selectedIds.has(place.canonicalId)) continue;
      if (selected.some((candidate) => areTooSimilar(candidate, place))) continue;
      selected.push(place);
      selectedIds.add(place.canonicalId);
    }
    return selected;
  }

  const preferredProviders: Array<PlaceSourceAttribution['provider']> = ['geoapify', 'opentripmap', 'ticketmaster'];

  for (const provider of preferredProviders) {
    if (selected.length >= limit) break;
    const match = ranked.find(
      (place) =>
        !selectedIds.has(place.canonicalId) &&
        hasProvider(place, provider) &&
        !selected.some((candidate) => areTooSimilar(candidate, place))
    );
    if (!match) continue;
    selected.push(match);
    selectedIds.add(match.canonicalId);
  }

  const googleOnlyCap = Math.max(2, Math.ceil(limit / 3));

  for (const place of ranked) {
    if (selected.length >= limit) break;
    if (selectedIds.has(place.canonicalId)) continue;
    if (selected.some((candidate) => areTooSimilar(candidate, place))) continue;
    if (
      isGoogleOnlyPlace(place) &&
      selected.filter(isGoogleOnlyPlace).length >= googleOnlyCap
    ) {
      continue;
    }
    selected.push(place);
    selectedIds.add(place.canonicalId);
  }

  for (const place of ranked) {
    if (selected.length >= limit) break;
    if (selectedIds.has(place.canonicalId)) continue;
    if (selected.some((candidate) => areTooSimilar(candidate, place))) continue;
    selected.push(place);
    selectedIds.add(place.canonicalId);
  }

  return selected;
}

export async function getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
  const limit = Math.min(Math.max(request.limit ?? 8, 1), 20);
  const excludeCanonicalIds = Array.from(new Set((request.excludeCanonicalIds ?? []).filter(Boolean))).sort();
  const cacheKey = JSON.stringify({
    destination: request.destination.trim().toLowerCase(),
    accommodation: request.accommodation?.trim().toLowerCase(),
    query: request.query?.trim().toLowerCase(),
    startDate: request.startDate,
    endDate: request.endDate,
    latitude: request.latitude,
    longitude: request.longitude,
    radiusMeters: request.radiusMeters,
    tripDays: request.tripDays,
    budget: request.budget,
    vibeTags: request.vibeTags ?? [],
    categories: request.categories ?? [],
    allowedProviders: (request.allowedProviders ?? []).slice().sort(),
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
  const providerFetchLimit = Math.min(limit + excludeCanonicalIds.length, 40);
  const resolvedCoordinates =
    request.latitude != null && request.longitude != null
      ? { latitude: request.latitude, longitude: request.longitude }
      : await geocodeDestination(request.accommodation?.trim() || request.destination);
  const providerContext = {
    destination: request.destination,
    query: request.query,
    startDate: request.startDate,
    endDate: request.endDate,
    latitude: resolvedCoordinates?.latitude,
    longitude: resolvedCoordinates?.longitude,
    radiusMeters: request.radiusMeters ?? (isEventSearch(request) ? 50000 : 2000),
    categories,
    limit: providerFetchLimit
  };

  const eventSearch = isEventSearch(request);
  const fetched = await Promise.all(
    providers
      .filter((provider) => provider.enabled())
      .filter((provider) => !request.allowedProviders?.length || request.allowedProviders.includes(provider.name))
      .filter((provider) => !eventSearch || provider.name === 'ticketmaster')
      .map((provider) => provider.fetchPlaces(providerContext))
  );

  const places = filterPlacesByRequestedCategories(
    dedupePlaces(fetched.flat()).filter(isActionableRecommendation),
    request.categories ?? []
  );
  const excludedIds = new Set(excludeCanonicalIds);
  const unseenPlaces = rankPlaces(places, request).filter((place) => !excludedIds.has(place.canonicalId));
  const ranked = selectRecommendations(unseenPlaces, limit, eventSearch);
  const providersUsed = Array.from(new Set(ranked.flatMap((place) => place.sourceAttributions.map((source) => source.provider))));

  const response = {
    destination: request.destination,
    recommendations: ranked,
    providersUsed,
    usedMockData: false
  };

  if (!request.bypassCache) {
    recommendationCache.set(cacheKey, response);
  }

  return response;
}
