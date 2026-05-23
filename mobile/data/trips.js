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
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=800&q=80',
    description: 'A public Cape Town route with coastline, mountain views, and a relaxed wine-country day.',
    startDate: capeTownPublicDates.startDate,
    endDate: capeTownPublicDates.endDate,
    placesList: [
      { id: 'pub-cap-1', name: 'Table Mountain', note: 'Weather-dependent morning' },
      { id: 'pub-cap-2', name: 'Boulders Beach', note: 'Coastal afternoon' },
      { id: 'pub-cap-3', name: 'Stellenbosch day trip', note: 'Wine route' }
    ]
  }
];
