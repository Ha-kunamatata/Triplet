import { apiClient } from './api';
import { ENDPOINTS } from '@constants/api';
import type {
  Place,
  PlaceReview,
  SavedPlace,
  PlaceSearchParams,
  ApiResponse,
  PaginatedResponse,
} from '@types/index';

export const placeService = {
  searchPlaces: async (params: PlaceSearchParams): Promise<Place[]> => {
    const { data } = await apiClient.get<ApiResponse<Place[]>>(ENDPOINTS.places.search, {
      params,
    });
    return data.data;
  },

  getPlaceDetail: async (placeId: string): Promise<Place> => {
    const { data } = await apiClient.get<ApiResponse<Place>>(
      ENDPOINTS.places.detail(placeId),
    );
    return data.data;
  },

  getPlaceReviews: async (
    placeId: string,
    page = 1,
  ): Promise<PaginatedResponse<PlaceReview>> => {
    const { data } = await apiClient.get<PaginatedResponse<PlaceReview>>(
      ENDPOINTS.places.reviews(placeId),
      { params: { page } },
    );
    return data;
  },

  getSavedPlaces: async (): Promise<SavedPlace[]> => {
    const { data } = await apiClient.get<ApiResponse<SavedPlace[]>>(ENDPOINTS.places.saved);
    return data.data;
  },

  savePlace: async (placeId: string, memo?: string): Promise<SavedPlace> => {
    const { data } = await apiClient.post<ApiResponse<SavedPlace>>(
      ENDPOINTS.places.save(placeId),
      { memo },
    );
    return data.data;
  },

  unsavePlace: async (placeId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.places.unsave(placeId));
  },
};
