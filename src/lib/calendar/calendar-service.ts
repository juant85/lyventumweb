// src/lib/calendar/calendar-service.ts
import { supabase } from '../../supabaseClient';
import { generateICS, generateSingleEventICS, sessionToCalendarEvent } from './ics-generator';
import { CalendarEvent } from './types';

/**
 * Fetch and export all sessions for an attendee as .ics file
 */
export async function exportAttendeeCalendar(
    attendeeId: string,
    eventId: string
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        // Fetch attendee's session registrations
        const { data: registrations, error } = await supabase
            .from('session_registrations')
            .select(`
        id,
        session_id,
        sessions (
          id,
          name,
          start_time,
          end_time,
          description,
          booth_settings
        )
      `)
            .eq('attendee_id', attendeeId)
            .eq('event_id', eventId);

        if (error) {
            console.error('Error fetching registrations:', error);
            return { success: false, error: 'Failed to fetch sessions' };
        }

        if (!registrations || registrations.length === 0) {
            return { success: false, error: 'No sessions found' };
        }

        // Convert to calendar events
        const calendarEvents = registrations
            .map(reg => {
                const session = (reg as any).sessions;
                if (!session) return null;

                return sessionToCalendarEvent({
                    id: session.id,
                    name: session.name,
                    startTime: session.start_time,
                    endTime: session.end_time,
                    description: session.description,
                });
            })
            .filter(Boolean) as CalendarEvent[];

        if (calendarEvents.length === 0) {
            return { success: false, error: 'No valid sessions found' };
        }

        // Generate ICS
        const icsContent = generateICS(calendarEvents, {
            calendarName: 'My Event Agenda',
            timezone: 'America/Mexico_City',
        });

        return { success: true, data: icsContent };

    } catch (error) {
        console.error('Export calendar error:', error);
        return { success: false, error: 'Internal error' };
    }
}

/**
 * Fetch and export a single session as .ics file
 */
export async function exportSessionCalendar(
    sessionId: string
): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
    try {
        // Fetch session details
        const { data: session, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error || !session) {
            return { success: false, error: 'Session not found' };
        }

        // Convert to calendar event
        const calendarEvent = sessionToCalendarEvent({
            id: session.id,
            name: session.name,
            startTime: session.start_time,
            endTime: session.end_time,
            description: session.description || `Session at your event`,
        });

        // Generate ICS for single session
        const icsContent = generateSingleEventICS(calendarEvent, {
            calendarName: session.name,
        });

        // Generate filename
        const filename = `${session.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;

        return { success: true, data: icsContent, filename };

    } catch (error) {
        console.error('Session export error:', error);
        return { success: false, error: 'Internal error' };
    }
}

/**
 * Helper to download .ics file in browser
 */
export function downloadICSFile(content: string, filename: string = 'calendar.ics') {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
}
