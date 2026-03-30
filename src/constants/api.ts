export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  TIMEOUT: 15000,
  VERSION: 'v1',
} as const;

export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  // Trip
  trips: {
    list: '/trips',
    detail: (id: string) => `/trips/${id}`,
    create: '/trips',
    update: (id: string) => `/trips/${id}`,
    delete: (id: string) => `/trips/${id}`,
    days: (id: string) => `/trips/${id}/days`,
    members: (id: string) => `/trips/${id}/members`,
  },
  // Schedule
  schedules: {
    list: (tripDayId: string) => `/trip-days/${tripDayId}/schedules`,
    create: (tripDayId: string) => `/trip-days/${tripDayId}/schedules`,
    update: (id: string) => `/schedules/${id}`,
    delete: (id: string) => `/schedules/${id}`,
    reorder: (tripDayId: string) => `/trip-days/${tripDayId}/schedules/reorder`,
  },
  // Place
  places: {
    search: '/places/search',
    detail: (id: string) => `/places/${id}`,
    reviews: (id: string) => `/places/${id}/reviews`,
    saved: '/places/saved',
    save: (id: string) => `/places/${id}/save`,
    unsave: (id: string) => `/places/${id}/save`,
  },
  // Diary
  diary: {
    list: (tripId: string) => `/trips/${tripId}/diary`,
    detail: (id: string) => `/diary/${id}`,
    create: (tripId: string) => `/trips/${tripId}/diary`,
    update: (id: string) => `/diary/${id}`,
    delete: (id: string) => `/diary/${id}`,
  },
  // Budget
  budget: {
    detail: (tripId: string) => `/trips/${tripId}/budget`,
    expenses: (tripId: string) => `/trips/${tripId}/budget/expenses`,
    addExpense: (tripId: string) => `/trips/${tripId}/budget/expenses`,
    deleteExpense: (tripId: string, expenseId: string) =>
      `/trips/${tripId}/budget/expenses/${expenseId}`,
  },
} as const;
