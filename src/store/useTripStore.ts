import { create } from 'zustand';
import type { Trip, TripDetail, TripDay, Schedule } from '@types/index';

interface TripState {
  trips: Trip[];
  currentTrip: TripDetail | null;
  selectedDayIndex: number;
  isLoading: boolean;

  // Actions
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  deleteTrip: (tripId: string) => void;

  setCurrentTrip: (trip: TripDetail | null) => void;
  setSelectedDayIndex: (index: number) => void;

  addSchedule: (dayId: string, schedule: Schedule) => void;
  updateSchedule: (dayId: string, scheduleId: string, updates: Partial<Schedule>) => void;
  deleteSchedule: (dayId: string, scheduleId: string) => void;
  reorderSchedules: (dayId: string, schedules: Schedule[]) => void;

  setLoading: (loading: boolean) => void;
}

export const useTripStore = create<TripState>((set) => ({
  trips: [],
  currentTrip: null,
  selectedDayIndex: 0,
  isLoading: false,

  setTrips: (trips) => set({ trips }),

  addTrip: (trip) =>
    set((state) => ({
      trips: [trip, ...state.trips],
    })),

  updateTrip: (tripId, updates) =>
    set((state) => ({
      trips: state.trips.map((t) => (t.id === tripId ? { ...t, ...updates } : t)),
      currentTrip:
        state.currentTrip?.id === tripId
          ? { ...state.currentTrip, ...updates }
          : state.currentTrip,
    })),

  deleteTrip: (tripId) =>
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== tripId),
      currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
    })),

  setCurrentTrip: (trip) => set({ currentTrip: trip, selectedDayIndex: 0 }),

  setSelectedDayIndex: (index) => set({ selectedDayIndex: index }),

  addSchedule: (dayId, schedule) =>
    set((state) => {
      if (!state.currentTrip) return state;
      return {
        currentTrip: {
          ...state.currentTrip,
          days: state.currentTrip.days.map((day) =>
            day.id === dayId
              ? { ...day, schedules: [...day.schedules, schedule] }
              : day,
          ),
        },
      };
    }),

  updateSchedule: (dayId, scheduleId, updates) =>
    set((state) => {
      if (!state.currentTrip) return state;
      return {
        currentTrip: {
          ...state.currentTrip,
          days: state.currentTrip.days.map((day) =>
            day.id === dayId
              ? {
                  ...day,
                  schedules: day.schedules.map((s) =>
                    s.id === scheduleId ? { ...s, ...updates } : s,
                  ),
                }
              : day,
          ),
        },
      };
    }),

  deleteSchedule: (dayId, scheduleId) =>
    set((state) => {
      if (!state.currentTrip) return state;
      return {
        currentTrip: {
          ...state.currentTrip,
          days: state.currentTrip.days.map((day) =>
            day.id === dayId
              ? { ...day, schedules: day.schedules.filter((s) => s.id !== scheduleId) }
              : day,
          ),
        },
      };
    }),

  reorderSchedules: (dayId, schedules) =>
    set((state) => {
      if (!state.currentTrip) return state;
      return {
        currentTrip: {
          ...state.currentTrip,
          days: state.currentTrip.days.map((day) =>
            day.id === dayId ? { ...day, schedules } : day,
          ),
        },
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
