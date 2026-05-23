const DESTINATION_META = {
  venice: {
    city: 'Venice, Italy',
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80'
  },
  francisco: {
    city: 'San Francisco, USA',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80'
  },
  kyoto: {
    city: 'Kyoto, Japan',
    image: 'https://images.unsplash.com/photo-1445820136801-051b6a111f34?auto=format&fit=crop&w=800&q=80'
  },
  paris: {
    city: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'
  },
  default: {
    city: 'Your destination',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
  }
};

const ACTIVITY_CATALOG = {
  venice: [
    { slug: 'burano', title: 'Burano half-day escape', category: 'Day trip', price: '€28', address: 'Fondamenta di Terranova, 30142 Burano VE', description: 'Colorful island lanes, lace shops, and a slow seafood lunch away from the crowds.', reviews: [{ author: 'Elena M.', stars: 5, text: 'Perfect half-day break from central Venice.' }, { author: 'James R.', stars: 4, text: 'Beautiful photos and easy vaporetto ride.' }] },
    { slug: 'cicchetti', title: 'Cicchetti crawl near Rialto', category: 'Food', price: '€35', address: 'Campo Bella Vienna, 30125 Venezia VE', description: 'Hop between bacari for small plates and spritz between sightseeing blocks.', reviews: [{ author: 'Sofia L.', stars: 5, text: 'Affordable and fun — we tried five spots.' }, { author: 'Noah P.', stars: 5, text: 'Locals recommended bars we would have missed.' }] },
    { slug: 'accademia-bridge', title: 'Accademia Bridge at blue hour', category: 'Photo', price: 'Free', address: 'Ponte dell\'Accademia, 30123 Venezia VE', description: 'Classic Grand Canal views as the lights come on over Dorsoduro.', reviews: [{ author: 'Mia T.', stars: 5, text: 'Worth timing around sunset.' }, { author: 'Alex K.', stars: 4, text: 'Crowded but stunning.' }] },
    { slug: 'st-marks', title: 'St. Mark\'s Basilica early entry', category: 'Culture', price: '€18', address: 'Piazza San Marco, 30124 Venezia VE', description: 'Beat the lines with a morning slot and gold-mosaic interiors.', reviews: [{ author: 'Hannah W.', stars: 5, text: 'Go right at opening — peaceful inside.' }] },
    { slug: 'gondola-trident', title: 'Quiet canal gondola route', category: 'Experience', price: '€85', address: 'Campo San Polo, 30125 Venezia VE', description: 'Less touristy canals with a shorter, calmer ride.', reviews: [{ author: 'Chris D.', stars: 4, text: 'Pricey but memorable at golden hour.' }] },
    { slug: 'libreria', title: 'Libreria Acqua Alta', category: 'Hidden gem', price: 'Free', address: 'Calle Lunga Santa Maria Formosa, 5176, 30122 Venezia VE', description: 'Bookshop famous for stacked gondolas and photo-friendly corners.', reviews: [{ author: 'Priya S.', stars: 5, text: 'Quick stop, super unique.' }] },
    { slug: 'murano', title: 'Murano glass studio visit', category: 'Day trip', price: '€22', address: 'Fondamenta Marco Giustinian, 30141 Venezia VE', description: 'Watch artisans at work and browse showroom pieces.', reviews: [{ author: 'Tom B.', stars: 4, text: 'Demo was short but fascinating.' }] },
    { slug: 'bacaro', title: 'All\'Arco bacaro lunch', category: 'Food', price: '€20', address: 'Sestiere San Polo, 436, 30125 Venezia VE', description: 'Standing-room sandwiches and wine near the Rialto.', reviews: [{ author: 'Lena F.', stars: 5, text: 'Best tramezzino we had in Italy.' }] },
    { slug: 'lido', title: 'Lido beach afternoon', category: 'Relax', price: '€12', address: 'Lido di Venezia, 30126 Venezia VE', description: 'Adriatic breeze and a break from stone streets.', reviews: [{ author: 'Omar H.', stars: 4, text: 'Simple beach day, easy ferry.' }] },
    { slug: 'peggy', title: 'Peggy Guggenheim Collection', category: 'Museum', price: '€17', address: 'Dorsoduro, 701-704, 30123 Venezia VE', description: 'Modern art on the canal with a sculpture garden.', reviews: [{ author: 'Kate J.', stars: 5, text: 'Compact museum, great curation.' }] }
  ],
  francisco: [
    { slug: 'twin-peaks', title: 'Twin Peaks sunrise', category: 'Viewpoint', price: 'Free', address: '501 Twin Peaks Blvd, San Francisco, CA 94114', description: 'Panoramic city views before the fog rolls in.', reviews: [{ author: 'Ryan C.', stars: 5, text: 'Dress warm — windy but worth it.' }] },
    { slug: 'mission', title: 'Mission District mural walk', category: 'Neighborhood', price: 'Free', address: 'Clarion Alley, San Francisco, CA 94110', description: 'Street art alleys and taquerías in a vibrant district.', reviews: [{ author: 'Amy Z.', stars: 5, text: 'Great photos every block.' }] },
    { slug: 'scomas', title: 'Scoma\'s waterfront dinner', category: 'Food', price: '$55', address: '1965 Al Scoma Way, San Francisco, CA 94133', description: 'Classic seafood on Fisherman\'s Wharf with harbor views.', reviews: [{ author: 'Mark L.', stars: 4, text: 'Cioppino was excellent.' }] },
    { slug: 'ferry', title: 'Ferry Building farmers market', category: 'Food', price: '$25', address: '1 Ferry Building, San Francisco, CA 94111', description: 'Saturday vendors, oysters, and local produce.', reviews: [{ author: 'Julia N.', stars: 5, text: 'Perfect brunch crawl.' }] },
    { slug: 'lands-end', title: 'Lands End coastal trail', category: 'Hike', price: 'Free', address: '680 Point Lobos Ave, San Francisco, CA 94121', description: 'Clifftop path with Golden Gate glimpses.', reviews: [{ author: 'Ben S.', stars: 5, text: 'Easy trail, huge payoff views.' }] },
    { slug: 'deyoung', title: 'de Young Museum', category: 'Museum', price: '$20', address: '50 Hagiwara Tea Garden Dr, San Francisco, CA 94118', description: 'Art in Golden Gate Park with an observation tower.', reviews: [{ author: 'Iris K.', stars: 4, text: 'Tower views are the highlight.' }] },
    { slug: 'cable', title: 'Powell-Hyde cable car ride', category: 'Experience', price: '$8', address: 'Powell St & Market St, San Francisco, CA 94102', description: 'Iconic hill climb toward Fisherman\'s Wharf.', reviews: [{ author: 'Dan W.', stars: 4, text: 'Touristy but fun once.' }] },
    { slug: 'baker', title: 'Baker Beach sunset', category: 'Viewpoint', price: 'Free', address: 'Baker Beach, San Francisco, CA 94129', description: 'Bridge-framed beach sunset spot.', reviews: [{ author: 'Nina P.', stars: 5, text: 'Bring a jacket and arrive early.' }] },
    { slug: 'tartine', title: 'Tartine Manufactory brunch', category: 'Food', price: '$32', address: '595 Alabama St, San Francisco, CA 94110', description: 'Pastries, toast, and coffee in a bright industrial space.', reviews: [{ author: 'Leo G.', stars: 5, text: 'Line moves fast, everything delicious.' }] },
    { slug: 'alcatraz', title: 'Alcatraz night tour', category: 'Experience', price: '$48', address: 'Pier 33, San Francisco, CA 94111', description: 'Audio tour of the island with atmospheric evening light.', reviews: [{ author: 'Emma R.', stars: 5, text: 'Book weeks ahead — sells out.' }] }
  ],
  kyoto: [
    { slug: 'philosopher', title: 'Philosopher\'s Path stroll', category: 'Walk', price: 'Free', address: 'Sakyo Ward, Kyoto, 606-8425, Japan', description: 'Canal-side walk linking temples and cherry trees.', reviews: [{ author: 'Yuki A.', stars: 5, text: 'Peaceful after busy temple mornings.' }] },
    { slug: 'gion', title: 'Gion evening tea house', category: 'Culture', price: '¥2,800', address: 'Gionmachi Minamigawa, Higashiyama Ward, Kyoto, 605-0074', description: 'Traditional tea service in Kyoto\'s geisha district.', reviews: [{ author: 'Claire M.', stars: 5, text: 'Reserve ahead — intimate experience.' }] },
    { slug: 'bamboo', title: 'Arashiyama bamboo grove', category: 'Nature', price: 'Free', address: 'Sagano, Ukyo Ward, Kyoto, 616-8385, Japan', description: 'Towering bamboo paths best visited at opening time.', reviews: [{ author: 'Ken T.', stars: 4, text: 'Crowded by 10am — go early.' }] },
    { slug: 'fushimi', title: 'Fushimi Inari sunrise hike', category: 'Temple', price: 'Free', address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto, 612-0882', description: 'Torii gate paths up the mountain before tour groups arrive.', reviews: [{ author: 'Anna B.', stars: 5, text: 'Magical at dawn.' }] },
    { slug: 'nishiki', title: 'Nishiki Market tasting walk', category: 'Food', price: '¥1,500', address: 'Nishiki Koji, Nakagyo Ward, Kyoto, 604-8035', description: 'Sample pickles, mochi, and grilled seafood stalls.', reviews: [{ author: 'David H.', stars: 5, text: 'Come hungry — so many bites.' }] },
    { slug: 'kinkaku', title: 'Kinkaku-ji golden pavilion', category: 'Temple', price: '¥500', address: '1 Kinkakujicho, Kita Ward, Kyoto, 603-8361', description: 'Iconic gold-leaf temple reflected in the pond garden.', reviews: [{ author: 'Mei L.', stars: 5, text: 'Quick visit, stunning photos.' }] },
    { slug: 'matcha', title: 'Ippodo Tea Kyoto', category: 'Cafe', price: '¥900', address: 'Teramachi Dori Nijo, Nakagyo Ward, Kyoto, 604-0915', description: 'Ceremonial-grade matcha and sweets near downtown.', reviews: [{ author: 'Paul R.', stars: 5, text: 'Staff helped us pick tea gifts.' }] },
    { slug: 'ryokan', title: 'Funaoka onsen bath', category: 'Relax', price: '¥1,100', address: 'Teranouchi Dori, Kamigyo Ward, Kyoto, 602-8136', description: 'Local public bath with cedar tubs after a long walking day.', reviews: [{ author: 'Sara K.', stars: 4, text: 'Authentic and relaxing.' }] },
    { slug: 'nimon', title: 'Nijo Castle tour', category: 'Culture', price: '¥1,300', address: '541 Nijojocho, Nakagyo Ward, Kyoto, 604-8301', description: 'Shogun residence with nightingale floors and gardens.', reviews: [{ author: 'Greg F.', stars: 4, text: 'Great history, allow 90 minutes.' }] },
    { slug: 'ramen', title: 'Ippudo Ramen Kawaramachi', category: 'Food', price: '¥1,200', address: 'Nakagyo Ward, Kyoto, 604-8006', description: 'Rich tonkotsu bowls near the shopping arcades.', reviews: [{ author: 'Lily C.', stars: 5, text: 'Fast, warm, perfect night meal.' }] }
  ],
  default: [
    { slug: 'coffee', title: 'Neighborhood coffee anchor', category: 'Cafe', price: '$8', address: 'Downtown main street', description: 'A reliable morning base before sightseeing blocks.', reviews: [{ author: 'Guest', stars: 5, text: 'Easy start to each day.' }] },
    { slug: 'sunset', title: 'Sunset viewpoint backup', category: 'Viewpoint', price: 'Free', address: 'City overlook park', description: 'Flexible golden-hour option if plans run long.', reviews: [{ author: 'Guest', stars: 4, text: 'Simple and scenic.' }] },
    { slug: 'food-hall', title: 'Local food hall lunch', category: 'Food', price: '$22', address: 'Central market hall', description: 'Low-planning meal between itinerary stops.', reviews: [{ author: 'Guest', stars: 5, text: 'Great variety for groups.' }] },
    { slug: 'museum', title: 'City history museum', category: 'Museum', price: '$15', address: 'Museum district', description: 'Context for the neighborhoods you are exploring.', reviews: [{ author: 'Guest', stars: 4, text: 'Well laid out.' }] },
    { slug: 'park', title: 'Central park stroll', category: 'Walk', price: 'Free', address: 'Main city park', description: 'Green break between denser sightseeing.', reviews: [{ author: 'Guest', stars: 5, text: 'Relaxing midday reset.' }] },
    { slug: 'market', title: 'Weekend street market', category: 'Shopping', price: '$30', address: 'Old town square', description: 'Local crafts and snacks in one wander-friendly loop.', reviews: [{ author: 'Guest', stars: 4, text: 'Fun browsing.' }] }
  ]
};

const REFRESH_CATEGORIES = [
  {
    category: 'Cafes',
    price: '$8',
    titles: ['Quiet morning cafe', 'Design-forward coffee bar', 'Bakery breakfast stop', 'Tiny espresso counter', 'Garden courtyard cafe', 'Late-afternoon pastry stop'],
    descriptions: [
      'A calm coffee stop for mapping the day before the city gets busy.',
      'A polished cafe with strong espresso, pastries, and a good pause between plans.',
      'A reliable breakfast anchor with fresh bakes and easy transit nearby.',
      'A compact espresso bar for a quick local-feeling reset.',
      'A leafy cafe pick for a slower morning or soft midday break.',
      'A sweet stop for coffee, cake, and a low-effort pause.'
    ]
  },
  {
    category: 'Restaurants',
    price: '$42',
    titles: ['Neighborhood dinner room', 'Local tasting table', 'Late lunch favorite', 'Reservation-worthy bistro', 'Casual small plates spot', 'Classic local kitchen'],
    descriptions: [
      'A relaxed restaurant pick that fits after a full sightseeing block.',
      'A local menu with enough range for a memorable but low-stress meal.',
      'A warm lunch spot for resetting before the afternoon route.',
      'A dinner choice with a little polish for a standout evening.',
      'A shareable plates option that keeps the night flexible.',
      'A traditional kitchen pick for a place-rooted meal.'
    ]
  },
  {
    category: 'Shopping',
    price: '$35',
    titles: ['Independent shops walk', 'Weekend market browse', 'Design district loop', 'Vintage finds route', 'Local makers arcade', 'Bookshops and gifts stroll'],
    descriptions: [
      'A compact shopping route for boutiques, gifts, and local makers.',
      'A market-style browse with snacks, small finds, and easy wandering.',
      'A design-focused stretch for homeware, fashion, and window shopping.',
      'A secondhand route for one-off pieces and slower browsing.',
      'A maker-focused stop for ceramics, prints, and small souvenirs.',
      'A relaxed browse for books, stationery, and easy-to-pack gifts.'
    ]
  },
  {
    category: 'Culture',
    price: '$18',
    titles: ['Small museum hour', 'Historic quarter walk', 'Gallery afternoon', 'Architecture walk', 'Local history stop', 'Performance night option'],
    descriptions: [
      'A manageable culture stop that adds context without taking over the day.',
      'A history-rich walk through streets that reward slow wandering.',
      'A compact gallery plan for a softer afternoon indoors.',
      'A route for noticing facades, courtyards, and quieter landmarks.',
      'A focused history stop that helps the city make more sense.',
      'A theater, music, or performance idea for a richer evening.'
    ]
  },
  {
    category: 'Nightlife',
    price: '$24',
    titles: ['Low-key cocktail bar', 'Live music night', 'After-dinner wine stop', 'Speakeasy-style bar', 'Rooftop evening drink', 'Late dessert lounge'],
    descriptions: [
      'A relaxed night option that works without committing the whole evening.',
      'A music-led plan for ending the day with local energy.',
      'A cozy final stop for one more glass before heading back.',
      'A moodier bar pick for a more memorable nightcap.',
      'An elevated drink spot for skyline views and easy photos.',
      'A gentle late-night option built around sweets and conversation.'
    ]
  }
];

function getSectionRefreshSeed(refreshSeeds, category) {
  if (typeof refreshSeeds === 'number') {
    return refreshSeeds;
  }
  return refreshSeeds?.[category] ?? 1;
}

function buildRefreshCatalog(board, refreshSeeds) {
  const destination = (board.location || board.subtitle || board.title || 'your destination').split(',')[0].trim();
  return REFRESH_CATEGORIES.flatMap((section) => {
    const sectionSeed = getSectionRefreshSeed(refreshSeeds, section.category);
    return Array.from({ length: 3 }, (_value, index) => {
      const variantIndex = (sectionSeed + index) % section.titles.length;
      return {
        slug: `refresh-${section.category.toLowerCase()}-${sectionSeed}-${index}`,
        title: section.titles[variantIndex],
        category: section.category,
        price: section.price,
        address: `${destination} ${section.category.toLowerCase()} area`,
        description: section.descriptions[variantIndex],
        reviews: [
          { author: 'Atlas pick', stars: 5, text: 'Fits the rhythm of this itinerary.' },
          { author: 'Recent traveler', stars: 4, text: 'Easy to pair with nearby plans.' }
        ]
      };
    });
  });
}

function tripLengthDays(board) {
  if (board.startDate && board.endDate) {
    const start = new Date(board.startDate);
    const end = new Date(board.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  }
  return board.days || 3;
}

export function formatDateRange(board) {
  if (!board.startDate || !board.endDate) {
    return `${board.days || 3} days`;
  }
  const start = new Date(board.startDate);
  const end = new Date(board.endDate);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export function detectDestinationKey(board) {
  const haystack = `${board.title} ${board.subtitle} ${board.description}`.toLowerCase();
  if (haystack.includes('venice')) return 'venice';
  if (haystack.includes('golden') || haystack.includes('francisco')) return 'francisco';
  if (haystack.includes('kyoto')) return 'kyoto';
  if (haystack.includes('paris')) return 'paris';
  return 'default';
}

function itineraryContext(board) {
  const items = board.placesList ?? [];
  if (!items.length) {
    return 'your upcoming dates';
  }
  const names = items.slice(0, 2).map((p) => p.name).join(' and ');
  return `spots like ${names}`;
}

function assignToDays(count, tripDays) {
  const labels = [];
  for (let i = 0; i < count; i += 1) {
    const day = Math.min(tripDays, Math.max(1, Math.ceil(((i + 1) / count) * tripDays)));
    labels.push(`Day ${day}`);
  }
  return labels;
}

function averageRating(reviews) {
  if (!reviews.length) return 4.8;
  const sum = reviews.reduce((total, review) => total + review.stars, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function buildRecommendation(board, item, index, tripDays, refreshSeed = 0) {
  const context = itineraryContext(board);
  const dateRange = formatDateRange(board);
  const key = detectDestinationKey(board);
  const meta = DESTINATION_META[key] ?? DESTINATION_META.default;
  const dayLabels = assignToDays(ACTIVITY_CATALOG[key]?.length ?? 6, tripDays);
  const dayLabel = dayLabels[index] ?? `Day ${Math.min(index + 1, tripDays)}`;
  const rating = averageRating(item.reviews);
  const reviewCount = item.reviews.length * 18 + 24;

  return {
    id: `${board.id}-${item.slug}`,
    slug: item.slug,
    boardId: board.id,
    title: item.title,
    category: item.category,
    dayLabel,
    reason: `${item.description.split('.')[0]}. Tailored for ${context} across ${dateRange}.`,
    description: item.description,
    address: item.address,
    price: item.price,
    rating,
    reviewCount,
    reviews: item.reviews,
    image: board.image || meta.image,
    city: meta.city
  };
}

export function generateAllRecommendations(board) {
  return generateRecommendationsForRefresh(board, 1);
}

export function generateRecommendationsForRefresh(board, refreshSeed = 1) {
  const key = detectDestinationKey(board);
  const catalog = refreshSeed ? buildRefreshCatalog(board, refreshSeed) : ACTIVITY_CATALOG[key] ?? ACTIVITY_CATALOG.default;
  const tripDays = tripLengthDays(board);
  return catalog.map((item, index) => buildRecommendation(board, item, index, tripDays, refreshSeed));
}

export function generateRecommendations(board, limit = 3) {
  return generateAllRecommendations(board).slice(0, limit);
}

export function getRecommendationById(board, recId, refreshSeed = 0) {
  return generateRecommendationsForRefresh(board, refreshSeed).find((rec) => rec.id === recId) ?? null;
}

export function getExploreSummary(boards) {
  const total = boards.reduce((sum, board) => sum + generateAllRecommendations(board).length, 0);
  return {
    boardCount: boards.length,
    recommendationCount: total
  };
}
