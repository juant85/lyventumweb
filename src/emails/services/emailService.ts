// src/emails/services/emailService.ts
import { supabase } from '../../supabaseClient';

interface EmailConfig {
    companyName: string;
    companyLogo?: string;
    sponsorLogo?: string;
    sponsorName?: string;
    sponsorWebsite?: string;
    showSponsor: boolean;
    fromEmail: string;
    fromName: string;
}

export class EmailService {
    /**
     * Send access code email with dynamic logos
     */
    async sendAccessCode(params: {
        recipientEmail: string;
        code: string;
        eventId: string;
        attendeeId: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Get event details
            const { data: event } = await supabase
                .from('events')
                .select('name, start_date, end_date, venue')
                .eq('id', params.eventId)
                .single();

            // 2. Get attendee name
            const { data: attendee } = await supabase
                .from('attendees')
                .select('name')
                .eq('id', params.attendeeId)
                .single();

            // 3. Get email configuration
            const config = await this.getEmailConfig(params.eventId);

            // 4. Use new template service
            const { emailTemplateService } = await import('../../services/emailTemplateService');

            // Format event dates
            let eventDates = '';
            if (event?.start_date && event?.end_date) {
                const start = new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                const end = new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                eventDates = start === end ? start : `${start} - ${end}`;
            }

            // 5. Render template with all variables
            // Use environment variable for frontend URL (window is not available in Edge Functions)
            const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://lyventum.com';
            const html = await emailTemplateService.getCompleteTemplate(
                params.eventId,
                'access_code',
                {
                    ACCESS_CODE: params.code,
                    ATTENDEE_NAME: attendee?.name || 'Attendee',
                    EVENT_NAME: event?.name || config.companyName,
                    EVENT_LOGO_URL: config.companyLogo || '',
                    LOGIN_URL: `${FRONTEND_URL}/attendee/login?code=${params.code}`,
                    EVENT_DATES: eventDates,
                    EVENT_VENUE: event?.venue || '',
                    SUPPORT_EMAIL: config.fromEmail || 'lyventum@gmail.com',
                }
            );

            // 6. Send via Edge Function
            const { data: result, error: fnError } = await supabase.functions.invoke('send-email', {
                body: {
                    type: params.attendeeId.startsWith('test') ? 'test' : 'access_code',
                    recipientEmail: params.recipientEmail,
                    code: params.code,
                    html,
                    eventId: params.eventId
                }
            });

            const success = !fnError && !result?.error;
            const error = fnError || (result?.error ? { message: result.error } : null);
            const resendEmailId = result?.emailId; // NEW: Get email ID from Edge Function

            // 7. Create tracking record if email sent successfully
            if (success && resendEmailId) {
                try {
                    const { emailTrackingService } = await import('../../services/emailTrackingService');

                    // Find the access_code_id
                    const { data: accessCodeData } = await supabase
                        .from('attendee_access_codes')
                        .select('id')
                        .eq('code', params.code)
                        .eq('attendee_id', params.attendeeId)
                        .eq('event_id', params.eventId)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (accessCodeData) {
                        await emailTrackingService.createTracking({
                            attendeeId: params.attendeeId,
                            eventId: params.eventId,
                            accessCodeId: accessCodeData.id,
                            resendEmailId: resendEmailId,
                        });
                        console.log('[EmailService] Tracking record created for:', resendEmailId);
                    }
                } catch (trackingError) {
                    console.error('[EmailService] Failed to create tracking:', trackingError);
                    // Don't fail the email send if tracking fails
                }
            }

            // 8. Log email
            await supabase.from('email_logs').insert({
                event_id: params.eventId,
                attendee_id: params.attendeeId,
                template_type: 'access_code',
                recipient_email: params.recipientEmail,
                subject: `Access Code for ${event?.name || config.companyName}`,
                status: success ? 'sent' : 'failed',
                error_message: error?.message,
                metadata: { code: params.code },
                resend_email_id: resendEmailId, // NEW: Store Resend ID
            });

            if (error) {
                console.error('Error sending access code email:', error);
                return { success: false, error: error.message };
            }

            console.log('[EmailService] Access code email sent successfully with template');
            return { success: true };

        } catch (error: any) {
            console.error('Exception in sendAccessCode:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Build access code email HTML (temporary until template is created)
     */
    private buildAccessCodeEmailHTML(params: {
        code: string;
        attendeeName?: string;
        companyLogo?: string;
        companyName: string;
        sponsorLogo?: string;
        sponsorName?: string;
        sponsorWebsite?: string;
        showSponsor: boolean;
    }): string {
        const formattedCode = params.code.split('').join(' ');

        // Build direct access link
        const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
        const accessLink = `${FRONTEND_URL}/attendee/login?code=${params.code}`;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                ${params.companyLogo
                ? `<img src="${params.companyLogo}" alt="${params.companyName}" style="max-height: 60px; max-width: 250px;">`
                : `<h1 style="font-size: 28px; font-weight: bold; color: #ffffff; margin: 0;">${params.companyName}</h1>`
            }
            </td>
        </tr>
        ${params.showSponsor && params.sponsorLogo ? `
        <tr>
            <td style="background-color: #f8f9fa; padding: 15px 20px; text-align: center; border-bottom: 1px solid #e9ecef;">
                <p style="font-size: 10px; font-weight: 600; color: #6c757d; letter-spacing: 1px; margin: 0 0 8px 0;">SPONSORED BY</p>
                <img src="${params.sponsorLogo}" alt="${params.sponsorName || 'Sponsor'}" style="max-height: 40px; max-width: 180px;">
            </td>
        </tr>
        ` : ''}
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="font-size: 24px; font-weight: bold; color: #212529; margin-bottom: 20px; text-align: center;">
                    Your Access Code 🎟️
                </h2>
                ${params.attendeeName ? `
                <p style="font-size: 16px; color: #495057; margin-bottom: 15px;">
                    Hi ${params.attendeeName},
                </p>
                ` : ''}
                <p style="font-size: 16px; color: #495057; line-height: 1.5; margin-bottom: 30px; text-align: center;">
                    Use this code to access your personalized event portal:
                </p>
                <div style="background-color: #667eea; padding: 40px 30px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                    <p style="font-size: 56px; font-weight: bold; color: #ffffff; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace;">
                        ${formattedCode}
                    </p>
                </div>
                
                <!-- Direct Access Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${accessLink}" 
                       style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s;">
                        🚀 ACCESS NOW →
                    </a>
                    <p style="font-size: 13px; color: #6c757d; margin-top: 15px;">
                        Click the button above for instant access
                    </p>
                </div>
                
                <div style="font-size: 15px; color: #495057; line-height: 1.8; margin-top: 30px; text-align: center; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <strong>Or copy your code:</strong><br/>
                    Enter <strong>${formattedCode}</strong> at lyventum.com/access
                </div>
                <p style="font-size: 13px; color: #6c757d; margin-top: 30px; line-height: 1.5; text-align: center;">
                    This code is valid for the entire event duration.<br/>
                    If you didn't request this code, you can safely ignore it.
                </p>
            </td>
        </tr>
        ${params.showSponsor && params.sponsorWebsite ? `
        <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="font-size: 12px; color: #6c757d; margin: 0 0 8px 0;">Thank you to our sponsors</p>
                <a href="${params.sponsorWebsite}" style="font-size: 14px; color: #667eea; text-decoration: none; font-weight: 600;">
                    Visit ${params.sponsorName} →
                </a>
            </td>
        </tr>
        ` : ''}
        <tr>
            <td style="background-color: #212529; padding: 20px; text-align: center;">
                <p style="font-size: 12px; color: #adb5bd; line-height: 1.5; margin: 0;">
                    © 2025 LyVenTum. All rights reserved.<br/>
                    Powered by LyVenTum Event Management
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Get email configuration for specific event
     */
    private async getEmailConfig(eventId: string): Promise<EmailConfig> {
        const { data: event } = await supabase
            .from('events')
            .select('name, event_logo_url')
            .eq('id', eventId)
            .maybeSingle();

        const { data: prefs } = await supabase
            .from('email_preferences')
            .select('*')
            .eq('event_id', eventId)
            .maybeSingle();

        const { data: sponsor } = await supabase
            .from('booths')
            .select('company_name, sponsor_logo_url, sponsor_website_url')
            .eq('event_id', eventId)
            .eq('is_sponsor', true)
            .eq('sponsorship_tier', 'platinum')
            .maybeSingle();

        return {
            companyName: event?.name || 'Event',
            companyLogo: event?.event_logo_url,
            sponsorLogo: sponsor?.sponsor_logo_url,
            sponsorName: sponsor?.company_name,
            sponsorWebsite: sponsor?.sponsor_website_url,
            showSponsor: (prefs?.magic_link_show_sponsor ?? true) && !!sponsor,
            fromEmail: prefs?.from_email || 'onboarding@resend.dev',
            fromName: prefs?.from_name || 'Event Team',
        };
    }

    /**
     * Get default email config when no event is specified
     */
    private async getDefaultEmailConfig(): Promise<EmailConfig> {
        return {
            companyName: 'LyVenTum',
            companyLogo: undefined,
            sponsorLogo: undefined,
            sponsorName: undefined,
            sponsorWebsite: undefined,
            showSponsor: false,
            fromEmail: 'onboarding@resend.dev',
            fromName: 'LyVenTum Events',
        };
    }

    /**
     * Log email send to database
     */
    private async logEmail(params: {
        eventId: string;
        templateType: string;
        recipientEmail: string;
        status: string;
        errorMessage?: string;
    }): Promise<void> {
        try {
            await supabase.from('email_logs').insert({
                event_id: params.eventId,
                template_type: params.templateType,
                recipient_email: params.recipientEmail,
                subject: `Magic Link for ${params.recipientEmail}`,
                status: params.status,
                error_message: params.errorMessage,
            });
        } catch (error: any) {
            console.error('Error logging email:', error);
        }
    }
}

export const emailService = new EmailService();
