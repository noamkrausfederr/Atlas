import { describe, it, expect } from 'vitest';
import { dedupePlaces, wikipediaLooksLikeHistoricalEvent } from './providers.js';
import { filterPlacesByRequestedCategories, rankPlaces } from './recommendationService.js';
import type { NormalizedPlace, RecommendationRequest } from './types.js';

function makePlace(overrides: Partial<NormalizedPlace> & { canonicalId: string; name: string }): NormalizedPlace {
  return {
    destination: 'Lisbon, Portugal',
    category: 'restaurant',
    tags: [],
    sourceAttributions: [{ provider: 'mock', providerId: overrides.canonicalId }],
    ...overrides
  };
}

// ─── dedupePlaces ────────────────────────────────────────────────────────────

describe('dedupePlaces', () => {
  it('keeps distinct places unchanged', () => {
    const places = [
      makePlace({ canonicalId: 'a', name: 'Place A', address: '1 Main St' }),
      makePlace({ canonicalId: 'b', name: 'Place B', address: '2 Other St' })
    ];
    expect(dedupePlaces(places)).toHaveLength(2);
  });

  it('merges exact name+address duplicates into one entry', () => {
    const places = [
      makePlace({ canonicalId: 'g-1', name: 'Time Out Market', address: 'Av. 24 de Julho 49' }),
      makePlace({ canonicalId: 'ta-1', name: 'Time Out Market', address: 'Av. 24 de Julho 49' })
    ];
    const result = dedupePlaces(places);
    expect(result).toHaveLength(1);
    expect(result[0].sourceAttributions).toHaveLength(2);
  });

  it('merges near-equivalent names with matching coordinates', () => {
    const places = [
      makePlace({ canonicalId: 'g-2', name: 'Musée d\'Orsay', lat: 48.86, lng: 2.326 }),
      makePlace({ canonicalId: 'ta-2', name: 'Musee d Orsay', lat: 48.8601, lng: 2.3261 })
    ];
    const result = dedupePlaces(places);
    expect(result).toHaveLength(1);
  });

  it('keeps same-named places in different cities as separate entries', () => {
    const places = [
      makePlace({ canonicalId: 'a-1', name: 'Grand Hotel', destination: 'Paris, France', address: '1 Rue de Rivoli', lat: 48.86, lng: 2.326 }),
      makePlace({ canonicalId: 'a-2', name: 'Grand Hotel', destination: 'London, UK', address: '1 Park Lane', lat: 51.5, lng: -0.1 })
    ];
    expect(dedupePlaces(places)).toHaveLength(2);
  });

  it('takes the highest rating when merging', () => {
    const places = [
      makePlace({ canonicalId: 'g-3', name: 'Cafe X', address: '5 Rua A', rating: 4.2 }),
      makePlace({ canonicalId: 'f-3', name: 'Cafe X', address: '5 Rua A', rating: 4.7 })
    ];
    const result = dedupePlaces(places);
    expect(result[0].rating).toBe(4.7);
  });

  it('accumulates source attributions from all merged providers', () => {
    const places = [
      makePlace({ canonicalId: 'g-4', name: 'Park X', address: '10 Elm St', sourceAttributions: [{ provider: 'google', providerId: 'g-4' }] }),
      makePlace({ canonicalId: 'ta-4', name: 'Park X', address: '10 Elm St', sourceAttributions: [{ provider: 'tripadvisor', providerId: 'ta-4' }] })
    ];
    const result = dedupePlaces(places);
    const providers = result[0].sourceAttributions.map((s) => s.provider);
    expect(providers).toContain('google');
    expect(providers).toContain('tripadvisor');
  });
});

// ─── rankPlaces ──────────────────────────────────────────────────────────────

function baseRequest(overrides?: Partial<RecommendationRequest>): RecommendationRequest {
  return {
    destination: 'Lisbon, Portugal',
    vibeTags: [],
    categories: [],
    excludeCanonicalIds: [],
    ...overrides
  };
}

