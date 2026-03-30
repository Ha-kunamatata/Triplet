import { apiClient } from './api';
import { ENDPOINTS } from '@constants/api';
import type {
  Trip,
  TripDetail,
  TripDay,
  Schedule,
  CreateTripRequest,
  ApiResponse,
  PaginatedResponse,
} from '@types/index';

export const tripService = {
  getTrips: async (): Promise<Trip[]> => {
    const { data } = await apiClient.get<ApiResponse<Trip[]>>(ENDPOINTS.trips.list);
    return data.data;
  },

  getTripDetail: async (tripId: string): Promise<TripDetail> => {
    const { data } = await apiClient.get<ApiResponse<TripDetail>>(
      ENDPOINTS.trips.detail(tripId),
    );
    return data.data;
  },

  createTrip: async (payload: CreateTripRequest): Promise<Trip> => {
    const { data } = await apiClient.post<ApiResponse<Trip>>(ENDPOINTS.trips.create, payload);
    return data.data;
  },

  updateTrip: async (tripId: string, payload: Partial<CreateTripRequest>): Promise<Trip> => {
    const { data } = await apiClient.patch<ApiResponse<Trip>>(
      ENDPOINTS.trips.update(tripId),
      payload,
    );
    return data.data;
  },

  deleteTrip: async (tripId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.trips.delete(tripId));
  },

  // Schedule
  createSchedule: async (
    tripDayId: string,
    payload: Omit<Schedule, 'id' | 'tripDayId'>,
  ): Promise<Schedule> => {
    const { data } = await apiClient.post<ApiResponse<Schedule>>(
      ENDPOINTS.schedules.create(tripDayId),
      payload,
    );
    return data.data;
  },

  updateSchedule: async (
    scheduleId: string,
    payload: Partial<Schedule>,
  ): Promise<Schedule> => {
    const { data } = await apiClient.patch<ApiResponse<Schedule>>(
      ENDPOINTS.schedules.update(scheduleId),
      payload,
    );
    return data.data;
  },

  deleteSchedule: async (scheduleId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.schedules.delete(scheduleId));
  },

  reorderSchedules: async (
    tripDayId: string,
    scheduleIds: string[],
  ): Promise<Schedule[]> => {
    const { data } = await apiClient.patch<ApiResponse<Schedule[]>>(
      ENDPOINTS.schedules.reorder(tripDayId),
      { scheduleIds },
    );
    return data.data;
  },
};
