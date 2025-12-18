// src/hooks/useAttendeeJourney.ts
import { useMemo } from 'react';
import { useEventData } from '../contexts/EventDataContext';
import { JourneyEvent } from '../types';
import { supabase } from '../supabaseClient';
import { useQuery } from '@tanstack/react-query';

interface JourneyStats {
    totalEvents: number;
    boothsVisited: number;
    sessionsAttended: number;
    checkInTime: Date | null;
}

interface UseAttendeeJourneyResult {
    events: JourneyEvent[];
    stats: JourneyStats;
    isLoading: boolean;
    error: string | null;
}

/**
 * Custom hook to fetch and process attendee journey data
 * Centralizes logic for both admin and attendee views
 */
export function useAttendeeJourney(
    attendeeId: string | undefined,
    eventId: string | undefined
): UseAttendeeJourneyResult {
    const { scans, sessions, getBoothName } = useEventData();

    // Fetch check-in time from event_attendees
    const { data: checkInData, isLoading: isCheckInLoading } = useQuery({
        queryKey: ['checkInTime', attendeeId, eventId],
        queryFn: async () => {
            if (!attendeeId || !eventId) return null;

            const { data, error } = await supabase
                .from('event_attendees')
                .select('check_in_time')
                .eq('attendee_id', attendeeId)
                .eq('event_id', eventId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching check-in time:', error);
                return null;
            }

            return data?.check_in_time || null;
        },
        enabled: !!attendeeId && !!eventId,
    });

    // Process journey events
    const events = useMemo((): JourneyEvent[] => {
        if (!attendeeId || !eventId) return [];

        const journeyEvents: JourneyEvent[] = [];

        // Add check-in event
        if (checkInData) {
            journeyEvents.push({
                id: `checkin-${attendeeId}`,
                type: 'check-in',
                title: 'Checked into Event',
                timestamp: checkInData,
                metadata: {},
            });
        }

        // Filter scans for this attendee and event
        const attendeeScans = scans.filter(
            scan => scan.attendeeId === attendeeId && scan.eventId === eventId
        );

        // Process each scan
        attendeeScans.forEach(scan => {
            const session = sessions.find(s => s.id === scan.sessionId);
            const isSessionScan = scan.scanType === 'regular';

            journeyEvents.push({
                id: scan.id,
                type: isSessionScan ? 'session-attendance' : 'booth-scan',
                title: isSessionScan
                    ? `Attended Session: ${session?.name || 'Unknown'}`
                    : `Visited Booth: ${getBoothName(scan.boothId ?? '') || scan.boothName || 'Unknown'}`,
                timestamp: scan.timestamp,
                metadata: {
                    boothId: scan.boothId ?? undefined,
                    boothName: scan.boothName ?? getBoothName(scan.boothId ?? '') ?? undefined,
                    sessionId: scan.sessionId ?? undefined,
                    sessionName: session?.name,
                    notes: scan.notes ?? undefined,
                },
            });
        });

        // Sort by timestamp (newest first)
        return journeyEvents.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [attendeeId, eventId, checkInData, scans, sessions, getBoothName]);

    // Calculate stats
    const stats = useMemo((): JourneyStats => {
        const boothScans = events.filter(e => e.type === 'booth-scan');
        const sessionAttendances = events.filter(e => e.type === 'session-attendance');

        return {
            totalEvents: events.length,
            boothsVisited: boothScans.length,
            sessionsAttended: sessionAttendances.length,
            checkInTime: checkInData ? new Date(checkInData) : null,
        };
    }, [events, checkInData]);

    return {
        events,
        stats,
        isLoading: isCheckInLoading,
        error: null,
    };
}