describe('rankPlaces', () => {
  it('returns the same number of places', () => {
    const places = [
      makePlace({ canonicalId: 'a', name: 'A', rating: 4.5, reviewCount: 100 }),
      makePlace({ canonicalId: 'b', name: 'B', rating: 3.8, reviewCount: 50 })
    ];
    expect(rankPlaces(places, baseRequest())).toHaveLength(2);
  });

  it('ranks higher-rated places first', () => {
    const places = [
      makePlace({ canonicalId: 'low', name: 'Low', rating: 3.5, reviewCount: 100 }),
      makePlace({ canonicalId: 'high', name: 'High', rating: 4.8, reviewCount: 100 })
    ];
    const ranked = rankPlaces(places, baseRequest());
    expect(ranked[0].canonicalId).toBe('high');
  });

  it('boosts places whose category matches the request', () => {
    const places = [
      makePlace({ canonicalId: 'museum', name: 'Museum', category: 'museum', rating: 4.0 }),
      makePlace({ canonicalId: 'restaurant', name: 'Restaurant', category: 'restaurant', rating: 4.0 })
    ];
    const ranked = rankPlaces(places, baseRequest({ categories: ['museum'] }));
    expect(ranked[0].canonicalId).toBe('museum');
  });

  it('boosts budget places when budget=budget', () => {
    const places = [
      makePlace({ canonicalId: 'cheap', name: 'Cheap', rating: 4.0, priceLevel: 1 }),
      makePlace({ canonicalId: 'pricey', name: 'Pricey', rating: 4.0, priceLevel: 4 })
    ];
    const ranked = rankPlaces(places, baseRequest({ budget: 'budget' }));
    expect(ranked[0].canonicalId).toBe('cheap');
  });

  it('boosts places matching vibe tags', () => {
    const places = [
      makePlace({ canonicalId: 'tagged', name: 'Tagged', rating: 4.0, tags: ['walkable', 'design'] }),
      makePlace({ canonicalId: 'plain', name: 'Plain', rating: 4.0, tags: [] })
    ];
    const ranked = rankPlaces(places, baseRequest({ vibeTags: ['walkable'] }));
    expect(ranked[0].canonicalId).toBe('tagged');
  });

  it('attaches a score and reason to every result', () => {
    const places = [makePlace({ canonicalId: 'x', name: 'X', rating: 4.2, reviewCount: 300 })];
    const [result] = rankPlaces(places, baseRequest());
    expect(typeof result.score).toBe('number');
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

describe('filterPlacesByRequestedCategories', () => {
  it('keeps only exact category matches for single-category requests', () => {
    const places = [
      makePlace({ canonicalId: 'cafe', name: 'Cafe', category: 'cafe' }),
      makePlace({ canonicalId: 'restaurant', name: 'Restaurant', category: 'restaurant' })
    ];

    const filtered = filterPlacesByRequestedCategories(places, ['cafe']);

    expect(filtered.map((place) => place.canonicalId)).toEqual(['cafe']);
  });

  it('does not blend attraction and experience categories', () => {
    const places = [
      makePlace({ canonicalId: 'attraction', name: 'Attraction', category: 'attraction' }),
      makePlace({ canonicalId: 'experience', name: 'Experience', category: 'experience' })
    ];

    expect(filterPlacesByRequestedCategories(places, ['attraction']).map((place) => place.canonicalId)).toEqual(['attraction']);
    expect(filterPlacesByRequestedCategories(places, ['experience']).map((place) => place.canonicalId)).toEqual(['experience']);
  });

  it('keeps all requested categories for multi-category searches', () => {
    const places = [
      makePlace({ canonicalId: 'cafe', name: 'Cafe', category: 'cafe' }),
      makePlace({ canonicalId: 'museum', name: 'Museum', category: 'museum' }),
      makePlace({ canonicalId: 'park', name: 'Park', category: 'park' })
    ];

    const filtered = filterPlacesByRequestedCategories(places, ['cafe', 'museum']);

    expect(filtered.map((place) => place.canonicalId)).toEqual(['cafe', 'museum']);
  });
});

describe('wikipediaLooksLikeHistoricalEvent', () => {
  it('blocks historical event pages', () => {
    expect(
      wikipediaLooksLikeHistoricalEvent({
        title: 'November 2015 Paris attacks',
        description: 'terrorist attacks in Paris',
        categories: ['Terrorist incidents in Paris', 'Massacres in France']
      })
    ).toBe(true);
  });

  it('allows real landmark pages', () => {
    expect(
      wikipediaLooksLikeHistoricalEvent({
        title: 'Eiffel Tower',
        description: 'wrought-iron lattice tower on the Champ de Mars in Paris, France',
        categories: ['Towers in Paris', 'Monuments and memorials in Paris']
      })
    ).toBe(false);
  });
});
