// src/lib/calendar/calendar-links.ts
import { format } from 'date-fns';
import { CalendarEvent, CalendarProvider } from './types';

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHMMSSZ)
 */
function formatDateForGoogle(date: Date | string): string {
    const d = new Date(date);
    return format(d, "yyyyMMdd'T'HHmmss'Z'");
}

/**
 * Generate Google Calendar URL
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
    const start = formatDateForGoogle(event.startTime);
    const end = formatDateForGoogle(event.endTime);

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.summary,
        dates: `${start}/${end}`,
        details: event.description || '',
        location: event.location || '',
    });

    if (event.url) {
        params.set('trp', 'false');
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function getOutlookUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
        subject: event.summary,
        startdt: new Date(event.startTime).toISOString(),
        enddt: new Date(event.endTime).toISOString(),
        body: event.description || '',
        location: event.location || '',
    });

    if (event.url) {
        params.set('path', '/calendar/action/compose');
    }

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Office 365 URL (alternative for corporate Outlook)
 */
export function getOffice365Url(event: CalendarEvent): string {
    const params = new URLSearchParams({
        subject: event.summary,
        startdt: new Date(event.startTime).toISOString(),
        enddt: new Date(event.endTime).toISOString(),
        body: event.description || '',
        location: event.location || '',
    });

    return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Get calendar URL based on provider
 */
export function getCalendarUrl(
    provider: CalendarProvider,
    event: CalendarEvent
): string {
    switch (provider) {
        case 'google':
            return getGoogleCalendarUrl(event);
        case 'outlook':
            return getOutlookUrl(event);
        case 'apple':
        case 'ical':
            return `/api/calendar/session/${event.id}`;
        default:
            throw new Error(`Unknown calendar provider: ${provider}`);
    }
}
