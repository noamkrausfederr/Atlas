import { buildMockPlaces } from './mockCatalog.js';
import { hasProviderKey, isRecommendationProviderAllowed } from '../../config/env.js';
import {
  NormalizedPlace,
  PlaceReview,
  ProviderContext,
  RecommendationProvider,
  TravelCategory
} from './types.js';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeNameForMatching(value: string) {
  return normalizeText(value)
    .replace(/\b(the|a|an|de|du|des|di|da|del|della|of|and|at|in)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function coordinatesAreNearby(left?: { lat?: number; lng?: number }, right?: { lat?: number; lng?: number }) {
  if (
    left?.lat == null ||
    left?.lng == null ||
    right?.lat == null ||
    right?.lng == null
  ) {
    return false;
  }

  return Math.abs(left.lat - right.lat) < 0.0025 && Math.abs(left.lng - right.lng) < 0.0025;
}

function namesLookEquivalent(left: string, right: string) {
  const normalizedLeft = normalizeNameForMatching(left);
  const normalizedRight = normalizeNameForMatching(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function inferCategoryFromTypes(types: string[] = []): TravelCategory {
  if (types.some((type) => type.includes('museum'))) return 'museum';
  if (types.some((type) => type.includes('park') || type.includes('garden'))) return 'park';
  if (types.some((type) => type.includes('bar') || type.includes('pub'))) return 'bar';
  if (types.some((type) => type.includes('cafe') || type.includes('coffee'))) return 'cafe';
  if (types.some((type) => type.includes('restaurant') || type.includes('food'))) return 'restaurant';
  if (types.some((type) => type.includes('shopping') || type.includes('store') || type.includes('shop'))) return 'shopping';
  if (types.some((type) => type.includes('lodging') || type.includes('hotel') || type.includes('accommodation'))) return 'hotel';
  return 'attraction';
}

function inferCategoryFromWikipedia(title: string, categories: string[] = []): TravelCategory {
  return inferCategoryFromTypes([title.toLowerCase(), ...categories.map((category) => category.toLowerCase())]);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function buildFoursquareHeaders() {
  return {
    accept: 'application/json',
    Authorization: process.env.FOURSQUARE_API_KEY as string,
    'X-Places-Api-Version': '1970-01-01'
  };
}

function formatFoursquarePhoto(photo?: { prefix?: string; suffix?: string; width?: number; height?: number }) {
  if (!photo?.prefix || !photo?.suffix) {
    return undefined;
  }

  const width = photo.width ?? 900;
  const height = photo.height ?? 900;
  return `${photo.prefix}${width}x${height}${photo.suffix}`;
}

function pickGeoapifyWebsite(properties: Record<string, unknown>) {
  const website =
    properties.website ||
    properties['contact:website'] ||
    (typeof properties.brand_details === 'object' && properties.brand_details !== null
      ? (properties.brand_details as Record<string, unknown>).website
      : undefined) ||
    (typeof properties.datasource === 'object' && properties.datasource !== null
      ? (properties.datasource as Record<string, unknown>).website
      : undefined);

  return typeof website === 'string' && website.trim() ? website.trim() : undefined;
}

function pickGeoapifyOpeningHours(properties: Record<string, unknown>) {
  const openingHours = properties.opening_hours;
  return typeof openingHours === 'string' && openingHours.trim() ? openingHours.trim() : undefined;
}

function buildGeoapifyAddress(properties: Record<string, unknown>) {
  const formatted = properties.formatted;
  if (typeof formatted === 'string' && formatted.trim()) {
    return formatted.trim();
  }

  return [
    properties.address_line1,
    properties.address_line2,
    properties.city,
    properties.country
  ]
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .join(', ');
}

function pickGeoapifyPointCoordinates(geometry?: { coordinates?: unknown }) {
  if (!geometry || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
    return null;
  }

  const [lon, lat] = geometry.coordinates;
  if (typeof lon !== 'number' || typeof lat !== 'number') {
    return null;
  }

  return { lat, lng: lon };
}

function normalizeTicketmasterPriceLevel(priceRanges?: Array<{ min?: number; max?: number }>) {
  const numericValues = (priceRanges ?? [])
    .flatMap((range) => [range.min, range.max])
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

  if (!numericValues.length) {
    return undefined;
  }

  const averagePrice = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  if (averagePrice <= 25) return 1;
  if (averagePrice <= 75) return 2;
  if (averagePrice <= 150) return 3;
  return 4;
}

function buildTicketmasterDescription(event: {
  name?: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  _embedded?: {
    venues?: Array<{ name?: string; city?: { name?: string } }>;
    attractions?: Array<{ name?: string }>;
  };
}) {
  const date = event.dates?.start?.localDate;
  const time = event.dates?.start?.localTime;
  const venue = event._embedded?.venues?.[0]?.name;
  const city = event._embedded?.venues?.[0]?.city?.name;
  const attractionNames = (event._embedded?.attractions ?? [])
    .map((item) => item.name?.trim() ?? '')
    .filter(Boolean);

  const parts = [
    attractionNames.length ? attractionNames.slice(0, 2).join(', ') : undefined,
    venue,
    city,
    date ? `${date}${time ? ` ${time}` : ''}` : undefined
  ].filter(Boolean);

  if (!parts.length) {
    return event.name ? `Live event listing for ${event.name}.` : 'Live event listing.';
  }

  return parts.join(' · ');
}

function buildTicketmasterAddress(venue?: {
  address?: { line1?: string };
  city?: { name?: string };
  state?: { stateCode?: string; name?: string };
  country?: { countryCode?: string; name?: string };
}) {
  return [
    venue?.address?.line1,
    venue?.city?.name,
    venue?.state?.stateCode ?? venue?.state?.name,
    venue?.country?.countryCode ?? venue?.country?.name
  ]
    .filter(Boolean)
    .join(', ');
}

function mapCategoryToTicketmasterClassifications(category: TravelCategory) {
  switch (category) {
    case 'restaurant':
    case 'cafe':
    case 'bar':
      return ['music'];
    case 'museum':
      return ['arts & theatre'];
    case 'park':
    case 'shopping':
    case 'hotel':
      return ['miscellaneous'];
    case 'experience':
    case 'attraction':
    default:
      return ['music', 'arts & theatre'];
  }
}

function formatTicketmasterDateBoundary(dateValue: string | undefined, boundary: 'start' | 'end') {
  if (!dateValue) {
    return undefined;
  }

  const normalized = dateValue.includes('T')
    ? dateValue
    : `${dateValue}T${boundary === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  if (!dateValue.includes('T')) {
    return parsed.toISOString();
  }

  return boundary === 'start'
    ? new Date(parsed.setUTCHours(0, 0, 0, 0)).toISOString()
    : new Date(parsed.setUTCHours(23, 59, 59, 999)).toISOString();
}

function isTicketmasterEventInTripRange(
  event: { dates?: { start?: { localDate?: string; dateTime?: string } } },
  startDate?: string,
  endDate?: string
) {
  if (!startDate && !endDate) {
    return true;
  }

  const eventLocalDate = event.dates?.start?.localDate;
  if (eventLocalDate) {
    if (startDate && eventLocalDate < startDate.slice(0, 10)) {
      return false;
    }
    if (endDate && eventLocalDate > endDate.slice(0, 10)) {
      return false;
    }
    return true;
  }

  const eventDateTime = event.dates?.start?.dateTime;
  if (!eventDateTime) {
    return false;
  }

  const eventTime = new Date(eventDateTime).getTime();
  if (Number.isNaN(eventTime)) {
    return false;
  }

  const startBoundary = formatTicketmasterDateBoundary(startDate, 'start');
  const endBoundary = formatTicketmasterDateBoundary(endDate, 'end');
  if (startBoundary && eventTime < new Date(startBoundary).getTime()) {
    return false;
  }
  if (endBoundary && eventTime > new Date(endBoundary).getTime()) {
    return false;
  }
  return true;
}

class MockProvider implements RecommendationProvider {
  name = 'mock' as const;

  enabled() {
    return true;
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    return buildMockPlaces(context.destination, context.categories).slice(0, context.limit);
  }
}

class WikipediaProvider implements RecommendationProvider {
  name = 'wikipedia' as const;

  enabled() {
    return isRecommendationProviderAllowed(this.name);
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    if (!this.enabled()) {
      return [];
    }

    if (context.latitude == null || context.longitude == null) {
      return [];
    }

    const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('list', 'geosearch');
    searchUrl.searchParams.set('gscoord', `${context.latitude}|${context.longitude}`);
    searchUrl.searchParams.set('gsradius', String(Math.min(context.radiusMeters, 10000)));
    searchUrl.searchParams.set('gslimit', String(Math.min(context.limit * 3, 20)));
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('origin', '*');

    const searchPayload = await fetchJson<{
      query?: {
        geosearch?: Array<{
          pageid: number;
          title: string;
          lat?: number;
          lon?: number;
        }>;
      };
    }>(searchUrl.toString(), {
      headers: {
        'User-Agent': 'TripBoard/0.1 (open-data-dev)'
      }
    });

    const searchItems = searchPayload?.query?.geosearch ?? [];
    if (!searchItems.length) {
      return [];
    }

    const detailsUrl = new URL('https://en.wikipedia.org/w/api.php');
    detailsUrl.searchParams.set('action', 'query');
    detailsUrl.searchParams.set('prop', 'description|extracts|pageimages|categories|info');
    detailsUrl.searchParams.set('pageids', searchItems.map((item) => item.pageid).join('|'));
    detailsUrl.searchParams.set('inprop', 'url');
    detailsUrl.searchParams.set('exintro', '1');
    detailsUrl.searchParams.set('explaintext', '1');
    detailsUrl.searchParams.set('pithumbsize', '900');
    detailsUrl.searchParams.set('cllimit', '10');
    detailsUrl.searchParams.set('format', 'json');
    detailsUrl.searchParams.set('origin', '*');

    const detailsPayload = await fetchJson<{
      query?: {
        pages?: Record<
          string,
          {
            pageid?: number;
            title?: string;
            description?: string;
            extract?: string;
            fullurl?: string;
            thumbnail?: { source?: string };
            categories?: Array<{ title?: string }>;
          }
        >;
      };
    }>(detailsUrl.toString(), {
      headers: {
        'User-Agent': 'TripBoard/0.1 (open-data-dev)'
      }
    });

    const detailPages = detailsPayload?.query?.pages ?? {};

    return searchItems.slice(0, context.limit).map((item) => {
      const detail = detailPages[String(item.pageid)];
      const categoryNames = (detail?.categories ?? [])
        .map((category) => category.title?.replace(/^Category:/, '') ?? '')
        .filter(Boolean);
      const category = inferCategoryFromWikipedia(item.title, categoryNames);
      const summary = detail?.extract || detail?.description || `A notable place near ${context.destination}.`;
      const tags = Array.from(new Set([category, ...categoryNames.slice(0, 4)])).filter(Boolean);

      return {
        canonicalId: `wikipedia-${item.pageid}`,
        name: detail?.title ?? item.title,
        destination: context.destination,
        lat: item.lat,
        lng: item.lon,
        category,
        description: summary,
        imageUrl: detail?.thumbnail?.source,
        websiteUrl: detail?.fullurl,
        sourceAttributions: [
          {
            provider: 'wikipedia',
            providerId: String(item.pageid),
            url: detail?.fullurl,
            summary
          }
        ],
        tags
      };
    });
  }
}

class FoursquareProvider implements RecommendationProvider {
  name = 'foursquare' as const;

  enabled() {
    return isRecommendationProviderAllowed(this.name) && hasProviderKey(this.name);
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    if (!this.enabled()) {
      return [];
    }

    const requestedCategories: TravelCategory[] = context.categories.length ? context.categories : ['attraction'];
    const categoryQueries = Array.from(new Set(requestedCategories.map(mapCategoryToFoursquareQuery)));

    const results = await Promise.all(
      categoryQueries.map(async (query) => {
        const searchUrl = new URL('https://api.foursquare.com/v3/places/search');
        searchUrl.searchParams.set('query', query);
        searchUrl.searchParams.set('sort', 'POPULARITY');
        searchUrl.searchParams.set('limit', String(Math.min(context.limit, 20)));
        searchUrl.searchParams.set(
          'fields',
          [
            'fsq_place_id',
            'name',
            'description',
            'location',
            'geocodes',
            'categories',
            'rating',
            'price',
            'website',
            'photos',
            'tips_count',
            'link'
          ].join(',')
        );
        if (context.latitude != null && context.longitude != null) {
          searchUrl.searchParams.set('ll', `${context.latitude},${context.longitude}`);
          searchUrl.searchParams.set('radius', String(Math.min(context.radiusMeters, 100000)));
        } else {
          searchUrl.searchParams.set('near', context.destination);
        }

        return fetchJson<{
          results?: Array<{
            fsq_place_id?: string;
            name?: string;
            description?: string;
            rating?: number;
            price?: number | string;
            website?: string;
            link?: string;
            tips_count?: number;
            categories?: Array<{ name?: string }>;
            location?: {
              formatted_address?: string;
              address?: string;
              locality?: string;
              region?: string;
              country?: string;
            };
            geocodes?: {
              main?: { latitude?: number; longitude?: number };
              roof?: { latitude?: number; longitude?: number };
            };
            photos?: Array<{
              prefix?: string;
              suffix?: string;
              width?: number;
              height?: number;
            }>;
          }>;
        }>(searchUrl.toString(), {
          headers: buildFoursquareHeaders()
        });
      })
    );

    const seeds = dedupePlaces(
      results
        .flatMap((payload) => payload?.results ?? [])
        .map((place) => ({
          canonicalId: `foursquare-${place.fsq_place_id ?? slugify(place.name ?? 'place')}`,
          name: place.name ?? 'Unknown place',
          destination: context.destination,
          lat: place.geocodes?.main?.latitude ?? place.geocodes?.roof?.latitude,
          lng: place.geocodes?.main?.longitude ?? place.geocodes?.roof?.longitude,
          address:
            place.location?.formatted_address ??
            [place.location?.address, place.location?.locality, place.location?.region, place.location?.country]
              .filter(Boolean)
              .join(', '),
          category: inferCategoryFromTypes((place.categories ?? []).map((item) => item.name ?? '')),
          description: place.description,
          priceLevel: normalizeFoursquarePriceLevel(place.price),
          rating: normalizeFoursquareRating(place.rating),
          reviewCount: place.tips_count,
          imageUrl: formatFoursquarePhoto(place.photos?.[0]),
          websiteUrl: place.website ?? place.link,
          sourceAttributions: place.fsq_place_id
            ? [
                {
                  provider: 'foursquare',
                  providerId: place.fsq_place_id,
                  url: place.website ?? place.link,
                  rating: normalizeFoursquareRating(place.rating),
                  reviewCount: place.tips_count,
                  summary: place.description
                }
              ]
            : [],
          tags: (place.categories ?? []).map((item) => item.name ?? '').filter(Boolean)
        }))
    );

    const enriched = await Promise.all(
      seeds.slice(0, context.limit).map(async (seed) => {
        const attribution = seed.sourceAttributions.find((item) => item.provider === 'foursquare');
        const fsqId = attribution?.providerId;
        if (!fsqId) {
          return seed;
        }

        const [detailsPayload, tipsPayload, photosPayload] = await Promise.all([
          fetchJson<{
            fsq_place_id?: string;
            description?: string;
            website?: string;
            link?: string;
            rating?: number;
            price?: number | string;
            photos?: Array<{
              prefix?: string;
              suffix?: string;
              width?: number;
              height?: number;
            }>;
            tips_count?: number;
          }>(`https://api.foursquare.com/v3/places/${fsqId}?fields=fsq_place_id,description,website,link,rating,price,photos,tips_count`, {
            headers: buildFoursquareHeaders()
          }),
          fetchJson<{
            tips?: Array<{
              text?: string;
              created_at?: string;
              url?: string;
              lang?: string;
            }>;
            results?: Array<{
              text?: string;
              created_at?: string;
              url?: string;
              lang?: string;
            }>;
          }>(`https://api.foursquare.com/v3/places/${fsqId}/tips?limit=3&sort=POPULAR`, {
            headers: buildFoursquareHeaders()
          }),
          !seed.imageUrl
            ? fetchJson<
                Array<{
                  prefix?: string;
                  suffix?: string;
                  width?: number;
                  height?: number;
                }>
              >(`https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1`, {
                headers: buildFoursquareHeaders()
              })
            : Promise.resolve(null)
        ]);

        const tipItems = tipsPayload?.tips ?? tipsPayload?.results ?? [];
        const reviews: PlaceReview[] = tipItems
          .map((tip) => ({
            provider: 'foursquare' as const,
            author: 'Foursquare tip',
            text: tip.text?.trim() ?? '',
            url: tip.url,
            publishedAt: tip.created_at
          }))
          .filter((review) => Boolean(review.text));
        const detailRating = normalizeFoursquareRating(detailsPayload?.rating);
        const detailReviewCount = detailsPayload?.tips_count ?? seed.reviewCount;

        return {
          ...seed,
          description: detailsPayload?.description ?? seed.description,
          priceLevel: normalizeFoursquarePriceLevel(detailsPayload?.price) ?? seed.priceLevel,
          rating: detailRating ?? seed.rating,
          reviewCount: detailReviewCount,
          imageUrl: seed.imageUrl ?? formatFoursquarePhoto(detailsPayload?.photos?.[0]) ?? formatFoursquarePhoto(photosPayload?.[0]),
          websiteUrl: detailsPayload?.website ?? detailsPayload?.link ?? seed.websiteUrl,
          sourceAttributions: seed.sourceAttributions.map((item) =>
            item.provider === 'foursquare'
              ? {
                  ...item,
                  url: detailsPayload?.website ?? detailsPayload?.link ?? item.url,
                  rating: detailRating ?? item.rating,
                  reviewCount: detailReviewCount,
                  summary: detailsPayload?.description ?? item.summary
                }
              : item
          ),
          reviews
        };
      })
    );

    return enriched;
  }
}

