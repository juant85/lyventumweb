// src/features/tracks/hooks/useMutateAttendeeTracks.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabaseClient';
import { toast } from 'react-hot-toast';
import { Database } from '../../../database.types';

export function useMutateAttendeeTracks(attendeeId: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nextTrackIds: string[]) => {
      // Simple and robust: delete all current assignments and insert the new ones.
      const { error: delErr } = await supabase
        .from('attendee_tracks')
        .delete()
        .eq('attendee_id', attendeeId)
        .eq('event_id', eventId);
      if (delErr) throw delErr;

      if (nextTrackIds.length) {
        const rows: Database['public']['Tables']['attendee_tracks']['Insert'][] = nextTrackIds.map(track_id => ({ attendee_id: attendeeId, event_id: eventId, track_id }));
        const { error: insErr } = await supabase.from('attendee_tracks').insert(rows);
        if (insErr) throw insErr;
      }
    },
    // Optimistic update for a snappy UI
    onMutate: async (nextTrackIds: string[]) => {
      await qc.cancelQueries({ queryKey: ['attendeeTracks', attendeeId] });
      const previousTracks = qc.getQueryData(['attendeeTracks', attendeeId]);
      qc.setQueryData(['attendeeTracks', attendeeId], nextTrackIds);
      return { previousTracks };
    },
    onError: (err, newTracks, context) => {
      toast.error('Failed to update tracks.');
      qc.setQueryData(['attendeeTracks', attendeeId], context?.previousTracks);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['attendeeTracks', attendeeId] });
      // Invalidate any queries that might depend on track assignments, like booth counts.
      qc.invalidateQueries({ queryKey: ['boothCounts'] });
    },
  });
}
