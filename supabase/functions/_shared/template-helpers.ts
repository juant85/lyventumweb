// supabase/functions/_shared/template-helpers.ts
// Deno-compatible template rendering helpers

interface TemplateVariables {
    [key: string]: any;
}

/**
 * Simple template variable replacement
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
    let rendered = template;

    // Replace simple variables {{VARIABLE}}
    Object.entries(variables).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, String(value));
        }
    });

    // Handle conditional sections {{#if VARIABLE}}...{{/if}}
    Object.entries(variables).forEach(([key, value]) => {
        const ifRegex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g');

        if (value && value !== false && value !== '' && value !== null && value !== undefined) {
            // Keep the content
            rendered = rendered.replace(ifRegex, '$1');

            // If it's an object, replace nested properties
            if (typeof value === 'object' && !Array.isArray(value)) {
                Object.entries(value).forEach(([prop, propValue]) => {
                    const propRegex = new RegExp(`{{${key}\\.${prop}}}`, 'g');
                    rendered = rendered.replace(propRegex, String(propValue || ''));
                });
            }
        } else {
            // Remove the content
            rendered = rendered.replace(ifRegex, '');
        }
    });

    // Handle arrays {{#each ARRAY}}...{{/each}}
    Object.entries(variables).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            const eachMatch = rendered.match(new RegExp(`{{#each ${key}}}([\\s\\S]*?){{/each}}`, 'g'));

            if (eachMatch) {
                eachMatch.forEach(match => {
                    const itemTemplate = match.replace(`{{#each ${key}}}`, '').replace('{{/each}}', '');

                    const itemsHtml = value.map(item => {
                        let itemHtml = itemTemplate;

                        // Replace {{this.property}}
                        if (typeof item === 'object') {
                            Object.entries(item).forEach(([prop, propValue]) => {
                                const propRegex = new RegExp(`{{this\\.${prop}}}`, 'g');
                                itemHtml = itemHtml.replace(propRegex, String(propValue || ''));

                                // Handle conditionals within items
                                const ifPropRegex = new RegExp(`{{#if this\\.${prop}}}([\\s\\S]*?){{/if}}`, 'g');
                                if (propValue) {
                                    itemHtml = itemHtml.replace(ifPropRegex, '$1');
                                } else {
                                    itemHtml = itemHtml.replace(ifPropRegex, '');
                                }
                            });
                        }

                        return itemHtml;
                    }).join('');

                    rendered = rendered.replace(match, itemsHtml);
                });
            }
        }
    });

    return rendered;
}

/**
 * Load sponsors from database
 */
export async function loadSponsors(supabase: any, eventId: string) {
    try {
        const { data: booths, error } = await supabase
            .from('booths')
            .select('companyName, sponsorLogoUrl, sponsorWebsiteUrl, sponsorshipTier, isSponsor')
            .eq('event_id', eventId)
            .eq('isSponsor', true);

        if (error) {
            console.error('[TemplateHelpers] Error loading sponsors:', error);
            return { platinum: null, gold: [], silver: [] };
        }

        const platinum = booths?.find((b: any) => b.sponsorshipTier === 'platinum') || null;
        const gold = booths?.filter((b: any) => b.sponsorshipTier === 'gold') || [];
        const silver = booths?.filter((b: any) => b.sponsorshipTier === 'silver') || [];

        return {
            platinum: platinum ? {
                name: platinum.companyName,
                logo: platinum.sponsorLogoUrl || '',
                website: platinum.sponsorWebsiteUrl || '#'
            } : null,
            gold: gold.map((b: any) => ({
                name: b.companyName,
                logo: b.sponsorLogoUrl || '',
                website: b.sponsorWebsiteUrl || '#'
            })),
            silver: silver.map((b: any) => ({
                name: b.companyName,
                logo: b.sponsorLogoUrl || '',
                website: b.sponsorWebsiteUrl || '#'
            }))
        };
    } catch (error) {
        console.error('[TemplateHelpers] Error in loadSponsors:', error);
        return { platinum: null, gold: [], silver: [] };
    }
}

/**
 * Get default session reminder template
 */
