export type PlaceCategory = 'restaurant' | 'cafe' | 'viewpoint' | 'beach' | 'activity' | 'hotel';

export interface PlaceItem {
  id: string;
  title: string;
  location: string;
  category: PlaceCategory;
  rating: number;
  tags: string[];
  notes: string;
  mediaLink: string;
  cover: string;
}

export interface TripBoard {
  id: string;
  title: string;
  description: string;
  cover: string;
  createdAt: string;
  places: PlaceItem[];
}
