import { supabase } from '../supabaseClient';

export interface EmailTrackingStatus {
    id: string;
    attendeeId: string;
    status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
    sentAt?: string;
    deliveredAt?: string;
    openedAt?: string;
    firstClickAt?: string;
    deliveryFailedAt?: string;
    deliveryError?: string;
    openCount: number;
    clickCount: number;
}

export interface EmailStats {
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    total_failed: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
}

export class EmailTrackingService {
    /**
     * Get aggregate email stats for an event
     */
    async getEmailStats(eventId: string): Promise<EmailStats | null> {
        const { data, error } = await supabase
            .rpc('get_event_email_stats', { p_event_id: eventId });

        if (error) {
            console.error('Error fetching email stats:', error);
            return null;
        }

        // RPC returns an array of one object
        return data && data.length > 0 ? data[0] : null;
    }

    /**
     * Create tracking record when email is sent
     */
    async createTracking(params: {
        attendeeId: string;
        eventId: string;
        accessCodeId: string;
        resendEmailId: string;
    }): Promise<{ success: boolean; trackingId?: string }> {
        try {
            const { data, error } = await supabase
                .from('ime_email_tracking')
                .insert({
                    attendee_id: params.attendeeId,
                    event_id: params.eventId,
                    access_code_id: params.accessCodeId,
                    resend_email_id: params.resendEmailId,
                    sent_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (error) throw error;

            return { success: true, trackingId: data.id };
        } catch (error: any) {
            console.error('Error creating tracking:', error);
            return { success: false };
        }
    }

    /**
     * Get tracking status for an attendee
     */
    async getTrackingStatus(attendeeId: string, eventId: string): Promise<EmailTrackingStatus | null> {
        const { data, error } = await supabase
            .from('ime_email_tracking')
            .select('*')
            .eq('attendee_id', attendeeId)
            .eq('event_id', eventId)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;

        // Determine status based on timestamps
        let status: EmailTrackingStatus['status'] = 'sent';
        if (data.delivery_failed_at) status = 'failed';
        else if (data.first_click_at) status = 'clicked';
        else if (data.opened_at) status = 'opened';
        else if (data.delivered_at) status = 'delivered';

        return {
            id: data.id,
            attendeeId: data.attendee_id,
            status,
            sentAt: data.sent_at,
            deliveredAt: data.delivered_at,
            openedAt: data.opened_at,
            firstClickAt: data.first_click_at,
            deliveryFailedAt: data.delivery_failed_at,
            deliveryError: data.delivery_error,
            openCount: data.open_count || 0,
            clickCount: data.click_count || 0,
        };
    }

    /**
     * Get bulk tracking for multiple attendees
     */
    async getBulkTrackingStatus(eventId: string): Promise<Map<string, EmailTrackingStatus>> {
        const { data, error } = await supabase
            .from('ime_email_tracking')
            .select('*')
            .eq('event_id', eventId)
            .order('sent_at', { ascending: false });

        if (error || !data) return new Map();

        // Group by attendee (latest email for each)
        const map = new Map<string, EmailTrackingStatus>();

        for (const record of data) {
            if (!map.has(record.attendee_id)) {
                let status: EmailTrackingStatus['status'] = 'sent';
                if (record.delivery_failed_at) status = 'failed';
                else if (record.first_click_at) status = 'clicked';
                else if (record.opened_at) status = 'opened';
                else if (record.delivered_at) status = 'delivered';

                map.set(record.attendee_id, {
                    id: record.id,
                    attendeeId: record.attendee_id,
                    status,
                    sentAt: record.sent_at,
                    deliveredAt: record.delivered_at,
                    openedAt: record.opened_at,
                    firstClickAt: record.first_click_at,
                    deliveryFailedAt: record.delivery_failed_at,
                    deliveryError: record.delivery_error,
                    openCount: record.open_count || 0,
                    clickCount: record.click_count || 0,
                });
            }
        }

        return map;
    }

    /**
     * Get comprehensive email history for an attendee
     * Queries the email_logs table which tracks all email types
     */
    async getEmailHistory(attendeeId: string, eventId: string): Promise<any[]> {
        // Fetch both tables separately to perform robust manual merging
        // This handles cases where foreign keys are missing or data is not perfectly linked
        const [logsResult, trackingResult] = await Promise.all([
            supabase
                .from('email_logs')
                .select('*')
                .eq('attendee_id', attendeeId)
                .eq('event_id', eventId)
                .order('sent_at', { ascending: false }),
            supabase
                .from('ime_email_tracking')
                .select('*')
                .eq('attendee_id', attendeeId)
                .eq('event_id', eventId)
        ]);

        if (logsResult.error) {
            console.error('Error fetching email logs:', logsResult.error);
            return [];
        }

        const logs = logsResult.data || [];
        const trackings = trackingResult.data || [];

        return logs.map(log => {
            // Find best matching tracking record
            let match = null;

            // Strategy 1: Direct Foreign Key Match
            if (log.tracking_id) {
                match = trackings.find(t => t.id === log.tracking_id);
            }

            // Strategy 2: Resend Email ID Match (if FK missing)
            if (!match && log.resend_email_id) {
                match = trackings.find(t => t.resend_email_id === log.resend_email_id);
            }

            // Strategy 3: Fuzzy Timestamp Match (legacy fallback)
            // If log is 'access_code' type, try to find a tracking record sent within 1 minute
            // that hasn't been matched yet (optimization skipped for simplicity, but acceptable for typical volumes)
            if (!match && (log.template_type === 'access_code' || log.subject?.toLowerCase().includes('access code'))) {
                const logTime = new Date(log.sent_at).getTime();
                match = trackings.find(t => {
                    const trackingTime = new Date(t.sent_at).getTime();
                    const diff = Math.abs(logTime - trackingTime);
                    return diff < 60000; // within 60 seconds
                });
            }

            // Merge data if match found
            const tracking = match;

            const deliveredAt = log.delivered_at || tracking?.delivered_at;
            const openedAt = log.opened_at || tracking?.opened_at;
            const firstClickAt = log.first_click_at || tracking?.first_click_at;
            const deliveryFailedAt = log.delivery_failed_at || tracking?.delivery_failed_at;
            const deliveryError = log.delivery_error || tracking?.delivery_error || log.error_message;
            const openCount = Math.max(log.open_count || 0, tracking?.open_count || 0);
            const clickCount = Math.max(log.click_count || 0, tracking?.click_count || 0);

            // Re-derive status with merged data
            const status = this.deriveStatus({
                status: log.status,
                delivered_at: deliveredAt,
                opened_at: openedAt,
                first_click_at: firstClickAt,
                delivery_failed_at: deliveryFailedAt
            });

            return {
                id: log.id,
                eventId: log.event_id,
                attendeeId: log.attendee_id,
                templateType: log.template_type,
                recipientEmail: log.recipient_email,
                subject: log.subject,
                status,
                sentAt: log.sent_at,
                deliveredAt,
                openedAt,
                firstClickAt,
                deliveryFailedAt,
                deliveryError,
                openCount,
                clickCount,
            };
        });
    }

    /**
     * Helper to derive a single status string from timestamps
     */
    private deriveStatus(log: any): 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' {
        if (log.delivery_failed_at || log.status === 'failed' || log.status === 'bounced') return 'failed';
        if (log.first_click_at) return 'clicked';
        if (log.opened_at) return 'opened';
        if (log.delivered_at) return 'delivered';
        return 'sent';
    }
    /**
     * Resend an email based on a previous log
     * Creates a NEW email log entry and tracking record
     */
    async resendEmail(log: any): Promise<{ success: boolean; message?: string }> {
        try {
            if (log.templateType === 'access_code') {
                const { emailService } = await import('../emails/services/emailService');

                // Extract code from metadata or various fallback locations
                let code = log.metadata?.code;

                // If code not in metadata, try to fetch active code for attendee
                if (!code) {
                    const { accessCodeService } = await import('./accessCodeService');
                    const activeCode = await accessCodeService.getCurrentCode(log.attendeeId, log.eventId);
                    if (activeCode.code) {
                        code = activeCode.code;
                    } else {
                        return { success: false, message: 'No valid access code found to resend.' };
                    }
                }

                // Send the email (this handles logging and tracking internally)
                const result = await emailService.sendAccessCode({
                    recipientEmail: log.recipientEmail,
                    code: code,
                    eventId: log.eventId,
                    attendeeId: log.attendeeId
                });

                if (!result.success) {
                    return { success: false, message: result.error };
                }

                return { success: true, message: 'Email resent successfully.' };
            }

            return { success: false, message: 'Resend not supported for this email type.' };
        } catch (error: any) {
            console.error('Error resending email:', error);
            return { success: false, message: error.message };
        }
    }
}

export const emailTrackingService = new EmailTrackingService();
