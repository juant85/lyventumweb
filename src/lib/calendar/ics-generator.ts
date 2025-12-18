// src/lib/calendar/ics-generator.ts
import ical, { ICalCalendar } from 'ical-generator';
import { CalendarEvent, ICSGenerationOptions } from './types';

/**
 * Generate an iCalendar (.ics) file from calendar events
 */
export function generateICS(
    events: CalendarEvent[],
    options?: ICSGenerationOptions
): string {
    const calendar: ICalCalendar = ical({
        name: options?.calendarName || 'Event Agenda',
        timezone: options?.timezone || 'America/Mexico_City',
        prodId: options?.productId || '//LyVenTum//Event Manager//EN',
    });

    events.forEach(event => {
        calendar.createEvent({
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            summary: event.summary,
            description: event.description || '',
            location: event.location || '',
            url: event.url || '',
        });
    });

    return calendar.toString();
}

/**
 * Generate ICS for a single event
 */
export function generateSingleEventICS(
    event: CalendarEvent,
    options?: ICSGenerationOptions
): string {
    return generateICS([event], options);
}

/**
 * Helper to convert session registration to calendar event
 */
export function sessionToCalendarEvent(
    session: any,
    eventUrl?: string
): CalendarEvent {
    return {
        id: session.id,
        summary: session.sessionName || session.name,
        description: session.description || `Session at ${session.boothName || 'TBD'}`,
        location: session.boothName || 'See event map',
        startTime: session.sessionStartTime || session.startTime,
        endTime: session.sessionEndTime || session.endTime,
        url: eventUrl || `https://yourevent.com/session/${session.id}`,
    };
}
