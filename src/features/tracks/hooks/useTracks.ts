// src/features/tracks/hooks/useTracks.ts
import { useQuery } from '@tanstack/react-query';
import { getTracks } from '../api/tracks';

export function useTracks(eventId: string | null) {
  return useQuery({
    queryKey: ['tracks', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await getTracks(eventId);
      return data ?? [];
    },
    staleTime: 30_000,
    enabled: !!eventId, // Only run the query if eventId is not null
  });
}
