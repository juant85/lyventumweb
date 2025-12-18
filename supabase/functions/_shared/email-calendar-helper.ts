// Email Calendar Link Helper
// Generates Google Calendar URLs for email templates

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHMMSSZ)
 */
function formatDateForGoogle(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate Google Calendar URL for a session
 */
export function generateCalendarLink(params: {
    name: string;
    startTime: string;
    endTime?: string;
    location?: string;
    description?: string;
}): string {
    const start = formatDateForGoogle(params.startTime);

    // If no end time, default to 1 hour duration
    const endTime = params.endTime || new Date(new Date(params.startTime).getTime() + 60 * 60 * 1000).toISOString();
    const end = formatDateForGoogle(endTime);

    const urlParams = new URLSearchParams({
        action: 'TEMPLATE',
        text: params.name,
        dates: `${start}/${end}`,
        details: params.description || '',
        location: params.location || '',
    });

    return `https://calendar.google.com/calendar/render?${urlParams.toString()}`;
}

/**
 * Generate calendar button HTML for email
 */
export function generateCalendarButtonHtml(calendarUrl: string): string {
    return `
    <a href="${calendarUrl}" 
       style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; margin-top: 8px;">
      📅 Add to Calendar
    </a>
  `;
}
