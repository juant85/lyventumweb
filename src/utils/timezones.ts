// Common timezone list for US and international events
export const COMMON_TIMEZONES = [
    // US Timezones
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Phoenix', label: 'Arizona (no DST)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },

    // International - Europe
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
    { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },

    // International - Asia
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },

    // International - Americas
    { value: 'America/Toronto', label: 'Toronto (ET)' },
    { value: 'America/Mexico_City', label: 'Mexico City (CST)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)' },

    // International - Oceania
    { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)' },
];

// Get timezone abbreviation for display
export const getTimezoneAbbr = (timezone: string): string => {
    const tz = COMMON_TIMEZONES.find(t => t.value === timezone);
    if (!tz) return timezone;

    // Extract abbreviation from label (text in parentheses)
    const match = tz.label.match(/\(([^)]+)\)/);
    return match ? match[1] : timezone;
};

// Get timezone label
export const getTimezoneLabel = (timezone: string): string => {
    const tz = COMMON_TIMEZONES.find(t => t.value === timezone);
    return tz ? tz.label : timezone;
};

export default COMMON_TIMEZONES;