class GeoapifyProvider implements RecommendationProvider {
  name = 'geoapify' as const;

  enabled() {
    return isRecommendationProviderAllowed(this.name) && hasProviderKey(this.name);
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    if (!this.enabled() || context.latitude == null || context.longitude == null) {
      return [];
    }

    const apiKey = process.env.GEOAPIFY_API_KEY as string;
    const categoryQueries = Array.from(new Set(context.categories.map(mapCategoryToGeoapifyCategory)));
    const placesUrl = new URL('https://api.geoapify.com/v2/places');
    placesUrl.searchParams.set('categories', categoryQueries.join(','));
    placesUrl.searchParams.set('filter', `circle:${context.longitude},${context.latitude},${Math.min(context.radiusMeters, 20000)}`);
    placesUrl.searchParams.set('bias', `proximity:${context.longitude},${context.latitude}`);
    placesUrl.searchParams.set('limit', String(Math.min(context.limit * 3, 30)));
    placesUrl.searchParams.set('lang', 'en');
    placesUrl.searchParams.set('apiKey', apiKey);

    const payload = await fetchJson<{
      features?: Array<{
        properties?: Record<string, unknown> & {
          name?: string;
          formatted?: string;
          categories?: string[];
          place_id?: string;
        };
        geometry?: {
          coordinates?: [number, number];
        };
      }>;
    }>(placesUrl.toString());

    const seeds: NormalizedPlace[] = (payload?.features ?? [])
      .map((feature): NormalizedPlace | null => {
        const properties = feature.properties ?? {};
        const placeId = typeof properties.place_id === 'string' ? properties.place_id : undefined;
        const name = typeof properties.name === 'string' ? properties.name : undefined;
        if (!placeId || !name) {
          return null;
        }

        const categories = Array.isArray(properties.categories)
          ? properties.categories.filter((value): value is string => typeof value === 'string')
          : [];
        const address = buildGeoapifyAddress(properties) || context.destination;

        const point = pickGeoapifyPointCoordinates(feature.geometry);

        return {
          canonicalId: `geoapify-${placeId}`,
          name,
          destination: context.destination,
          lat: point?.lat,
          lng: point?.lng,
          address,
          category: inferCategoryFromTypes(categories),
          description: `A live place recommendation near ${context.destination}.`,
          websiteUrl: pickGeoapifyWebsite(properties),
          sourceAttributions: [
            {
              provider: 'geoapify' as const,
              providerId: placeId,
              url: pickGeoapifyWebsite(properties)
            }
          ],
          tags: categories.slice(0, 6)
        };
      })
      .filter((item): item is NormalizedPlace => item !== null);

    if (!seeds.length) {
      return [];
    }

    const enriched = await Promise.all(
      seeds.slice(0, context.limit).map(async (seed) => {
        const geoapifySource = seed.sourceAttributions.find((item) => item.provider === 'geoapify');
        const placeId = geoapifySource?.providerId;
        if (!placeId) {
          return seed;
        }

        const detailUrl = new URL('https://api.geoapify.com/v2/place-details');
        detailUrl.searchParams.set('id', placeId);
        detailUrl.searchParams.set('features', 'details');
        detailUrl.searchParams.set('lang', 'en');
        detailUrl.searchParams.set('apiKey', apiKey);

        const detailPayload = await fetchJson<{
          features?: Array<{
            properties?: Record<string, unknown> & {
              categories?: string[];
              name?: string;
              formatted?: string;
              opening_hours?: string;
              description?: string;
            };
            geometry?: {
              coordinates?: [number, number];
            };
          }>;
        }>(detailUrl.toString());

        const properties = detailPayload?.features?.[0]?.properties ?? {};
        const categories = Array.isArray(properties.categories)
          ? properties.categories.filter((value): value is string => typeof value === 'string')
          : seed.tags;
        const detailWebsite = pickGeoapifyWebsite(properties);
        const detailDescription =
          typeof properties.description === 'string' && properties.description.trim()
            ? properties.description.trim()
            : seed.description;
        const detailAddress = buildGeoapifyAddress(properties) || seed.address;
        const openingHours = pickGeoapifyOpeningHours(properties);

        const detailPoint = pickGeoapifyPointCoordinates(detailPayload?.features?.[0]?.geometry);

        return {
          ...seed,
          lat: detailPoint?.lat ?? seed.lat,
          lng: detailPoint?.lng ?? seed.lng,
          address: detailAddress,
          category: inferCategoryFromTypes(categories),
          description: detailDescription,
          websiteUrl: detailWebsite ?? seed.websiteUrl,
          sourceAttributions: seed.sourceAttributions.map((item) =>
            item.provider === 'geoapify'
              ? {
                  ...item,
                  url: detailWebsite ?? item.url,
                  summary: openingHours
                    ? `${detailDescription} Opening hours listed.`
                    : detailDescription
                }
              : item
          ),
          tags: categories.slice(0, 6)
        };
      })
    );

    return enriched.filter((item): item is NormalizedPlace => item !== null);
  }
}

