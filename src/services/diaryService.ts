import { apiClient } from './api';
import { ENDPOINTS } from '@constants/api';
import type {
  DiaryEntry,
  CreateDiaryRequest,
  UpdateDiaryRequest,
  ApiResponse,
  PaginatedResponse,
} from '@types/index';

export const diaryService = {
  getDiaries: async (tripId: string): Promise<DiaryEntry[]> => {
    const { data } = await apiClient.get<ApiResponse<DiaryEntry[]>>(
      ENDPOINTS.diary.list(tripId),
    );
    return data.data;
  },

  getDiaryDetail: async (diaryId: string): Promise<DiaryEntry> => {
    const { data } = await apiClient.get<ApiResponse<DiaryEntry>>(
      ENDPOINTS.diary.detail(diaryId),
    );
    return data.data;
  },

  createDiary: async (tripId: string, payload: CreateDiaryRequest): Promise<DiaryEntry> => {
    const { data } = await apiClient.post<ApiResponse<DiaryEntry>>(
      ENDPOINTS.diary.create(tripId),
      payload,
    );
    return data.data;
  },

  updateDiary: async (diaryId: string, payload: UpdateDiaryRequest): Promise<DiaryEntry> => {
    const { data } = await apiClient.patch<ApiResponse<DiaryEntry>>(
      ENDPOINTS.diary.update(diaryId),
      payload,
    );
    return data.data;
  },

  deleteDiary: async (diaryId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.diary.delete(diaryId));
  },
};
