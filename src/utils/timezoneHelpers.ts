// Timezone conversion helpers using date-fns-tz
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Convert a date from event timezone to UTC for storage
 * @param localDate - Date in event's local timezone
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Date in UTC
 */
export const eventDateToUTC = (localDate: Date, timezone: string): Date => {
    return fromZonedTime(localDate, timezone);
};

/**
 * Convert a UTC date to event's local timezone for display
 * @param utcDate - Date in UTC
 * @param timezone - IANA timezone identifier
 * @returns Date in event's local timezone
 */
export const utcToEventDate = (utcDate: Date, timezone: string): Date => {
    return toZonedTime(utcDate, timezone);
};

/**
 * Format a date in a specific timezone
 * @param date - Date to format (can be UTC or local)
 * @param timezone - IANA timezone identifier
 * @param formatStr - date-fns format string
 * @returns Formatted date string
 */
export const formatInTimezone = (date: Date, timezone: string, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string => {
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, formatStr, { timeZone: timezone });
};

/**
 * Parse an ISO string and convert to event timezone
 * @param isoString - ISO date string (usually from database)
 * @param timezone - Event timezone
 * @returns Date in event timezone
 */
export const parseISOInTimezone = (isoString: string, timezone: string): Date => {
    const utcDate = parseISO(isoString);
    return toZonedTime(utcDate, timezone);
};

/**
 * Get current time in a specific timezone
 * @param timezone - IANA timezone identifier
 * @returns Current date/time in specified timezone
 */
export const nowInTimezone = (timezone: string): Date => {
    return toZonedTime(new Date(), timezone);
};

/**
 * Convert datetime-local string to UTC for storage
 * @param datetimeLocal - String in format 'YYYY-MM-DDTHH:mm'
 * @param timezone - Event timezone
 * @returns UTC Date object
 */
export const datetimeLocalToUTC = (datetimeLocal: string, timezone: string): Date => {
    // datetime-local format: '2025-12-16T14:30'
    const localDate = parseISO(datetimeLocal);
    return fromZonedTime(localDate, timezone);
};

/**
 * Convert UTC date to datetime-local string format
 * @param utcDate - UTC date
 * @param timezone - Event timezone
 * @returns String in 'YYYY-MM-DDTHH:mm' format
 */
export const utcToDatetimeLocal = (utcDate: Date, timezone: string): string => {
    const zonedDate = toZonedTime(utcDate, timezone);
    // Format as 'YYYY-MM-DDTHH:mm' for datetime-local input
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm", { timeZone: timezone });
};

export default {
    eventDateToUTC,
    utcToEventDate,
    formatInTimezone,
    parseISOInTimezone,
    nowInTimezone,
    datetimeLocalToUTC,
    utcToDatetimeLocal
};
