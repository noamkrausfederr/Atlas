import { NativeModules, Platform } from 'react-native';
import { formatDateRange } from './recommendations';

const recommendationCache = new Map();
const accommodationGeoCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 10;
const RECOMMENDATION_BATCH_SIZE = 10;
let lastWorkingApiBaseUrl = null;

async function geocodeAccommodation(board) {
  if (
    board?.accommodationCoords?.lat != null &&
    board?.accommodationCoords?.lng != null
  ) {
    return board.accommodationCoords;
  }

  const address = board?.accommodation?.trim();
  if (!address) {
    return null;
  }

  const key = [
    address.toLowerCase(),
    board?.accommodationPlaceId || ''
  ].join('::');
  if (accommodationGeoCache.has(key)) return accommodationGeoCache.get(key);

  for (const baseUrl of getApiBaseUrls()) {
    try {
      const params = new URLSearchParams({ text: address });
      if (board?.accommodationPlaceId) {
        params.set('placeId', board.accommodationPlaceId);
      }
      const res = await fetch(`${baseUrl}/geocode/resolve?${params}`);
      if (!res.ok) {
        continue;
      }
      const data = await res.json();
      if (data?.coords?.lat != null && data?.coords?.lng != null) {
        const coords = { lat: Number(data.coords.lat), lng: Number(data.coords.lng) };
        accommodationGeoCache.set(key, coords);
        rememberWorkingApiBaseUrl(baseUrl);
        return coords;
      }
    } catch {}
  }

  accommodationGeoCache.set(key, null);
  return null;
}

function getAccommodationCacheKey(board) {
  return [
    normalizeText(board?.accommodation || ''),
    board?.accommodationPlaceId || '',
    board?.accommodationCoords?.lat ?? '',
    board?.accommodationCoords?.lng ?? ''
  ].join(':');
}

