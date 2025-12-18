import { supabase } from '../supabaseClient';

export interface ChallengeProgress {
    agenda_booth_ids: string[];      // Booths in attendee's scheduled meetings
    visited_booth_ids: string[];     // Booths from agenda they've visited
    total_agenda_booths: number;     // Total meetings scheduled
    attended_booths: number;         // Meetings attended (stamps earned)
    progress_percentage: number;     // % of scheduled meetings completed
}

export interface LeaderboardEntry {
    attendee_id: string;
    attendee_name: string;
    unique_booths_visited: number;
    total_scans: number;
    latest_scan_time: string;
    rank: number;
}

export interface ChallengeConfig {
    challenge_enabled: boolean;
    challenge_target_booths: number;
    challenge_title: string;
    challenge_description: string;
}

export class ChallengeService {
    /**
     * Get attendee's current challenge progress
     */
    async getProgress(attendeeId: string, eventId: string): Promise<ChallengeProgress | null> {
        try {
            const { data, error } = await supabase.rpc('get_attendee_booth_progress', {
                p_attendee_id: attendeeId,
                p_event_id: eventId
            });

            if (error) {
                console.error('[ChallengeService] Error fetching progress:', error);
                return null;
            }

            // RPC returns array, get first result
            const result = data?.[0];

            return result || {
                agenda_booth_ids: [],
                visited_booth_ids: [],
                total_agenda_booths: 0,
                attended_booths: 0,
                progress_percentage: 0
            };
        } catch (e) {
            console.error('[ChallengeService] Exception in getProgress:', e);
            return null;
        }
    }

    /**
     * Get event leaderboard
     */
    async getLeaderboard(eventId: string, limit = 100): Promise<LeaderboardEntry[]> {
        try {
            const { data, error } = await supabase.rpc('get_challenge_leaderboard', {
                p_event_id: eventId,
                p_limit: limit
            });

            if (error) {
                console.error('[ChallengeService] Error fetching leaderboard:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('[ChallengeService] Exception in getLeaderboard:', e);
            return [];
        }
    }

    /**
     * Get event challenge configuration
     */
    async getChallengeConfig(eventId: string): Promise<ChallengeConfig | null> {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('challenge_enabled, challenge_target_booths, challenge_title, challenge_description')
                .eq('id', eventId)
                .single();

            if (error) {
                console.error('[ChallengeService] Error fetching config:', error);
                return null;
            }

            return data;
        } catch (e) {
            console.error('[ChallengeService] Exception in getChallengeConfig:', e);
            return null;
        }
    }

    /**
     * Get booth details for visited booths
     */
    async getVisitedBoothDetails(boothIds: string[], eventId: string) {
        if (!boothIds || boothIds.length === 0) return [];

        try {
            const { data, error } = await supabase
                .from('booths')
                .select('id, physical_id, company_name, sponsor_logo_url')
                .in('id', boothIds)
                .eq('event_id', eventId);

            if (error) {
                console.error('[ChallengeService] Error fetching booth details:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('[ChallengeService] Exception in getVisitedBoothDetails:', e);
            return [];
        }
    }

    /**
     * Update challenge configuration for an event (Admin only)
     */
    async updateChallengeConfig(
        eventId: string,
        config: Partial<ChallengeConfig>
    ): Promise<ChallengeConfig | null> {
        try {
            const updateData: any = {};

            if (config.challenge_enabled !== undefined) {
                updateData.challenge_enabled = config.challenge_enabled;
            }
            if (config.challenge_title !== undefined) {
                updateData.challenge_title = config.challenge_title;
            }
            if (config.challenge_description !== undefined) {
                updateData.challenge_description = config.challenge_description;
            }
            if (config.challenge_target_booths !== undefined) {
                updateData.challenge_target_booths = config.challenge_target_booths;
            }

            const { data, error } = await supabase
                .from('events')
                .update(updateData)
                .eq('id', eventId)
                .select('challenge_enabled, challenge_target_booths, challenge_title, challenge_description')
                .single();

            if (error) {
                console.error('[ChallengeService] Error updating config:', error);
                throw error;
            }

            return data;
        } catch (e) {
            console.error('[ChallengeService] Exception in updateChallengeConfig:', e);
            throw e;
        }
    }
}

export const challengeService = new ChallengeService();