class OpenTripMapProvider implements RecommendationProvider {
  name = 'opentripmap' as const;

  enabled() {
    return isRecommendationProviderAllowed(this.name) && hasProviderKey(this.name);
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    if (!this.enabled() || context.latitude == null || context.longitude == null) {
      return [];
    }

    const apiKey = process.env.OPENTRIPMAP_API_KEY as string;
    const kinds = Array.from(new Set([...context.categories.map(mapCategoryToOpenTripMapKind), 'interesting_places']));
    const radiusPayloads = await Promise.all(
      kinds.map((kind) => {
        const radiusUrl = new URL('https://api.opentripmap.com/0.1/en/places/radius');
        radiusUrl.searchParams.set('apikey', apiKey);
        radiusUrl.searchParams.set('radius', String(Math.min(context.radiusMeters, 20000)));
        radiusUrl.searchParams.set('lon', String(context.longitude));
        radiusUrl.searchParams.set('lat', String(context.latitude));
        radiusUrl.searchParams.set('limit', String(Math.min(Math.max(context.limit, 8), 12)));
        radiusUrl.searchParams.set('rate', '2');
        radiusUrl.searchParams.set('format', 'json');
        radiusUrl.searchParams.set('kinds', kind);

        return fetchJson<
          Array<{
            xid?: string;
            name?: string;
            kinds?: string;
            point?: { lon?: number; lat?: number };
          }>
        >(radiusUrl.toString(), {
          headers: {
            'User-Agent': 'TripBoard/0.1 (open-data-dev)'
          }
        });
      })
    );

    const seedMap = new Map<string, {
      xid?: string;
      name?: string;
      kinds?: string;
      point?: { lon?: number; lat?: number };
    }>();
    for (const payload of radiusPayloads) {
      for (const item of payload ?? []) {
        if (!item.xid || !item.name || seedMap.has(item.xid)) continue;
        seedMap.set(item.xid, item);
      }
    }

    const seeds = Array.from(seedMap.values()).slice(0, Math.min(context.limit * 2, 24));
    if (!seeds.length) {
      return [];
    }

    const places = await Promise.all(
      seeds.map(async (seed): Promise<NormalizedPlace | null> => {
        const detailUrl = new URL(`https://api.opentripmap.com/0.1/en/places/xid/${seed.xid}`);
        detailUrl.searchParams.set('apikey', apiKey);

        const detail = await fetchJson<{
          xid?: string;
          name?: string;
          kinds?: string;
          address?: {
            road?: string;
            house_number?: string;
            city?: string;
            state?: string;
            country?: string;
          };
          image?: string;
          preview?: { source?: string };
          wikipedia_extracts?: { text?: string };
          info?: { descr?: string };
          url?: string;
          otm?: string;
          point?: { lon?: number; lat?: number };
        }>(detailUrl.toString(), {
          headers: {
            'User-Agent': 'TripBoard/0.1 (open-data-dev)'
          }
        });

        if (!detail?.xid || !detail.name) {
          return null;
        }

        const kindList = (detail.kinds ?? seed.kinds ?? '').split(',').filter(Boolean);
        const addressParts = [
          detail.address?.road,
          detail.address?.house_number,
          detail.address?.city,
          detail.address?.state,
          detail.address?.country
        ].filter(Boolean);
        const summary =
          detail.wikipedia_extracts?.text ||
          detail.info?.descr ||
          `${detail.name} is a notable stop in ${context.destination}.`;

        return {
          canonicalId: `opentripmap-${detail.xid}`,
          name: detail.name,
          destination: context.destination,
          lat: detail.point?.lat ?? seed.point?.lat,
          lng: detail.point?.lon ?? seed.point?.lon,
          address: addressParts.join(', ') || context.destination,
          category: inferCategoryFromTypes(kindList),
          description: summary,
          imageUrl: detail.preview?.source ?? detail.image,
          websiteUrl: detail.url ?? detail.otm,
          sourceAttributions: [
            {
              provider: 'opentripmap',
              providerId: detail.xid,
              url: detail.url ?? detail.otm,
              summary
            }
          ],
          tags: kindList.slice(0, 6)
        };
      })
    );

    return places.filter((item): item is NonNullable<typeof item> => item !== null);
  }
}

