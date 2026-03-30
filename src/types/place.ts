export type PlaceCategory =
  | 'attraction'
  | 'restaurant'
  | 'cafe'
  | 'accommodation'
  | 'shopping'
  | 'etc';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  coordinates: Coordinates;
  phone?: string;
  website?: string;
  description?: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  openingHours?: OpeningHours;
  tags: string[];
}

export interface OpeningHours {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
}

export interface PlaceReview {
  id: string;
  placeId: string;
  userId: string;
  nickname: string;
  profileImage?: string;
  rating: number;
  content: string;
  images: string[];
  createdAt: string;
}

export interface SavedPlace {
  id: string;
  userId: string;
  place: Place;
  memo?: string;
  savedAt: string;
}

export interface PlaceSearchParams {
  query: string;
  category?: PlaceCategory;
  coordinates?: Coordinates;
  radius?: number; // meters
}
