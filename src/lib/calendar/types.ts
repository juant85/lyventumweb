// src/lib/calendar/types.ts

export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    startTime: Date | string;
    endTime: Date | string;
    url?: string;
}

export interface ICSGenerationOptions {
    calendarName?: string;
    timezone?: string;
    productId?: string;
}

export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'ical';

export interface CalendarLinkOptions {
    provider: CalendarProvider;
    event: CalendarEvent;
}
