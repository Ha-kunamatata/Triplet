export type TripStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  coverImage?: string;
  startDate: string; // ISO 8601
  endDate: string;
  status: TripStatus;
  memberCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripDetail extends Trip {
  days: TripDay[];
  budget?: TripBudget;
  members: TripMember[];
}

export interface TripDay {
  id: string;
  tripId: string;
  date: string;
  dayNumber: number;
  schedules: Schedule[];
}

export interface Schedule {
  id: string;
  tripDayId: string;
  placeId?: string;
  place?: Place;
  title: string;
  memo?: string;
  startTime?: string;
  endTime?: string;
  order: number;
  category: ScheduleCategory;
  cost?: number;
}

export type ScheduleCategory =
  | 'attraction'
  | 'restaurant'
  | 'cafe'
  | 'accommodation'
  | 'transport'
  | 'shopping'
  | 'etc';

export interface TripBudget {
  tripId: string;
  currency: string;
  totalBudget: number;
  spentAmount: number;
  expenses: BudgetExpense[];
}

export interface BudgetExpense {
  id: string;
  tripId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface TripMember {
  userId: string;
  nickname: string;
  profileImage?: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface CreateTripRequest {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic?: boolean;
}

// Place 타입은 place.ts 에서 import 해서 사용
import type { Place } from './place';
export type { Place };
