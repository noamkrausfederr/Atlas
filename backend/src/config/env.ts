export type RecommendationProviderName = 'google' | 'tripadvisor' | 'yelp' | 'opentripmap' | 'wikipedia' | 'foursquare' | 'geoapify' | 'ticketmaster';
export type RecommendationProviderMode = 'mock' | 'open' | 'phase1' | 'full';

const PROVIDER_KEYS: Record<RecommendationProviderName, string> = {
  google: 'GOOGLE_PLACES_API_KEY',
  tripadvisor: 'TRIPADVISOR_API_KEY',
  yelp: 'YELP_API_KEY',
  opentripmap: 'OPENTRIPMAP_API_KEY',
  wikipedia: 'WIKIMEDIA_API_KEY',
  foursquare: 'FOURSQUARE_API_KEY',
  geoapify: 'GEOAPIFY_API_KEY',
  ticketmaster: 'TICKETMASTER_API_KEY'
};

export function getRecommendationProviderMode(): RecommendationProviderMode {
  const value = process.env.RECOMMENDATION_PROVIDER_MODE?.trim().toLowerCase();
  if (value === 'open' || value === 'phase1' || value === 'full' || value === 'mock') {
    return value;
  }
  return 'open';
}

export function isRecommendationProviderAllowed(provider: RecommendationProviderName) {
  const mode = getRecommendationProviderMode();

  if (mode === 'mock') {
    return false;
  }

  if (mode === 'open') {
    return provider === 'opentripmap' || provider === 'wikipedia' || provider === 'foursquare' || provider === 'geoapify' || provider === 'ticketmaster';
  }

  if (mode === 'phase1') {
    return provider === 'google' || provider === 'tripadvisor';
  }

  return true;
}

export function hasProviderKey(provider: RecommendationProviderName) {
  if (provider === 'wikipedia') {
    return true;
  }
  return Boolean(process.env[PROVIDER_KEYS[provider]]);
}

export function reportEnvSetup() {
  const mode = getRecommendationProviderMode();
  const allowedProviders = (Object.keys(PROVIDER_KEYS) as RecommendationProviderName[]).filter((provider) =>
    isRecommendationProviderAllowed(provider)
  );
  const missing = allowedProviders.filter((provider) => !hasProviderKey(provider));

  console.log(`Travel recommendation provider mode: ${mode}`);

  if (mode === 'mock') {
    console.log('Travel recommendation providers: mock-only mode enabled');
    return;
  }

  if (!missing.length) {
    console.log(`Travel recommendation providers: ${allowedProviders.join(', ')} configured`);
    return;
  }

  console.warn(
    `Travel recommendation providers missing keys: ${missing.join(', ')}. ` +
    'The API will still run, but it may fall back to mock recommendations or partial provider coverage.'
  );
}
