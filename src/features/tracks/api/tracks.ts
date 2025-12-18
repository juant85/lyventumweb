// src/features/tracks/api/tracks.ts
import { supabase } from '../../../supabaseClient';

export async function getTracks(eventId: string) {
  const { data, error } = await supabase
    .from('event_tracks')
    .select('id, slug, name, color, sort_order, active')
    .eq('event_id', eventId)
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}
