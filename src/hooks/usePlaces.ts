import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { placeService } from '@services/placeService';
import { usePlaceStore } from '@store/usePlaceStore';
import type { PlaceSearchParams } from '@types/index';

const QUERY_KEYS = {
  savedPlaces: ['savedPlaces'] as const,
  placeDetail: (id: string) => ['places', id] as const,
};

/** 저장된 장소 목록 조회 */
export function useSavedPlaces() {
  const { setSavedPlaces } = usePlaceStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.savedPlaces,
    queryFn: placeService.getSavedPlaces,
  });

  useEffect(() => {
    if (query.data) setSavedPlaces(query.data);
  }, [query.data, setSavedPlaces]);

  return query;
}

/** 장소 상세 조회 */
export function usePlaceDetail(placeId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.placeDetail(placeId),
    queryFn: () => placeService.getPlaceDetail(placeId),
    enabled: !!placeId,
  });
}

/** 장소 저장 / 저장 취소 */
export function useToggleSavePlace() {
  const queryClient = useQueryClient();
  const { addSavedPlace, removeSavedPlace, savedPlaces } = usePlaceStore();

  return useMutation({
    mutationFn: async (placeId: string) => {
      const isSaved = savedPlaces.some((p) => p.place.id === placeId);
      if (isSaved) {
        await placeService.unsavePlace(placeId);
        return { placeId, saved: false };
      } else {
        const saved = await placeService.savePlace(placeId);
        return { placeId, saved: true, data: saved };
      }
    },
    onSuccess: ({ placeId, saved, data }) => {
      if (saved && data) {
        addSavedPlace(data);
      } else {
        removeSavedPlace(placeId);
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savedPlaces });
    },
  });
}
