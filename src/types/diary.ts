export interface DiaryEntry {
  id: string;
  tripId: string;
  tripDayId?: string;
  userId: string;
  title: string;
  content: string;
  images: DiaryImage[];
  mood?: DiaryMood;
  weather?: DiaryWeather;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

export type DiaryMood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export type DiaryWeather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';

export interface CreateDiaryRequest {
  tripId: string;
  tripDayId?: string;
  title: string;
  content: string;
  images?: { url: string; caption?: string }[];
  mood?: DiaryMood;
  weather?: DiaryWeather;
  isPublic?: boolean;
}

export interface UpdateDiaryRequest extends Partial<CreateDiaryRequest> {
  id: string;
}
