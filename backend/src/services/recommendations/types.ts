export type TravelCategory =
  | 'restaurant'
  | 'cafe'
  | 'attraction'
  | 'museum'
  | 'park'
  | 'bar'
  | 'shopping'
  | 'hotel'
  | 'experience';

export interface RecommendationRequest {
  destination: string;
  accommodation?: string;
  query?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  tripDays?: number;
  budget?: 'budget' | 'mid-range' | 'luxury';
  vibeTags?: string[];
  categories?: TravelCategory[];
  limit?: number;
  excludeCanonicalIds?: string[];
  bypassCache?: boolean;
}

export interface PlaceSourceAttribution {
  provider: 'google' | 'tripadvisor' | 'yelp' | 'opentripmap' | 'wikipedia' | 'foursquare' | 'geoapify' | 'ticketmaster' | 'mock';
  providerId: string;
  url?: string;
  rating?: number;
  reviewCount?: number;
  summary?: string;
}

export interface PlaceReview {
  provider: 'google' | 'tripadvisor' | 'yelp' | 'opentripmap' | 'wikipedia' | 'foursquare' | 'geoapify' | 'ticketmaster' | 'mock';
  author?: string;
  rating?: number;
  text: string;
  url?: string;
  publishedAt?: string;
}

export interface NormalizedPlace {
  canonicalId: string;
  name: string;
  destination: string;
  lat?: number;
  lng?: number;
  address?: string;
  category: TravelCategory;
  description?: string;
  priceLevel?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  websiteUrl?: string;
  sourceAttributions: PlaceSourceAttribution[];
  reviews?: PlaceReview[];
  tags: string[];
}

export interface RankedRecommendation extends NormalizedPlace {
  score: number;
  reason: string;
}

export interface RecommendationResponse {
  destination: string;
  recommendations: RankedRecommendation[];
  providersUsed: Array<'google' | 'tripadvisor' | 'yelp' | 'opentripmap' | 'wikipedia' | 'foursquare' | 'geoapify' | 'ticketmaster' | 'mock'>;
  usedMockData: boolean;
}

export interface ProviderContext {
  destination: string;
  query?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  categories: TravelCategory[];
  limit: number;
}

export interface RecommendationProvider {
  name: 'google' | 'tripadvisor' | 'yelp' | 'opentripmap' | 'wikipedia' | 'foursquare' | 'geoapify' | 'ticketmaster' | 'mock';
  enabled(): boolean;
  fetchPlaces(context: ProviderContext): Promise<NormalizedPlace[]>;
}