function isFiniteCoordinate(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function shouldShowDistanceFromAccommodation(board, recommendation) {
  return Boolean(
    board?.accommodation?.trim() &&
    isFiniteCoordinate(recommendation?.lat) &&
    isFiniteCoordinate(recommendation?.lng)
  );
}

function withAccommodationDistance(board, recommendation, accommodationCoords) {
  if (!shouldShowDistanceFromAccommodation(board, recommendation) || !accommodationCoords) {
    return recommendation;
  }

  const km = distanceKm(accommodationCoords.lat, accommodationCoords.lng, recommendation.lat, recommendation.lng);
  return {
    ...recommendation,
    distanceFromAccommodation: formatDistance(km)
  };
}

function clearAccommodationDistance(recommendation) {
  if (!recommendation?.distanceFromAccommodation) {
    return recommendation;
  }

  const nextRecommendation = { ...recommendation };
  delete nextRecommendation.distanceFromAccommodation;
  return nextRecommendation;
}

function applyAccommodationDistances(board, recommendations, accommodationCoords) {
  if (!board?.accommodation?.trim()) {
    return recommendations.map(clearAccommodationDistance);
  }

  return recommendations.map((recommendation) => {
    if (accommodationCoords) {
      return withAccommodationDistance(board, recommendation, accommodationCoords);
    }
    return clearAccommodationDistance(recommendation);
  });
}

function cachedRecommendationsNeedAccommodationDistances(board, cachedValue) {
  if (!board?.accommodation?.trim()) {
    return false;
  }

  const recommendations = cachedValue?.recommendations || [];
  const hasLocatableRecommendations = recommendations.some(
    (recommendation) => isFiniteCoordinate(recommendation?.lat) && isFiniteCoordinate(recommendation?.lng)
  );

  if (!hasLocatableRecommendations) {
    return false;
  }

  return !recommendations.some((recommendation) => recommendation?.distanceFromAccommodation);
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function getDevServerHost() {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL;
  if (!scriptUrl || typeof scriptUrl !== 'string') {
    return null;
  }

  const match = scriptUrl.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] || null;
}

function dedupe(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getAccommodationMatchScore(suggestion, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const normalizedName = normalizeText(suggestion?.name);
  const normalizedAddress = normalizeText(suggestion?.address);
  const haystacks = [normalizedName, normalizedAddress].filter(Boolean);
  if (!haystacks.length) return 0;

  if (haystacks.some((value) => value === normalizedQuery)) return 500;
  if (haystacks.some((value) => value.startsWith(normalizedQuery))) return 400;

  const wordPrefixPattern = new RegExp(`(?:^|\\s)${escapeRegExp(normalizedQuery)}`);
  if (haystacks.some((value) => wordPrefixPattern.test(value))) return 300;
  if (haystacks.some((value) => value.includes(normalizedQuery))) return 200;

  return 0;
}

function coordinatesAreClose(left, right, maxMeters = 250) {
  if (
    left?.lat == null ||
    left?.lng == null ||
    right?.lat == null ||
    right?.lng == null
  ) {
    return false;
  }

  const latDeltaMeters = Math.abs(left.lat - right.lat) * 111000;
  const averageLatRadians = ((left.lat + right.lat) / 2) * (Math.PI / 180);
  const lngDeltaMeters = Math.abs(left.lng - right.lng) * 111000 * Math.cos(averageLatRadians);
  return Math.hypot(latDeltaMeters, lngDeltaMeters) <= maxMeters;
}

function namesLookEquivalent(left, right) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function recommendationsLookEquivalent(left, right) {
  if (!left || !right) return false;
  if (left.canonicalId && right.canonicalId && left.canonicalId === right.canonicalId) {
    return true;
  }

  if (!namesLookEquivalent(left.title, right.title)) {
    return false;
  }

  if (coordinatesAreClose(left, right)) {
    return true;
  }

  const leftAddress = normalizeText(left.address);
  const rightAddress = normalizeText(right.address);
  return Boolean(leftAddress && rightAddress && leftAddress === rightAddress);
}

function getSeenRecommendations(cached) {
  return cached?.seenRecommendations || [];
}

function appendSeenRecommendations(existing, incoming) {
  const seen = [...existing];

  for (const recommendation of incoming) {
    if (seen.some((candidate) => recommendationsLookEquivalent(candidate, recommendation))) {
      continue;
    }
    seen.push(recommendation);
  }

  return seen;
}

function filterPreviouslySeenRecommendations(recommendations, seenRecommendations) {
  return recommendations.filter(
    (recommendation) =>
      !seenRecommendations.some((candidate) => recommendationsLookEquivalent(candidate, recommendation))
  );
}

function getApiBaseUrls() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const devHost = getDevServerHost();

  const localUrls = [];

  if (devHost) {
    localUrls.push(`http://${devHost}:5005/api`);
    localUrls.push(`http://${devHost}:5000/api`);
  }

  if (Platform.OS === 'android') {
    localUrls.push('http://10.0.2.2:5005/api');
    localUrls.push('http://10.0.2.2:5000/api');
  } else {
    localUrls.push('http://localhost:5005/api');
    localUrls.push('http://localhost:5000/api');
  }

  const configuredUrls = [];
  if (configured) {
    const normalized = configured.replace(/\/$/, '');
    configuredUrls.push(normalized);

    const fallbackPort = normalized.replace(/:\d+(\/|$)/, ':5005$1');
    if (fallbackPort !== normalized) {
      configuredUrls.push(fallbackPort);
    }
  }

  const urls = __DEV__
    ? [...localUrls, ...configuredUrls]
    : [...configuredUrls, ...localUrls];

  const deduped = dedupe(urls);
  if (!lastWorkingApiBaseUrl) {
    return deduped;
  }

  return [
    lastWorkingApiBaseUrl,
    ...deduped.filter((url) => url !== lastWorkingApiBaseUrl)
  ];
}

function rememberWorkingApiBaseUrl(baseUrl) {
  lastWorkingApiBaseUrl = baseUrl;
}

async function fetchRecommendationsPayload(requestBody) {
  const baseUrls = getApiBaseUrls();
  let lastError = null;

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Recommendation request failed with ${response.status} from ${baseUrl}`);
      }

      const payload = await response.json();
      rememberWorkingApiBaseUrl(baseUrl);
      return { payload, baseUrl };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Recommendation request failed');
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getTripDays(board) {
  if (board.startDate && board.endDate) {
    const start = new Date(board.startDate);
    const end = new Date(board.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  }
  return board.days || 3;
}

function assignDayLabels(count, tripDays) {
  return Array.from({ length: count }, (_value, index) => {
    const day = Math.min(tripDays, Math.max(1, Math.ceil(((index + 1) / count) * tripDays)));
    return `Day ${day}`;
  });
}

function formatPrice(priceLevel) {
  if (priceLevel === 0) return 'Free';
  if (!priceLevel || priceLevel < 0) return 'Details';
  return '$'.repeat(Math.min(priceLevel, 4));
}

function humanizeCategory(category) {
  if (!category) return 'Place';
  const normalized = category.trim().toLowerCase();
  if (normalized === 'shooping') return 'Shopping';
  return category
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isTicketmasterRecommendation(item) {
  return (item?.sourceAttributions || []).some((source) => source?.provider === 'ticketmaster');
}

function getDisplayCategory(item) {
  if (isTicketmasterRecommendation(item)) {
    return 'Live Events';
  }

  return humanizeCategory(item?.category);
}

function prettifyProviderName(provider) {
  if (!provider) return 'Source';
  return String(provider)
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildVibeTags(board) {
  return [
    board.pace,
    board.travelerType,
    board.accessibility,
    board.transportation,
    board.budget,
    ...(board.subtitle ? board.subtitle.split('&') : [])
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);
}

function mapBudget(value) {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase();
  if (normalized.includes('budget')) return 'budget';
  if (normalized.includes('luxury')) return 'luxury';
  if (normalized.includes('mid')) return 'mid-range';
  return undefined;
}

function getDestination(board) {
  return board.location || board.subtitle || board.title || 'Your destination';
}

function inferCategoriesFromSearch(searchQuery) {
  const normalized = normalizeText(searchQuery);
  if (!normalized) {
    return ['restaurant', 'cafe', 'attraction', 'experience', 'museum', 'shopping', 'bar', 'park'];
  }

  const categories = new Set();

  if (/\b(museum|museums|gallery|galleries|exhibit|exhibition)\b/.test(normalized)) {
    categories.add('museum');
  }
  if (/\b(cafe|cafes|coffee|espresso|bakery|breakfast|brunch)\b/.test(normalized)) {
    categories.add('cafe');
  }
  if (/\b(restaurant|restaurants|food|dinner|lunch|bistro|eat|eats|meal)\b/.test(normalized)) {
    categories.add('restaurant');
  }
  if (/\b(bar|bars|cocktail|cocktails|wine|pub|nightlife)\b/.test(normalized)) {
    categories.add('bar');
  }
  if (/\b(shop|shops|shopping|shooping|shoops|mall|malls|market|markets|boutique|store|stores)\b/.test(normalized)) {
    categories.add('shopping');
  }
  if (/\b(park|parks|garden|gardens|picnic|nature)\b/.test(normalized)) {
    categories.add('park');
  }
  if (/\b(concert|concerts|show|shows|music|theater|theatre|performance|performances|event|events)\b/.test(normalized)) {
    categories.add('experience');
  }
  if (/\b(attraction|attractions|landmark|landmarks|sight|sights|things to do|activity|activities)\b/.test(normalized)) {
    categories.add('attraction');
  }

  return Array.from(categories.size ? categories : ['attraction']);
}

function mapApiRecommendation(board, item, dayLabel) {
  const fallbackReview = item.sourceAttributions?.[0];
  const fallbackReviewCount = fallbackReview?.reviewCount || item.reviewCount || 0;
  const fallbackReviewText = fallbackReview?.summary
    || (fallbackReviewCount
      ? `Live listing from ${fallbackReview.provider} with ${fallbackReviewCount} reviews.`
      : '');
  const liveReviews = (item.reviews || [])
    .filter((review) => review?.text)
    .slice(0, 3)
    .map((review) => ({
      author: review.author || prettifyProviderName(review.provider),
      stars: review.rating
        ? Math.max(1, Math.min(5, Math.round(review.rating)))
        : 0,
      text: review.text
    }));
  const fallbackReviews = fallbackReview && fallbackReviewText
    ? [
        {
          author: prettifyProviderName(fallbackReview.provider),
          stars: fallbackReview.rating || item.rating
            ? Math.max(1, Math.min(5, Math.round(fallbackReview.rating || item.rating || 4)))
            : 0,
          text: fallbackReviewText
        }
      ]
    : [];

  return {
    id: item.canonicalId,
    canonicalId: item.canonicalId,
    slug: slugify(item.name),
    boardId: board.id,
    title: item.name,
    category: getDisplayCategory(item),
    dayLabel,
    reason: item.reason,
    description: item.description || `A live recommendation for ${getDestination(board)} sourced from live web data.`,
    address: item.address || getDestination(board),
    price: formatPrice(item.priceLevel),
    rating: item.rating ? Math.round(item.rating * 10) / 10 : null,
    reviewCount: item.reviewCount || 0,
    reviews: liveReviews.length ? liveReviews : fallbackReviews,
    image: item.imageUrl || board.image,
    city: item.destination || getDestination(board),
    lat: item.lat,
    lng: item.lng,
    websiteUrl: item.websiteUrl,
    sourceAttributions: item.sourceAttributions || []
  };
}

function buildCacheKey(board, searchQuery = '') {
  return `${board.id}:${getDestination(board)}:${getTripDays(board)}:${board.budget || ''}:${board.subtitle || ''}:${board.startDate || ''}:${board.endDate || ''}:${normalizeText(searchQuery)}:${getAccommodationCacheKey(board)}`;
}

export async function autocompleteAccommodation(text, destination) {
  if (!text || text.trim().length < 1) return [];
  const query = text.trim();
  const baseUrls = getApiBaseUrls();
  for (const baseUrl of baseUrls) {
    try {
      const params = new URLSearchParams({ text: query });
      if (destination) params.set('destination', destination);
      const res = await fetch(`${baseUrl}/geocode/autocomplete?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      rememberWorkingApiBaseUrl(baseUrl);
      return (data.suggestions ?? [])
        .map((suggestion) => ({
          ...suggestion,
          _score: getAccommodationMatchScore(suggestion, query)
        }))
        .filter((suggestion) => suggestion._score > 0)
        .sort((left, right) => right._score - left._score || left.address.localeCompare(right.address))
        .filter((suggestion, index, list) => (
          list.findIndex((candidate) => normalizeText(candidate.address) === normalizeText(suggestion.address)) === index
        ))
        .slice(0, 6)
        .map(({ _score, ...suggestion }) => suggestion);
    } catch {}
  }
  return [];
}

