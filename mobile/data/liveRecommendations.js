import { NativeModules, Platform } from 'react-native';
import { formatDateRange } from './recommendations';

const recommendationCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 10;
const RECOMMENDATION_BATCH_SIZE = 10;

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

  if (configured) {
    const normalized = configured.replace(/\/$/, '');
    const alternate =
      devHost && /:\/\/(localhost|127\.0\.0\.1)(?::|\/)/.test(normalized)
        ? normalized.replace('localhost', devHost).replace('127.0.0.1', devHost)
        : null;
    return dedupe([normalized, alternate]);
  }

  if (Platform.OS === 'android') {
    return dedupe([
      'http://10.0.2.2:5001/api',
      devHost ? `http://${devHost}:5001/api` : null
    ]);
  }

  return dedupe([
    devHost ? `http://${devHost}:5001/api` : null,
    'http://localhost:5001/api'
  ]);
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
  return category
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
    category: humanizeCategory(item.category),
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

function buildCacheKey(board) {
  return `${board.id}:${getDestination(board)}:${getTripDays(board)}:${board.budget || ''}:${board.subtitle || ''}:${board.startDate || ''}:${board.endDate || ''}`;
}

export async function fetchBoardRecommendations(board, options = {}) {
  const { loadMore = false } = options;
  const cacheKey = buildCacheKey(board);
  const cached = recommendationCache.get(cacheKey);
  if (!loadMore && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  const tripDays = getTripDays(board);
  const requestBody = {
    destination: getDestination(board),
    startDate: board.startDate,
    endDate: board.endDate,
    tripDays,
    budget: mapBudget(board.budget),
    vibeTags: buildVibeTags(board),
    categories: ['restaurant', 'cafe', 'attraction', 'experience', 'museum', 'shopping', 'bar', 'park'],
    limit: RECOMMENDATION_BATCH_SIZE,
    excludeCanonicalIds: loadMore
      ? getSeenRecommendations(cached).map((recommendation) => recommendation.canonicalId).filter(Boolean)
      : [],
    bypassCache: loadMore
  };

  try {
    const { payload } = await fetchRecommendationsPayload(requestBody);
    const liveItems = payload.recommendations || [];
    const dayLabels = assignDayLabels(liveItems.length || 1, tripDays);
    const nextRecommendations = liveItems.map((item, index) =>
      mapApiRecommendation(board, item, dayLabels[index] ?? `Day ${Math.min(index + 1, tripDays)}`)
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
        hasMore: false
      }
    };
    recommendationCache.set(cacheKey, { value, cachedAt: Date.now(), seenRecommendations });
    return value;
  }
}