export function getSessionReminderTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Session Starting Soon!</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="color:#64748b;font-size:16px;margin:0 0 20px 0;">Hi {{ATTENDEE_NAME}},</p>
<p style="color:#64748b;font-size:16px;margin:0 0 30px 0;">Your session is starting in <strong>{{REMINDER_MINUTES}} minutes</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid #f59e0b;border-radius:6px;margin-bottom:30px;">
<tr><td style="padding:20px;">
<h2 style="color:#1e293b;margin:0 0 15px 0;font-size:20px;">{{SESSION_NAME}}</h2>
<p style="color:#64748b;font-size:14px;margin:8px 0;"><strong>📅 Time:</strong> {{SESSION_TIME}}</p>
{{#if BOOTH_NAME}}<p style="color:#64748b;font-size:14px;margin:8px 0;"><strong>📍 Location:</strong> {{BOOTH_NAME}}</p>{{/if}}
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="{{AGENDA_URL}}" style="display:inline-block;background-color:#f59e0b;color:#fff;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;">View My Agenda</a>
</td></tr>
</table>
</td></tr>
{{#if PLATINUM_SPONSOR}}
<tr><td style="padding:30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
<h3 style="color:#1e293b;text-align:center;margin:0 0 20px 0;font-size:16px;">Sponsored By</h3>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="{{PLATINUM_SPONSOR.website}}"><img src="{{PLATINUM_SPONSOR.logo}}" alt="{{PLATINUM_SPONSOR.name}}" style="max-width:200px;height:auto;"></a>
</td></tr>
</table>
</td></tr>
{{/if}}
<tr><td style="padding:30px;text-align:center;background-color:#1e293b;color:#94a3b8;">
<p style="margin:0 0 10px 0;font-size:14px;color:#cbd5e1;"><strong style="color:#fff;">{{EVENT_NAME}}</strong></p>
<p style="margin:0;font-size:12px;">Need help? <a href="mailto:{{SUPPORT_EMAIL}}" style="color:#06b6d4;">{{SUPPORT_EMAIL}}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Get default daily agenda template
 */
export function getDailyAgendaTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Your Agenda for {{AGENDA_DATE}}</h1>
</td></tr>
<tr><td style="padding:30px;">
<p style="color:#64748b;font-size:16px;margin:0 0 15px 0;">Hi {{ATTENDEE_NAME}},</p>
<p style="color:#64748b;font-size:16px;margin:0 0 20px 0;">You have <strong>{{SESSION_COUNT}} session(s)</strong> scheduled.</p>
{{#each SESSIONS}}
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid #8b5cf6;border-radius:6px;margin-bottom:15px;">
<tr><td style="padding:20px;">
<h3 style="color:#1e293b;margin:0 0 10px 0;font-size:18px;">{{this.name}}</h3>
<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>🕐 Time:</strong> {{this.time}}</p>
{{#if this.booth}}<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>📍 Location:</strong> {{this.booth}}</p>{{/if}}
{{#if this.duration}}<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>⏱️ Duration:</strong> {{this.duration}}</p>{{/if}}
{{#if this.calendarUrl}}
<a href="{{this.calendarUrl}}" style="display:inline-block;background-color:#10b981;color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;margin-top:8px;">📅 Add to Calendar</a>
{{/if}}
</td></tr>
</table>
{{/each}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
<tr><td align="center">
<a href="{{AGENDA_URL}}" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;">View Full Agenda</a>
</td></tr>
</table>
</td></tr>
{{#if PLATINUM_SPONSOR}}
<tr><td style="padding:30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
<h3 style="color:#1e293b;text-align:center;margin:0 0 20px 0;font-size:16px;">Proudly Sponsored By</h3>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<p style="color:#94a3b8;font-size:11px;margin:0 0 10px 0;text-transform:uppercase;">Platinum Sponsor</p>
<a href="{{PLATINUM_SPONSOR.website}}"><img src="{{PLATINUM_SPONSOR.logo}}" alt="{{PLATINUM_SPONSOR.name}}" style="max-width:200px;height:auto;"></a>
</td></tr>
</table>
</td></tr>
{{/if}}
<tr><td style="padding:30px;text-align:center;background-color:#1e293b;color:#94a3b8;">
<p style="margin:0 0 10px 0;font-size:14px;color:#cbd5e1;"><strong style="color:#fff;">{{EVENT_NAME}}</strong></p>
<p style="margin:0;font-size:12px;">Need help? <a href="mailto:{{SUPPORT_EMAIL}}" style="color:#06b6d4;">{{SUPPORT_EMAIL}}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
