import type { TripBoard } from '../types';

export const sampleTripBoards: TripBoard[] = [
  {
    id: 'board-1',
    title: 'Japan 2026',
    description: 'Sakura streets, ramen alleys, and skyline temples for your next adventure.',
    cover: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=900&q=80',
    createdAt: '2025-10-18',
    places: [
      {
        id: 'place-1',
        title: 'Shibuya Sky',
        location: 'Tokyo, Japan',
        category: 'viewpoint',
        rating: 4.8,
        tags: ['cityscape', 'sunset', 'urban'],
        notes: 'Perfect for evening city panoramas and a TikTok-friendly skyline shot.',
        mediaLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        cover: 'https://images.unsplash.com/photo-1512405788832-8dbdcd58a3c0?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 'place-2',
        title: 'Kyoto Tempura Alley',
        location: 'Kyoto, Japan',
        category: 'restaurant',
        rating: 4.9,
        tags: ['food', 'chef table', 'local'],
        notes: 'Reserve ahead and capture the plating for Insta stories.',
        mediaLink: 'https://www.tiktok.com/@travelingsam/video/7141234567890123456',
        cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
      }
    ]
  },
  {
    id: 'board-2',
    title: 'Italy Food Trip',
    description: 'A curated selection of coastal cafes, wine tastings, and pasta spots.',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    createdAt: '2026-03-07',
    places: [
      {
        id: 'place-3',
        title: 'Venice Canal Cafe',
        location: 'Venice, Italy',
        category: 'cafe',
        rating: 4.7,
        tags: ['coffee', 'waterfront', 'romantic'],
        notes: 'Breakfast by the canal for a pastel-hued morning reel.',
        mediaLink: 'https://www.youtube.com/watch?v=VbfpW0pbvaU',
        cover: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 'place-4',
        title: 'Amalfi Hiking Viewpoint',
        location: 'Amalfi Coast, Italy',
        category: 'viewpoint',
        rating: 4.9,
        tags: ['hike', 'ocean', 'panorama'],
        notes: 'A must-save spot for pins and maps, with a hidden stairway approach.',
        mediaLink: 'https://www.tiktok.com/@foodieadventures/video/7123456789012345678',
        cover: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80'
      }
    ]
  }
];