class TicketmasterProvider implements RecommendationProvider {
  name = 'ticketmaster' as const;

  enabled() {
    return isRecommendationProviderAllowed(this.name) && hasProviderKey(this.name);
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    if (!this.enabled()) {
      return [];
    }

    const requestedCategories: TravelCategory[] = context.categories.length ? context.categories : ['attraction'];
    const classifications = Array.from(
      new Set(requestedCategories.flatMap((category) => mapCategoryToTicketmasterClassifications(category)))
    );

    const payloads = await Promise.all(
      classifications.map((classificationName) => {
        const searchUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
        searchUrl.searchParams.set('apikey', process.env.TICKETMASTER_API_KEY as string);
        searchUrl.searchParams.set('classificationName', classificationName);
        searchUrl.searchParams.set('size', String(Math.min(context.limit * 2, 20)));
        searchUrl.searchParams.set('sort', 'date,asc');
        searchUrl.searchParams.set('locale', '*');
        searchUrl.searchParams.set('unit', 'km');
        searchUrl.searchParams.set('radius', String(Math.min(Math.max(Math.round(context.radiusMeters / 1000), 5), 100)));
        const startDateTime = formatTicketmasterDateBoundary(context.startDate, 'start');
        const endDateTime = formatTicketmasterDateBoundary(context.endDate, 'end');
        if (startDateTime) {
          searchUrl.searchParams.set('startDateTime', startDateTime);
        }
        if (endDateTime) {
          searchUrl.searchParams.set('endDateTime', endDateTime);
        }
        if (startDateTime || endDateTime) {
          searchUrl.searchParams.set('includeTBA', 'no');
          searchUrl.searchParams.set('includeTBD', 'no');
        }

        if (context.latitude != null && context.longitude != null) {
          searchUrl.searchParams.set('latlong', `${context.latitude},${context.longitude}`);
        } else {
          searchUrl.searchParams.set('keyword', context.destination);
        }

        return fetchJson<{
          _embedded?: {
            events?: Array<{
              id?: string;
              name?: string;
              url?: string;
              images?: Array<{ url?: string; width?: number; height?: number }>;
              priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
              dates?: {
                start?: {
                  localDate?: string;
                  localTime?: string;
                };
              };
              classifications?: Array<{
                segment?: { name?: string };
                genre?: { name?: string };
                subGenre?: { name?: string };
              }>;
              _embedded?: {
                venues?: Array<{
                  name?: string;
                  url?: string;
                  address?: { line1?: string };
                  city?: { name?: string };
                  state?: { stateCode?: string; name?: string };
                  country?: { countryCode?: string; name?: string };
                  location?: { latitude?: string; longitude?: string };
                }>;
                attractions?: Array<{
                  name?: string;
                  url?: string;
                }>;
              };
            }>;
          };
        }>(searchUrl.toString());
      })
    );

    const events = payloads
      .flatMap((payload) => payload?._embedded?.events ?? [])
      .filter((event) => isTicketmasterEventInTripRange(event, context.startDate, context.endDate));

    return dedupePlaces(
      events
        .map((event): NormalizedPlace | null => {
          if (!event.id || !event.name) {
            return null;
          }

          const venue = event._embedded?.venues?.[0];
          const latitude = venue?.location?.latitude ? Number(venue.location.latitude) : undefined;
          const longitude = venue?.location?.longitude ? Number(venue.location.longitude) : undefined;
          const classificationTags = (event.classifications ?? []).flatMap((classification) =>
            [classification.segment?.name, classification.genre?.name, classification.subGenre?.name].filter(Boolean)
          ) as string[];
          const attractionTags = (event._embedded?.attractions ?? [])
            .map((item) => item.name?.trim() ?? '')
            .filter(Boolean);
          const description = buildTicketmasterDescription(event);

          return {
            canonicalId: `ticketmaster-${event.id}`,
            name: event.name,
            destination: context.destination,
            lat: latitude != null && !Number.isNaN(latitude) ? latitude : undefined,
            lng: longitude != null && !Number.isNaN(longitude) ? longitude : undefined,
            address: buildTicketmasterAddress(venue) || context.destination,
            category: 'experience',
            description,
            priceLevel: normalizeTicketmasterPriceLevel(event.priceRanges),
            imageUrl: event.images?.slice().sort((left, right) => (right.width ?? 0) - (left.width ?? 0))[0]?.url,
            websiteUrl: event.url ?? venue?.url ?? event._embedded?.attractions?.[0]?.url,
            sourceAttributions: [
              {
                provider: 'ticketmaster' as const,
                providerId: event.id,
                url: event.url ?? venue?.url,
                summary: description
              }
            ],
            tags: Array.from(new Set(['experience', ...classificationTags, ...attractionTags])).slice(0, 8)
          };
        })
        .filter((item): item is NormalizedPlace => item !== null)
    ).slice(0, context.limit);
  }
}