export async function fetchBoardRecommendations(board, options = {}) {
  const { loadMore = false, searchQuery = '' } = options;
  const trimmedSearchQuery = String(searchQuery || '').trim();
  const cacheKey = buildCacheKey(board, trimmedSearchQuery);
  const cached = recommendationCache.get(cacheKey);
  if (
    !loadMore &&
    cached &&
    Date.now() - cached.cachedAt < CACHE_TTL_MS &&
    !cached.value.meta.usedMockData &&
    !cachedRecommendationsNeedAccommodationDistances(board, cached.value)
  ) {
    return cached.value;
  }

  const tripDays = getTripDays(board);
  const requestBody = {
    destination: getDestination(board),
    accommodation: board.accommodation?.trim() || undefined,
    query: trimmedSearchQuery,
    startDate: board.startDate,
    endDate: board.endDate,
    tripDays,
    budget: mapBudget(board.budget),
    vibeTags: buildVibeTags(board),
    categories: inferCategoriesFromSearch(trimmedSearchQuery),
    limit: RECOMMENDATION_BATCH_SIZE,
    excludeCanonicalIds: loadMore
      ? getSeenRecommendations(cached).map((recommendation) => recommendation.canonicalId).filter(Boolean)
      : [],
    bypassCache: loadMore
  };

  try {
    const [{ payload }, accommodationCoords] = await Promise.all([
      fetchRecommendationsPayload(requestBody),
      board.accommodation?.trim() ? geocodeAccommodation(board) : Promise.resolve(null)
    ]);
    const liveItems = payload.recommendations || [];
    const dayLabels = assignDayLabels(liveItems.length || 1, tripDays);
    const nextRecommendations = applyAccommodationDistances(
      board,
      liveItems.map((item, index) => (
        mapApiRecommendation(board, item, dayLabels[index] ?? `Day ${Math.min(index + 1, tripDays)}`)
      )),
      accommodationCoords
    );
    const newRecommendations = loadMore
      ? filterPreviouslySeenRecommendations(nextRecommendations, getSeenRecommendations(cached))
      : nextRecommendations;
    const recommendations = loadMore
      ? [...(cached?.value?.recommendations || []), ...newRecommendations]
      : newRecommendations;
    const seenRecommendations = appendSeenRecommendations(getSeenRecommendations(cached), newRecommendations);

    const value = {
      recommendations,
      meta: {
        usedFallback: false,
        usedMockData: Boolean(payload.usedMockData),
        providersUsed: payload.providersUsed || [],
        formatDateRange: formatDateRange(board),
        searchQuery: trimmedSearchQuery,
        hasMore: newRecommendations.length > 0
      }
    };
    recommendationCache.set(cacheKey, { value, cachedAt: Date.now(), seenRecommendations });
    return value;
  } catch (error) {
    const recommendations = loadMore ? cached?.value?.recommendations || [] : [];
    const seenRecommendations = getSeenRecommendations(cached);
    const value = {
      recommendations,
      meta: {
        usedFallback: false,
        usedMockData: false,
        providersUsed: [],
        error: error instanceof Error ? error.message : 'Unknown recommendation error',
        formatDateRange: formatDateRange(board),
        searchQuery: trimmedSearchQuery,
        hasMore: false
      }
    };
    recommendationCache.set(cacheKey, { value, cachedAt: Date.now(), seenRecommendations });
    return value;
  }
}
