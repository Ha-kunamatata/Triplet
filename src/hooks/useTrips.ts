import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripService } from '@services/tripService';
import { useTripStore } from '@store/useTripStore';
import type { CreateTripRequest } from '@types/index';

const QUERY_KEYS = {
  trips: ['trips'] as const,
  tripDetail: (id: string) => ['trips', id] as const,
};

/** 여행 목록 조회 */
export function useTrips() {
  const { setTrips } = useTripStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.trips,
    queryFn: tripService.getTrips,
  });

  useEffect(() => {
    if (query.data) setTrips(query.data);
  }, [query.data, setTrips]);

  return query;
}

/** 여행 상세 조회 */
export function useTripDetail(tripId: string) {
  const { setCurrentTrip } = useTripStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.tripDetail(tripId),
    queryFn: () => tripService.getTripDetail(tripId),
    enabled: !!tripId,
  });

  useEffect(() => {
    if (query.data) setCurrentTrip(query.data);
  }, [query.data, setCurrentTrip]);

  return query;
}

/** 여행 생성 */
export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { addTrip } = useTripStore();

  return useMutation({
    mutationFn: (payload: CreateTripRequest) => tripService.createTrip(payload),
    onSuccess: (trip) => {
      addTrip(trip);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips });
    },
  });
}

/** 여행 삭제 */
export function useDeleteTrip() {
  const queryClient = useQueryClient();
  const { deleteTrip } = useTripStore();

  return useMutation({
    mutationFn: (tripId: string) => tripService.deleteTrip(tripId),
    onSuccess: (_, tripId) => {
      deleteTrip(tripId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips });
    },
  });
}