class GooglePlacesProvider implements RecommendationProvider {
  name = 'google' as const;

  enabled() {
    return isRecommendationProviderAllowed(this.name) && hasProviderKey(this.name);
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    if (!this.enabled() || context.latitude == null || context.longitude == null) {
      return [];
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.primaryType',
          'places.types',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.websiteUri'
        ].join(',')
      },
      body: JSON.stringify({
        includedTypes: context.categories.length ? context.categories.map(mapCategoryToGoogleType) : undefined,
        maxResultCount: Math.min(context.limit, 20),
        rankPreference: 'POPULARITY',
        locationRestriction: {
          circle: {
            center: {
              latitude: context.latitude,
              longitude: context.longitude
            },
            radius: context.radiusMeters
          }
        }
      })
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        primaryType?: string;
        types?: string[];
        rating?: number;
        userRatingCount?: number;
        priceLevel?: string | number;
        websiteUri?: string;
      }>;
    };

    return (payload.places ?? []).map((place) => ({
      canonicalId: `google-${place.id}`,
      name: place.displayName?.text ?? 'Unknown place',
      destination: context.destination,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      address: place.formattedAddress,
      category: inferCategoryFromTypes(place.types ?? [place.primaryType ?? '']),
      priceLevel: normalizePriceLevel(place.priceLevel),
      rating: place.rating,
      reviewCount: place.userRatingCount,
      websiteUrl: place.websiteUri,
      sourceAttributions: [
        {
          provider: 'google',
          providerId: place.id,
          rating: place.rating,
          reviewCount: place.userRatingCount
        }
      ],
      tags: (place.types ?? []).slice(0, 5)
    }));
  }
}

