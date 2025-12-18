// Email Templates for LyVentum Event Platform
// Professional HTML templates with event branding and sponsor logos
import { generateCalendarLink, generateCalendarButtonHtml } from './email-calendar-helper.ts';

export interface SessionReminderData {
  attendeeName: string;
  sessionTime: string;
  meetings: Array<{
    id?: string;
    time: string;         // Display time (e.g., "10:00 AM")
    startTime?: string;   // ISO datetime for calendar link
    endTime?: string;     // ISO datetime for calendar link
    boothName: string;
    companyName: string;
    physicalId?: string;
  }>;
  duration: string;
  portalUrl: string;
  eventName: string;
  eventLogoUrl: string;
  sponsorLogos: string[];
}

export interface DailyAgendaData {
  attendeeName: string;
  date: string;
  sessions: Array<{
    id?: string;
    name: string;
    time: string;
    startTime?: string; // ISO datetime for calendar link
    endTime?: string;   // ISO datetime for calendar link
    location: string;
    duration: string;
  }>;
  portalUrl: string;
  eventName: string;
  eventLogoUrl: string;
  sponsorLogos: string[];
}

export function generateSessionReminderEmail(data: SessionReminderData): string {
  const sponsorHtml = data.sponsorLogos
    .map(url => `<img src="${url}" alt="Sponsor" style="max-width: 140px; height: auto; margin: 10px 15px; vertical-align: middle;">`)
    .join('');

  // Generate meeting list HTML
  const meetingsHtml = data.meetings
    .map(meeting => {
      const boothLabel = meeting.physicalId ? `Booth ${meeting.physicalId}` : meeting.boothName;

      // Generate calendar link if we have startTime
      const calendarButtonHtml = meeting.startTime
        ? generateCalendarButtonHtml(
          generateCalendarLink({
            name: `Meeting with ${meeting.companyName}`,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            location: boothLabel,
            description: `Session at ${data.eventName}`,
          })
        )
        : '';

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="70" style="vertical-align: top; padding-top: 2px;">
                  <div style="background-color: #667eea; color: #ffffff; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 14px; text-align: center; white-space: nowrap;">
                    ${meeting.time}
                  </div>
                </td>
                <td style="padding-left: 12px; vertical-align: top;">
                  <div style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 4px;">
                    ${meeting.companyName}
                  </div>
                  <div style="font-size: 14px; color: #6b7280;">
                    📍 ${boothLabel}
                  </div>
                  ${calendarButtonHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header with Event Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <img src="${data.eventLogoUrl}" alt="${data.eventName}" style="max-width: 200px; height: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              
              <!-- Alert Badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #fef3c7; color: #92400e; padding: 10px 20px; border-radius: 24px; font-size: 16px; font-weight: 700; display: inline-block;">
                    ⏰ Starts in 15 minutes
                  </td>
                </tr>
              </table>
              
              <!-- Main Message -->
              <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 8px 0; font-weight: 700;">Hi ${data.attendeeName},</h1>
              <p style="color: #1f2937; font-size: 18px; margin: 0 0 4px 0; font-weight: 600;">
                Your next session starts at <strong style="color: #667eea;">${data.sessionTime}</strong>
              </p>
              <p style="color: #6b7280; font-size: 16px; margin: 0 0 24px 0;">
                You have ${data.meetings.length} meeting${data.meetings.length !== 1 ? 's' : ''} scheduled:
              </p>
              
              <!-- Meetings List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                ${meetingsHtml}
              </table>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 24px auto;">
                <tr>
                  <td align="center">
                    <a href="${data.portalUrl}/portal/agenda" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                      View Full Schedule →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Quick Tip -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #f0f4ff; border-radius: 8px; border-left: 4px solid #667eea;">
                    <p style="color: #4b5563; font-size: 14px; margin: 0; line-height: 1.5;">
                      💡 <strong>Tip:</strong> Head there now to avoid being late!
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Sponsors Section -->
          ${sponsorHtml ? `
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">Sponsored by</p>
              ${sponsorHtml}
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0;">© 2025 ${data.eventName}. All rights reserved.</p>
              <p style="margin: 12px 0 0 0;">
                <a href="${data.portalUrl}" style="color: #667eea; text-decoration: none;">Attendee Portal</a> · 
                <a href="${data.portalUrl}/portal/profile" style="color: #667eea; text-decoration: none;">My Profile</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateDailyAgendaEmail(data: DailyAgendaData): string {
  const sponsorHtml = data.sponsorLogos
    .map(url => `<img src="${url}" alt="Sponsor" style="max-width: 140px; height: auto; margin: 10px 15px; vertical-align: middle;">`)
    .join('');

  const sessionsHtml = data.sessions
    .map(session => {
      // Generate calendar link if we have startTime
      const calendarButtonHtml = session.startTime
        ? generateCalendarButtonHtml(
          generateCalendarLink({
            name: session.name,
            startTime: session.startTime,
            endTime: session.endTime,
            location: session.location,
            description: `Session at ${data.eventName}`,
          })
        )
        : '';

      return `
      <tr>
        <td style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="90" style="vertical-align: top;">
                <div style="background-color: #667eea; color: #ffffff; padding: 12px 16px; border-radius: 6px; font-weight: 700; font-size: 16px; text-align: center; white-space: nowrap;">
                  ${session.time}
                </div>
              </td>
              <td style="padding-left: 16px; vertical-align: top;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">${session.name}</h3>
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">
                      📍 ${session.location} · ⏱️ ${session.duration}
                    </p>
                    ${calendarButtonHtml}
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height: 16px;"></td></tr>
    `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header with Event Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <img src="${data.eventLogoUrl}" alt="${data.eventName}" style="max-width: 200px; height: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              
              <!-- Date Badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #e0e7ff; color: #4338ca; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block;">
                    📅 ${data.date}
                  </td>
                </tr>
              </table>
              
              <!-- Greeting -->
              <h1 style="color: #1f2937; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">Dear ${data.attendeeName},</h1>
              <p style="color: #4b5563; font-size: 16px; margin: 0 0 8px 0; line-height: 1.6;">
                This is a friendly reminder of your scheduled meetings for tomorrow. We're excited to have you at our event!
              </p>
              <p style="color: #6b7280; font-size: 16px; margin: 0 0 24px 0; font-weight: 600;">
                You have ${data.sessions.length} meeting${data.sessions.length !== 1 ? 's' : ''} planned:
              </p>
              
              <!-- Sessions List -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${sessionsHtml}
              </table>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 24px auto;">
                <tr>
                  <td align="center">
                    <a href="${data.portalUrl}/portal/agenda" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Full Agenda →</a>
                  </td>
                </tr>
              </table>
              
              <!-- Tip Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #f0f4ff; border-radius: 8px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
                      💡 <strong>Tip:</strong> Add sessions to your calendar to receive automatic reminders!
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Sponsors Section -->
          ${sponsorHtml ? `
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">Sponsored by</p>
              ${sponsorHtml}
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0;">© 2025 ${data.eventName}. All rights reserved.</p>
              <p style="margin: 12px 0 0 0;">
                <a href="${data.portalUrl}" style="color: #667eea; text-decoration: none;">Attendee Portal</a> · 
                <a href="${data.portalUrl}/portal/profile" style="color: #667eea; text-decoration: none;">My Profile</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
