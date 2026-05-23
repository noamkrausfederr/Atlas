function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultTripDates(days) {
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(days - 1, 0));
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

const veniceDates = defaultTripDates(4);
const sfDates = defaultTripDates(3);
const kyotoDates = defaultTripDates(5);

function pastTripDates(daysSinceEnd, durationDays) {
  const end = startOfToday();
  end.setDate(end.getDate() - daysSinceEnd);
  const start = new Date(end);
  start.setDate(start.getDate() - Math.max(durationDays - 1, 0));
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

const parisPastDates = pastTripDates(45, 4);

function publicTripDates(daysFromNow, durationDays) {
  const start = startOfToday();
  start.setDate(start.getDate() + daysFromNow);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(durationDays - 1, 0));
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export const sampleBoards = [
  {
    id: 'board-1',
    title: 'Venice Streets',
    subtitle: 'City canals & cozy cafes',
    location: 'Venice, Italy',
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80',
    description: 'Wander the winding waterways of Venice with a curated list of cafés, bridges, and sunset photo spots.',
    places: 12,
    days: 4,
    startDate: veniceDates.startDate,
    endDate: veniceDates.endDate,
    placesList: [
      { id: 'v1', name: 'Rialto Market', note: 'Morning produce & cicchetti' },
      { id: 'v2', name: 'Dorsoduro sunset walk', note: 'Golden hour along the canal' }
    ]
  },
  {
    id: 'board-2',
    title: 'Golden Gate',
    subtitle: 'Sunset viewpoint',
    location: 'San Francisco, United States',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
    description: 'Plan a dreamy San Francisco escape with city walks, coastal viewpoints, and pastel-hued dinner plans.',
    places: 9,
    days: 3,
    startDate: sfDates.startDate,
    endDate: sfDates.endDate,
    placesList: [
      { id: 's1', name: 'Lands End Trail', note: 'Coastal hike with bridge views' },
      { id: 's2', name: 'Ferry Building', note: 'Local food hall stop' }
    ]
  },
  {
    id: 'board-3',
    title: 'Kyoto Morning',
    subtitle: 'Tea houses & cherry paths',
    location: 'Kyoto, Japan',
    image: 'https://images.unsplash.com/photo-1445820136801-051b6a111f34?auto=format&fit=crop&w=800&q=80',
    description: 'Save the best spots for tranquil mornings among temples, markets, and cherry blossom alleys.',
    places: 14,
    days: 5,
    startDate: kyotoDates.startDate,
    endDate: kyotoDates.endDate,
    placesList: [
      { id: 'k1', name: 'Fushimi Inari', note: 'Go before 8am' },
      { id: 'k2', name: 'Nishiki Market', note: 'Street snacks & tea' }
    ]
  },
  {
    id: 'board-past-1',
    title: 'Paris Weekend',
    subtitle: 'Bistros & museum nights',
    location: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    description: 'A completed long weekend of art, pastries, and evening walks along the Seine.',
    places: 6,
    days: 4,
    startDate: parisPastDates.startDate,
    endDate: parisPastDates.endDate,
    placesList: [
      { id: 'p1', name: 'Louvre evening walk', note: 'Completed · night entry' },
      { id: 'p2', name: 'Montmartre cafe crawl', note: 'Completed · Sunday morning' }
    ]
  }
];

const londonPublicDates = publicTripDates(18, 5);
const lisbonPublicDates = publicTripDates(32, 4);
const seoulPublicDates = publicTripDates(55, 6);
const mexicoCityPublicDates = publicTripDates(70, 5);
const capeTownPublicDates = publicTripDates(96, 7);
const tokyoPublicDates = publicTripDates(22, 6);
const parisPublicDates = publicTripDates(40, 4);
const baliPublicDates = publicTripDates(63, 8);
const newYorkPublicDates = publicTripDates(80, 5);
const marrakechPublicDates = publicTripDates(88, 5);
const copenhagenPublicDates = publicTripDates(110, 4);
const buenosAiresPublicDates = publicTripDates(126, 7);
const reykjavikPublicDates = publicTripDates(142, 6);

export const publicTrips = [
  {
    id: 'public-london-1',
    ownerName: 'Maya R.',
    title: 'London Long Weekend',
    subtitle: 'Markets, museums & late dinners',
    location: 'London, United Kingdom',
    country: 'United Kingdom',
    continent: 'Europe',
    people: 2,
    days: 5,
    pace: 'Balanced',
    travelerType: 'Couple',
    accessibility: 'Transit friendly',
    transportation: 'Public transit',
    budget: 'Mid-range',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    description: 'A public London plan with neighborhood markets, compact culture stops, and easy evening options.',
    startDate: londonPublicDates.startDate,
    endDate: londonPublicDates.endDate,
    placesList: [
      { id: 'pub-lon-1', name: 'Borough Market', note: 'Lunch and snacks' },
      { id: 'pub-lon-2', name: 'Tate Modern', note: 'Afternoon museum stop' },
      { id: 'pub-lon-3', name: 'Soho dinner walk', note: 'Evening food route' }
    ]
  },
  {
    id: 'public-lisbon-1',
    ownerName: 'Nina K.',
    title: 'Lisbon Hills',
    subtitle: 'Tile streets & seafood nights',
    location: 'Lisbon, Portugal',
    country: 'Portugal',
    continent: 'Europe',
    people: 4,
    days: 4,
    pace: 'Chill',
    travelerType: 'Friends',
    accessibility: 'Low walking',
    transportation: 'Walkable',
    budget: 'Budget',
    image: 'https://images.unsplash.com/photo-1501927023255-9063be98970c?auto=format&fit=crop&w=800&q=80',
    description: 'A public Lisbon route with viewpoints, coastal food, and slow old-town wandering.',
    startDate: lisbonPublicDates.startDate,
    endDate: lisbonPublicDates.endDate,
    placesList: [
      { id: 'pub-lis-1', name: 'Miradouro da Senhora do Monte', note: 'Sunset view' },
      { id: 'pub-lis-2', name: 'Time Out Market', note: 'Group-friendly dinner' }
    ]
  },
  {
    id: 'public-seoul-1',
    ownerName: 'Daniel C.',
    title: 'Seoul Food & Design',
    subtitle: 'Cafes, palaces & night markets',
    location: 'Seoul, South Korea',
    country: 'South Korea',
    continent: 'Asia',
    people: 3,
    days: 6,
    pace: 'Packed',
    travelerType: 'Friends',
    accessibility: 'Transit friendly',
    transportation: 'Public transit',
    budget: 'Mid-range',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    description: 'A public Seoul itinerary built around cafe neighborhoods, cultural anchors, and late-night food.',
    startDate: seoulPublicDates.startDate,
    endDate: seoulPublicDates.endDate,
    placesList: [
      { id: 'pub-seo-1', name: 'Gyeongbokgung Palace', note: 'Morning culture stop' },
      { id: 'pub-seo-2', name: 'Seongsu cafe route', note: 'Design cafes' },
      { id: 'pub-seo-3', name: 'Gwangjang Market', note: 'Night food' }
    ]
  },
  {
    id: 'public-mexico-1',
    ownerName: 'Ana P.',
    title: 'Mexico City Arts',
    subtitle: 'Museums, parks & taco nights',
    location: 'Mexico City, Mexico',
    country: 'Mexico',
    continent: 'North America',
    people: 2,
    days: 5,
    pace: 'Balanced',
    travelerType: 'Couple',
    accessibility: 'Low walking',
    transportation: 'Rideshare',
    budget: 'Budget',
    image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
    description: 'A public Mexico City plan for art, green spaces, markets, and easy dinner clusters.',
    startDate: mexicoCityPublicDates.startDate,
    endDate: mexicoCityPublicDates.endDate,
    placesList: [
      { id: 'pub-mex-1', name: 'Museo Frida Kahlo', note: 'Book ahead' },
      { id: 'pub-mex-2', name: 'Roma Norte dinner loop', note: 'Restaurants and bars' }
    ]
  },
  {
    id: 'public-cape-1',
    ownerName: 'Leo S.',
    title: 'Cape Town Coast',
    subtitle: 'Beaches, hikes & wine day',
    location: 'Cape Town, South Africa',
    country: 'South Africa',
    continent: 'Africa',
    people: 5,
    days: 7,
    pace: 'Adventure',
    travelerType: 'Family',
    accessibility: 'Car needed',
    transportation: 'Rental car',
    budget: 'Luxury',
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=800&q=80',
    description: 'A public Cape Town route with coastline, mountain views, and a relaxed wine-country day.',
    startDate: capeTownPublicDates.startDate,
    endDate: capeTownPublicDates.endDate,
    placesList: [
      { id: 'pub-cap-1', name: 'Table Mountain', note: 'Weather-dependent morning' },
      { id: 'pub-cap-2', name: 'Boulders Beach', note: 'Coastal afternoon' },
      { id: 'pub-cap-3', name: 'Stellenbosch day trip', note: 'Wine route' }
    ]
  },
  {
    id: 'public-tokyo-1',
    ownerName: 'Iris M.',
    title: 'Tokyo Soft Launch',
    subtitle: 'Bookshops, ramen & neon lanes',
    location: 'Tokyo, Japan',
    country: 'Japan',
    continent: 'Asia',
    people: 2,
    days: 6,
    pace: 'Packed',
    travelerType: 'Couple',
    accessibility: 'Transit friendly',
    transportation: 'Public transit',
    budget: 'Mid-range',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
    description: 'A Tokyo public trip for tiny bars, design stores, gardens, and a few perfect bowls of ramen.',
    startDate: tokyoPublicDates.startDate,
    endDate: tokyoPublicDates.endDate,
    placesList: [
      { id: 'pub-tok-1', name: 'Daikanyama T-Site', note: 'Morning bookshop' },
      { id: 'pub-tok-2', name: 'Shinjuku Golden Gai', note: 'Late night lanes' },
      { id: 'pub-tok-3', name: 'Kiyosumi Garden', note: 'Quiet reset' }
    ]
  },
  {
    id: 'public-paris-1',
    ownerName: 'Camille D.',
    title: 'Paris Left Bank',
    subtitle: 'Galleries, gardens & wine bars',
    location: 'Paris, France',
    country: 'France',
    continent: 'Europe',
    people: 2,
    days: 4,
    pace: 'Chill',
    travelerType: 'Couple',
    accessibility: 'Low walking',
    transportation: 'Walkable',
    budget: 'Luxury',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    description: 'A romantic Paris route with small galleries, classic gardens, and easy wine bar evenings.',
    startDate: parisPublicDates.startDate,
    endDate: parisPublicDates.endDate,
    placesList: [
      { id: 'pub-par-1', name: 'Luxembourg Gardens', note: 'Late morning stroll' },
      { id: 'pub-par-2', name: 'Saint-Germain gallery loop', note: 'Afternoon' },
      { id: 'pub-par-3', name: 'Canal Saint-Martin dinner', note: 'Relaxed night' }
    ]
  },
  {
    id: 'public-bali-1',
    ownerName: 'Talia S.',
    title: 'Bali Slow Days',
    subtitle: 'Rice fields, beaches & cafes',
    location: 'Ubud, Indonesia',
    country: 'Indonesia',
    continent: 'Asia',
    people: 1,
    days: 8,
    pace: 'Chill',
    travelerType: 'Solo',
    accessibility: 'Car needed',
    transportation: 'Rideshare',
    budget: 'Budget',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    description: 'A peaceful Bali plan with rice terraces, beach sunsets, cafes, and spa breaks.',
    startDate: baliPublicDates.startDate,
    endDate: baliPublicDates.endDate,
    placesList: [
      { id: 'pub-bal-1', name: 'Tegallalang Rice Terrace', note: 'Morning light' },
      { id: 'pub-bal-2', name: 'Uluwatu sunset', note: 'Cliff views' },
      { id: 'pub-bal-3', name: 'Ubud cafe morning', note: 'Slow start' }
    ]
  },
  {
    id: 'public-nyc-1',
    ownerName: 'Jonah L.',
    title: 'New York Gallery Sprint',
    subtitle: 'Museums, slices & skyline walks',
    location: 'New York, United States',
    country: 'United States',
    continent: 'North America',
    people: 3,
    days: 5,
    pace: 'Packed',
    travelerType: 'Friends',
    accessibility: 'Transit friendly',
    transportation: 'Public transit',
    budget: 'Mid-range',
    image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=800&q=80',
    description: 'A fast New York plan for galleries, classic food stops, parks, and skyline moments.',
    startDate: newYorkPublicDates.startDate,
    endDate: newYorkPublicDates.endDate,
    placesList: [
      { id: 'pub-nyc-1', name: 'Chelsea galleries', note: 'Afternoon route' },
      { id: 'pub-nyc-2', name: 'High Line walk', note: 'Golden hour' },
      { id: 'pub-nyc-3', name: 'Lower East Side dinner', note: 'Group night' }
    ]
  },
  {
    id: 'public-marrakech-1',
    ownerName: 'Rania B.',
    title: 'Marrakech Color Run',
    subtitle: 'Riads, souks & rooftop tea',
    location: 'Marrakech, Morocco',
    country: 'Morocco',
    continent: 'Africa',
    people: 2,
    days: 5,
    pace: 'Balanced',
    travelerType: 'Couple',
    accessibility: 'Low walking',
    transportation: 'Walkable',
    budget: 'Mid-range',
    image: 'https://images.unsplash.com/photo-1597212720412-c31f355c2335?auto=format&fit=crop&w=800&q=80',
    description: 'A warm Marrakech itinerary with design riads, souk wandering, gardens, and rooftop sunsets.',
    startDate: marrakechPublicDates.startDate,
    endDate: marrakechPublicDates.endDate,
    placesList: [
      { id: 'pub-mar-1', name: 'Jardin Majorelle', note: 'Morning color' },
      { id: 'pub-mar-2', name: 'Medina souks', note: 'Guided loop' },
      { id: 'pub-mar-3', name: 'Rooftop tea', note: 'Sunset' }
    ]
  },
  {
    id: 'public-copenhagen-1',
    ownerName: 'Freja N.',
    title: 'Copenhagen Design Notes',
    subtitle: 'Harbor swims, bakeries & chairs',
    location: 'Copenhagen, Denmark',
    country: 'Denmark',
    continent: 'Europe',
    people: 1,
    days: 4,
    pace: 'Balanced',
    travelerType: 'Solo',
    accessibility: 'Transit friendly',
    transportation: 'Walkable',
    budget: 'Luxury',
    image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&q=80',
    description: 'A Copenhagen plan for design shops, bakeries, harbor swims, and gentle cycling routes.',
    startDate: copenhagenPublicDates.startDate,
    endDate: copenhagenPublicDates.endDate,
    placesList: [
      { id: 'pub-cph-1', name: 'Designmuseum Denmark', note: 'Morning' },
      { id: 'pub-cph-2', name: 'Juno bakery', note: 'Cardamom buns' },
      { id: 'pub-cph-3', name: 'Islands Brygge', note: 'Harbor swim' }
    ]
  },
  {
    id: 'public-buenos-aires-1',
    ownerName: 'Mateo G.',
    title: 'Buenos Aires After Dark',
    subtitle: 'Bookstores, steak & tango',
    location: 'Buenos Aires, Argentina',
    country: 'Argentina',
    continent: 'South America',
    people: 4,
    days: 7,
    pace: 'Balanced',
    travelerType: 'Friends',
    accessibility: 'Transit friendly',
    transportation: 'Rideshare',
    budget: 'Budget',
    image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=800&q=80',
    description: 'A Buenos Aires trip with late dinners, bookstores, cafes, markets, and a tango night.',
    startDate: buenosAiresPublicDates.startDate,
    endDate: buenosAiresPublicDates.endDate,
    placesList: [
      { id: 'pub-ba-1', name: 'El Ateneo Grand Splendid', note: 'Bookstore stop' },
      { id: 'pub-ba-2', name: 'San Telmo Market', note: 'Sunday route' },
      { id: 'pub-ba-3', name: 'Palermo dinner', note: 'Late night' }
    ]
  },
  {
    id: 'public-reykjavik-1',
    ownerName: 'Elin H.',
    title: 'Iceland Ring Lite',
    subtitle: 'Waterfalls, lagoons & black sand',
    location: 'Reykjavik, Iceland',
    country: 'Iceland',
    continent: 'Europe',
    people: 2,
    days: 6,
    pace: 'Adventure',
    travelerType: 'Couple',
    accessibility: 'Car needed',
    transportation: 'Rental car',
    budget: 'Luxury',
    image: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=800&q=80',
    description: 'A compact Iceland route for hot springs, waterfalls, black sand beaches, and dramatic drives.',
    startDate: reykjavikPublicDates.startDate,
    endDate: reykjavikPublicDates.endDate,
    placesList: [
      { id: 'pub-ice-1', name: 'Blue Lagoon', note: 'Arrival soak' },
      { id: 'pub-ice-2', name: 'Seljalandsfoss', note: 'Waterfall stop' },
      { id: 'pub-ice-3', name: 'Reynisfjara Beach', note: 'Black sand' }
    ]
  }
];