class TripadvisorProvider implements RecommendationProvider {
  name = 'tripadvisor' as const;

  enabled() {
    return isRecommendationProviderAllowed(this.name) && hasProviderKey(this.name);
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    if (!this.enabled()) {
      return [];
    }

    const locationIds = new Map<string, { category: TravelCategory; name: string; address?: string }>();
    const requestedCategories: TravelCategory[] = context.categories.length ? context.categories : ['attraction'];

    for (const category of requestedCategories) {
      const searchPayload = await fetchJson<{
        data?: Array<{
          location_id?: string;
          name?: string;
          address_obj?: { address_string?: string };
        }>;
      }>(buildTripadvisorSearchUrl(context, category));

      for (const item of searchPayload?.data ?? []) {
        if (!item.location_id) continue;
        locationIds.set(item.location_id, {
          category,
          name: item.name ?? 'Unknown place',
          address: item.address_obj?.address_string
        });
      }
    }

    const detailResults = await Promise.all(
      Array.from(locationIds.entries()).slice(0, context.limit).map(async ([locationId, seed]): Promise<NormalizedPlace | null> => {
        const [detailsPayload, photosPayload] = await Promise.all([
          fetchJson<{
            location_id?: string;
            name?: string;
            description?: string;
            address_obj?: { address_string?: string };
            latitude?: string;
            longitude?: string;
            rating?: string;
            num_reviews?: string;
            price_level?: string;
            web_url?: string;
            website?: string;
            ranking_data?: { ranking_string?: string };
            ancestors?: Array<{ name?: string }>;
          }>(buildTripadvisorDetailsUrl(locationId)),
          fetchJson<{
            data?: Array<{
              images?: {
                large?: { url?: string };
                original?: { url?: string };
              };
            }>;
          }>(buildTripadvisorPhotosUrl(locationId))
        ]);

        if (!detailsPayload) {
          return null;
        }

        const image = photosPayload?.data?.[0]?.images?.large?.url ?? photosPayload?.data?.[0]?.images?.original?.url;
        const tags = [
          seed.category,
          detailsPayload.ranking_data?.ranking_string,
          ...(detailsPayload.ancestors ?? []).map((ancestor) => ancestor.name ?? '')
        ].filter(Boolean) as string[];

        return {
          canonicalId: `tripadvisor-${locationId}`,
          name: detailsPayload.name ?? seed.name,
          destination: context.destination,
          lat: detailsPayload.latitude ? Number(detailsPayload.latitude) : undefined,
          lng: detailsPayload.longitude ? Number(detailsPayload.longitude) : undefined,
          address: detailsPayload.address_obj?.address_string ?? seed.address,
          category: seed.category,
          description: detailsPayload.description,
          priceLevel: normalizeTripadvisorPriceLevel(detailsPayload.price_level),
          rating: detailsPayload.rating ? Number(detailsPayload.rating) : undefined,
          reviewCount: detailsPayload.num_reviews ? Number(detailsPayload.num_reviews) : undefined,
          imageUrl: image,
          websiteUrl: detailsPayload.website ?? detailsPayload.web_url,
          sourceAttributions: [
            {
              provider: 'tripadvisor',
              providerId: locationId,
              url: detailsPayload.web_url,
              rating: detailsPayload.rating ? Number(detailsPayload.rating) : undefined,
              reviewCount: detailsPayload.num_reviews ? Number(detailsPayload.num_reviews) : undefined,
              summary: detailsPayload.description
            }
          ],
          tags
        };
      })
    );

    return detailResults.filter((item): item is NonNullable<typeof item> => item !== null);
  }
}

