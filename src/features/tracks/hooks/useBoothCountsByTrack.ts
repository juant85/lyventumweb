// src/features/tracks/hooks/useBoothCountsByTrack.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabaseClient';

export function useBoothCountsByTrack(sessionId: string | null, trackId?: string) {
  return useQuery({
    queryKey: ['boothCounts', sessionId, trackId ?? 'all'],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase.rpc('booth_counts_by_track', {
        p_session_id: sessionId,
        p_track_id: trackId ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sessionId,
  });
}
