// src/features/tracks/hooks/useAttendeeTracks.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabaseClient';

export function useAttendeeTracks(attendeeId: string | null) {
  return useQuery({
    queryKey: ['attendeeTracks', attendeeId],
    queryFn: async () => {
      if (!attendeeId) return [];
      const { data, error } = await supabase
        .from('attendee_tracks')
        .select('track_id')
        .eq('attendee_id', attendeeId);
      if (error) throw error;
      return (data ?? []).map(r => r.track_id as string);
    },
    enabled: !!attendeeId,
  });
}

export function useAllAttendeeTracks(eventId: string | null) {
  return useQuery({
    queryKey: ['allAttendeeTracks', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      // Join to filter by event_id through attendees table
      const { data, error } = await supabase
        .from('attendee_tracks')
        .select('attendee_id, track_id, attendees!inner(event_id)')
        .eq('attendees.event_id', eventId);

      if (error) throw error;
      return data.map(d => ({ attendee_id: d.attendee_id, track_id: d.track_id }));
    },
    enabled: !!eventId
  });
}