class YelpProvider implements RecommendationProvider {
  name = 'yelp' as const;

  enabled() {
    return isRecommendationProviderAllowed(this.name) && hasProviderKey(this.name);
  }

  async fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]> {
    if (!this.enabled()) {
      return [];
    }

    const searchUrl = new URL('https://api.yelp.com/v3/businesses/search');
    if (context.latitude != null && context.longitude != null) {
      searchUrl.searchParams.set('latitude', String(context.latitude));
      searchUrl.searchParams.set('longitude', String(context.longitude));
      searchUrl.searchParams.set('radius', String(Math.min(context.radiusMeters, 40000)));
    } else {
      searchUrl.searchParams.set('location', context.destination);
    }
    searchUrl.searchParams.set('limit', String(Math.min(context.limit, 20)));
    searchUrl.searchParams.set('sort_by', 'best_match');
    if (context.categories.length) {
      searchUrl.searchParams.set(
        'categories',
        Array.from(new Set(context.categories.map(mapCategoryToYelpCategory))).join(',')
      );
    }

    const payload = await fetchJson<{
      businesses?: Array<{
        id: string;
        name?: string;
        image_url?: string;
        url?: string;
        review_count?: number;
        rating?: number;
        price?: string;
        coordinates?: { latitude?: number; longitude?: number };
        categories?: Array<{ alias?: string; title?: string }>;
        location?: { display_address?: string[] };
      }>;
    }>(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.YELP_API_KEY as string}`,
        accept: 'application/json'
      }
    });

    return (payload?.businesses ?? []).map((business) => ({
      canonicalId: `yelp-${business.id}`,
      name: business.name ?? 'Unknown place',
      destination: context.destination,
      lat: business.coordinates?.latitude,
      lng: business.coordinates?.longitude,
      address: business.location?.display_address?.join(', '),
      category: inferCategoryFromTypes((business.categories ?? []).map((item) => item.alias ?? '')),
      priceLevel: business.price?.length,
      rating: business.rating,
      reviewCount: business.review_count,
      imageUrl: business.image_url,
      websiteUrl: business.url,
      sourceAttributions: [
        {
          provider: 'yelp',
          providerId: business.id,
          url: business.url,
          rating: business.rating,
          reviewCount: business.review_count
        }
      ],
      tags: (business.categories ?? []).map((item) => item.title ?? item.alias ?? '').filter(Boolean)
    }));
  }
}

function normalizeFoursquareRating(value?: number) {
  if (value == null || Number.isNaN(value)) return undefined;
  return value > 5 ? Math.round((value / 2) * 10) / 10 : value;
}

function normalizeFoursquarePriceLevel(value?: string | number) {
  if (typeof value === 'number') {
    return value;
  }
  if (!value) {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric;
  }
  return undefined;
}

function normalizePriceLevel(value?: string | number) {
  if (typeof value === 'number') return value;
  if (!value) return undefined;
  if (value === 'PRICE_LEVEL_FREE') return 0;
  if (value === 'PRICE_LEVEL_INEXPENSIVE') return 1;
  if (value === 'PRICE_LEVEL_MODERATE') return 2;
  if (value === 'PRICE_LEVEL_EXPENSIVE') return 3;
  if (value === 'PRICE_LEVEL_VERY_EXPENSIVE') return 4;
  return undefined;
}

function mapCategoryToGoogleType(category: TravelCategory) {
  switch (category) {
    case 'restaurant':
      return 'restaurant';
    case 'cafe':
      return 'cafe';
    case 'museum':
      return 'museum';
    case 'park':
      return 'park';
    case 'bar':
      return 'bar';
    case 'shopping':
      return 'shopping_mall';
    case 'hotel':
      return 'lodging';
    case 'experience':
      return 'tourist_attraction';
    case 'attraction':
    default:
      return 'tourist_attraction';
  }
}

function mapCategoryToFoursquareQuery(category: TravelCategory) {
  switch (category) {
    case 'restaurant':
      return 'restaurants';
    case 'cafe':
      return 'cafes';
    case 'museum':
      return 'museums';
    case 'park':
      return 'parks';
    case 'bar':
      return 'bars';
    case 'shopping':
      return 'shopping';
    case 'hotel':
      return 'hotels';
    case 'experience':
      return 'experiences';
    case 'attraction':
    default:
      return 'tourist attractions';
  }
}

function mapCategoryToGeoapifyCategory(category: TravelCategory) {
  switch (category) {
    case 'restaurant':
      return 'catering.restaurant';
    case 'cafe':
      return 'catering.cafe';
    case 'museum':
      return 'entertainment.museum';
    case 'park':
      return 'leisure.park';
    case 'bar':
      return 'catering.bar';
    case 'shopping':
      return 'commercial.shopping_mall';
    case 'hotel':
      return 'accommodation.hotel';
    case 'experience':
    case 'attraction':
    default:
      return 'tourism';
  }
}

function mapCategoryToTripadvisorCategory(category: TravelCategory) {
  switch (category) {
    case 'restaurant':
    case 'cafe':
    case 'bar':
      return 'restaurants';
    case 'hotel':
      return 'hotels';
    case 'museum':
    case 'park':
    case 'shopping':
    case 'experience':
    case 'attraction':
    default:
      return 'attractions';
  }
}

function mapCategoryToYelpCategory(category: TravelCategory) {
  switch (category) {
    case 'restaurant':
      return 'restaurants';
    case 'cafe':
      return 'cafes';
    case 'museum':
      return 'museums';
    case 'park':
      return 'parks';
    case 'bar':
      return 'bars';
    case 'shopping':
      return 'shopping';
    case 'hotel':
      return 'hotels';
    case 'experience':
    case 'attraction':
    default:
      return 'arts';
  }
}

function mapCategoryToOpenTripMapKind(category: TravelCategory) {
  switch (category) {
    case 'restaurant':
      return 'restaurants';
    case 'cafe':
      return 'cafes';
    case 'museum':
      return 'museums';
    case 'park':
      return 'parks';
    case 'bar':
      return 'bars';
    case 'shopping':
      return 'shops';
    case 'hotel':
      return 'accomodations';
    case 'experience':
    case 'attraction':
    default:
      return 'interesting_places';
  }
}

function buildTripadvisorSearchUrl(context: ProviderContext, category: TravelCategory) {
  const url = new URL('https://api.content.tripadvisor.com/api/v1/location/search');
  url.searchParams.set('key', process.env.TRIPADVISOR_API_KEY as string);
  url.searchParams.set('searchQuery', context.destination);
  url.searchParams.set('category', mapCategoryToTripadvisorCategory(category));
  url.searchParams.set('language', 'en');
  if (context.latitude != null && context.longitude != null) {
    url.searchParams.set('latLong', `${context.latitude},${context.longitude}`);
    url.searchParams.set('radius', String(context.radiusMeters));
    url.searchParams.set('radiusUnit', 'm');
  }
  return url.toString();
}

function buildTripadvisorDetailsUrl(locationId: string) {
  const url = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details`);
  url.searchParams.set('key', process.env.TRIPADVISOR_API_KEY as string);
  url.searchParams.set('language', 'en');
  url.searchParams.set('currency', 'USD');
  return url.toString();
}

