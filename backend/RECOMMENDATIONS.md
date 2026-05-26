# Real Recommendation Pipeline

This backend now exposes `POST /api/recommendations` as the shared contract for live trip recommendations.

## Current behavior

- If no live provider API keys are configured, the endpoint returns mock recommendations with the same normalized response shape.
- `RECOMMENDATION_PROVIDER_MODE=open` enables the free-first stack: Geoapify, Ticketmaster, and optional Foursquare/OpenTripMap enrichment, plus Wikipedia and Google when `GOOGLE_PLACES_API_KEY` is configured.
- `RECOMMENDATION_PROVIDER_MODE=phase1` enables only Google Places and Tripadvisor.
- `RECOMMENDATION_PROVIDER_MODE=full` enables Google Places, Tripadvisor, and Yelp.
- `RECOMMENDATION_PROVIDER_MODE=mock` disables all paid providers and always falls back to mock results.
- In `open` mode, destination geocoding falls back to Nominatim so the backend can resolve city names without Google.
- If `GEOAPIFY_API_KEY` is configured in `open` mode, Atlas uses Geoapify Places + Place Details for real nearby venues, addresses, categories, and websites.
- If `FOURSQUARE_API_KEY` is configured in `open` mode, Atlas uses Foursquare Places search plus place tips for real venues, provider pages, and short real review snippets.
- If `TICKETMASTER_API_KEY` is configured in `open` mode, Atlas uses Ticketmaster Discovery API events to add nearby concerts, shows, and other live events as `experience` recommendations.
- If `OPENTRIPMAP_API_KEY` is configured in `open` mode, OpenTripMap is used for richer place metadata, websites, images, and travel descriptions.
- In `open` mode, Wikipedia geosearch and page summaries provide real nearby place pages with source URLs, even if no API keys are configured.
- If `GOOGLE_PLACES_API_KEY` is configured, Google autocomplete is used for accommodation search and Google Places nearby results can contribute to recommendation ranking.
- If `TRIPADVISOR_API_KEY` is configured and phase 1 or full mode is enabled, Tripadvisor location search is used and then enriched with location details and a first photo.
- If `YELP_API_KEY` is configured and full mode is enabled, Yelp business search is used for live restaurant, cafe, bar, shopping, hotel, and local place recommendations.
- Provider results are normalized and deduplicated into one internal place model before ranking.

## Request shape

```json
{
  "destination": "Lisbon, Portugal",
  "latitude": 38.7223,
  "longitude": -9.1393,
  "radiusMeters": 2500,
  "tripDays": 3,
  "budget": "mid-range",
  "vibeTags": ["food", "design", "walkable"],
  "categories": ["restaurant", "cafe", "attraction"],
  "limit": 8
}
```

## Local setup

- Put your provider secrets in [backend/.env](/Users/noam/Desktop/travel/backend/.env:1).
- Keep `RECOMMENDATION_PROVIDER_MODE=open` if you want the free-first stack we just switched to.
- `GEOAPIFY_API_KEY` is optional in open mode. Add it if you want a strong free source for real place coverage without turning on paid providers.
- `FOURSQUARE_API_KEY` is optional in open mode. Add it if you want extra real venue coverage and short social-tip text.
- `TICKETMASTER_API_KEY` is optional in open mode. Add it if you want concerts, shows, and other ticketed events mixed into recommendations.
- `OPENTRIPMAP_API_KEY` is optional in open mode. Leave it blank and Atlas will still use Geoapify/Foursquare when configured, otherwise Wikipedia + Nominatim.
- Switch to `RECOMMENDATION_PROVIDER_MODE=phase1` later when you want a Google + Tripadvisor-heavy stack.
- Switch to `RECOMMENDATION_PROVIDER_MODE=mock` if you want zero chance of provider billing while you keep building the UI.
- Leave `YELP_API_KEY` blank unless you intentionally want the paid `full` stack later.
- If you want to override the mobile app's API target, set `EXPO_PUBLIC_API_BASE_URL` in [mobile/.env](/Users/noam/Desktop/travel/mobile/.env:1).
- In development, the app now tries the local backend first and falls back to `EXPO_PUBLIC_API_BASE_URL` if local is unavailable.
- Local fallback order includes:
  - `http://localhost:5005/api` on iOS/web
  - `http://10.0.2.2:5005/api` on Android emulator

## Response shape

```json
{
  "destination": "Lisbon, Portugal",
  "providersUsed": ["google"],
  "usedMockData": false,
  "recommendations": [
    {
      "canonicalId": "google-123",
      "name": "Example Place",
      "category": "restaurant",
      "rating": 4.6,
      "reviewCount": 821,
      "score": 113.4,
      "reason": "Why this place fits the trip..."
    }
  ]
}
```

## Source strategy

The intended production flow is:

1. Fetch from Geoapify, Ticketmaster, Foursquare free-tier, Wikipedia, and optional OpenTripMap in open mode, then switch to paid providers later if you want broader volume or different review ecosystems.
2. Normalize into one internal place model.
3. Deduplicate the same place across providers.
4. Rank results with product logic.
5. Feed the ranked shortlist into an LLM for itinerary explanations or day-by-day trip composition.

## Next implementation steps

1. Add a destination guide layer from Wikivoyage for broader insider tips.
2. Add a usage dashboard or kill switch if you decide to test with live keys later.
3. Add an LLM itinerary composer on top of the ranked shortlist.
