import { NormalizedPlace, TravelCategory } from './types.js';

type DestinationSeed = {
  name: string;
  category: TravelCategory;
  description: string;
  tags: string[];
  priceLevel?: number;
  rating: number;
  reviewCount: number;
  address: string;
  imageUrl: string;
};

const MOCK_DESTINATION_SEEDS: Record<string, DestinationSeed[]> = {
  lisbon: [
    {
      name: 'Dear Breakfast Chiado',
      category: 'cafe',
      description: 'Bright brunch spot that works well as a soft start before city walking.',
      tags: ['brunch', 'design', 'morning'],
      priceLevel: 2,
      rating: 4.6,
      reviewCount: 812,
      address: 'Rua das Gaivotas 17, Lisbon',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Time Out Market Lisbon',
      category: 'restaurant',
      description: 'High-variety food hall that is easy to weave into a first-day plan.',
      tags: ['food hall', 'group-friendly', 'local favorites'],
      priceLevel: 2,
      rating: 4.5,
      reviewCount: 6400,
      address: 'Av. 24 de Julho 49, Lisbon',
      imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Miradouro de Santa Luzia',
      category: 'attraction',
      description: 'Classic tiled viewpoint for a golden-hour pause above Alfama.',
      tags: ['viewpoint', 'sunset', 'photo'],
      rating: 4.7,
      reviewCount: 2900,
      address: 'Largo de Santa Luzia, Lisbon',
      imageUrl: 'https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Museu Nacional do Azulejo',
      category: 'museum',
      description: 'A strong culture stop if the traveler wants Lisbon texture beyond the postcard hits.',
      tags: ['culture', 'tiles', 'indoors'],
      priceLevel: 1,
      rating: 4.6,
      reviewCount: 1700,
      address: 'Rua da Madre de Deus 4, Lisbon',
      imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=80'
    }
  ],
  london: [
    {
      name: 'Borough Market',
      category: 'restaurant',
      description: 'An easy anchor for food-first travelers who like grazing instead of formal meals.',
      tags: ['food', 'market', 'casual'],
      priceLevel: 2,
      rating: 4.7,
      reviewCount: 7100,
      address: '8 Southwark St, London',
      imageUrl: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Daunt Books Marylebone',
      category: 'shopping',
      description: 'A warm stop for travelers who like aesthetic city wandering and slower browsing.',
      tags: ['bookshop', 'design', 'wander'],
      priceLevel: 2,
      rating: 4.8,
      reviewCount: 1600,
      address: '83 Marylebone High St, London',
      imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Barbican Conservatory',
      category: 'attraction',
      description: 'A calmer, more distinctive pick that helps a city itinerary feel less generic.',
      tags: ['hidden gem', 'plants', 'architecture'],
      rating: 4.7,
      reviewCount: 910,
      address: 'Silk St, London',
      imageUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80'
    }
  ]
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function buildMockPlaces(destination: string, categories: TravelCategory[]): NormalizedPlace[] {
  const destinationKey = Object.keys(MOCK_DESTINATION_SEEDS).find((key) =>
    destination.toLowerCase().includes(key)
  );
  const seed = destinationKey ? MOCK_DESTINATION_SEEDS[destinationKey] : [];

  const selectedSeed = seed.filter((item) => !categories.length || categories.includes(item.category));

  if (selectedSeed.length > 0) {
    return selectedSeed.map((item) => ({
      canonicalId: `mock-${slugify(destination)}-${slugify(item.name)}`,
      name: item.name,
      destination,
      address: item.address,
      category: item.category,
      description: item.description,
      priceLevel: item.priceLevel,
      rating: item.rating,
      reviewCount: item.reviewCount,
      imageUrl: item.imageUrl,
      sourceAttributions: [
        {
          provider: 'mock',
          providerId: slugify(item.name)
        }
      ],
      tags: item.tags
    }));
  }

  const fallbackCategories: TravelCategory[] = categories.length ? categories : ['cafe', 'restaurant', 'attraction'];
  return fallbackCategories.slice(0, 4).map((category, index) => ({
    canonicalId: `mock-${slugify(destination)}-${category}-${index}`,
    name: `${destination} ${category} pick ${index + 1}`,
    destination,
    address: `${destination} center`,
    category,
    description: `A placeholder ${category} recommendation for ${destination} until live providers are connected.`,
    priceLevel: category === 'attraction' ? 1 : 2,
    rating: 4.5,
    reviewCount: 120 + index * 45,
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
    sourceAttributions: [
      {
        provider: 'mock',
        providerId: `${category}-${index}`
      }
    ],
    tags: [category, 'placeholder']
  }));
}