function buildTripadvisorPhotosUrl(locationId: string) {
  const url = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos`);
  url.searchParams.set('key', process.env.TRIPADVISOR_API_KEY as string);
  url.searchParams.set('language', 'en');
  url.searchParams.set('limit', '1');
  return url.toString();
}

function normalizeTripadvisorPriceLevel(value?: string) {
  if (!value) return undefined;
  return value.length;
}

export function dedupePlaces(places: NormalizedPlace[]) {
  const merged = new Map<string, NormalizedPlace>();

  for (const place of places) {
    const exactKey = slugify(`${place.name}-${place.address ?? place.destination}`);
    let key = exactKey;
    let existing = merged.get(exactKey);

    if (!existing) {
      for (const [candidateKey, candidate] of merged.entries()) {
        const sameDestination = normalizeText(candidate.destination) === normalizeText(place.destination);
        if (!sameDestination) continue;
        if (!namesLookEquivalent(candidate.name, place.name)) continue;
        const nearby = coordinatesAreNearby(candidate, place);
        const matchingAddress =
          candidate.address &&
          place.address &&
          normalizeText(candidate.address) === normalizeText(place.address);

        if (nearby || matchingAddress) {
          existing = candidate;
          key = candidateKey;
          break;
        }
      }
    }

    if (!existing) {
      merged.set(exactKey, place);
      continue;
    }

    merged.set(key, {
      ...existing,
      name: existing.name.length >= place.name.length ? existing.name : place.name,
      lat: existing.lat ?? place.lat,
      lng: existing.lng ?? place.lng,
      address: existing.address ?? place.address,
      rating: Math.max(existing.rating ?? 0, place.rating ?? 0) || existing.rating || place.rating,
      reviewCount: Math.max(existing.reviewCount ?? 0, place.reviewCount ?? 0) || existing.reviewCount || place.reviewCount,
      imageUrl: existing.imageUrl ?? place.imageUrl,
      websiteUrl: existing.websiteUrl ?? place.websiteUrl,
      description: existing.description ?? place.description,
      sourceAttributions: [...existing.sourceAttributions, ...place.sourceAttributions],
      reviews: [...(existing.reviews ?? []), ...(place.reviews ?? [])].slice(0, 5),
      tags: Array.from(new Set([...existing.tags, ...place.tags]))
    });
  }

  return Array.from(merged.values());
}

export function buildProviders(): RecommendationProvider[] {
  return [
    new GeoapifyProvider(),
    new TicketmasterProvider(),
    new FoursquareProvider(),
    new WikipediaProvider(),
    new OpenTripMapProvider(),
    new GooglePlacesProvider(),
    new TripadvisorProvider(),
    new YelpProvider(),
    new MockProvider()
  ];
}
