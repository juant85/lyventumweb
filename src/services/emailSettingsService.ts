import { supabase } from '../supabaseClient';

export interface EmailSettings {
    id?: string;
    event_id: string;
    session_reminders_enabled: boolean;
    session_reminder_minutes: number;
    session_reminder_subject: string;
    daily_agenda_enabled: boolean;
    daily_agenda_time: string;
    daily_agenda_timezone: string;
    daily_agenda_subject: string;
    from_name: string;
    from_email: string;
    reply_to_email?: string;
    vendor_email_enabled?: boolean;
    vendor_email_subject?: string;
    vendor_email_template?: string;
    vendor_from_name?: string;
    vendor_from_email?: string;
    created_at?: string;
    updated_at?: string;
}

export const emailSettingsService = {
    /**
     * Get email settings for an event
     */
    async getSettings(eventId: string): Promise<EmailSettings | null> {
        const { data, error } = await supabase
            .from('email_settings')
            .select('*')
            .eq('event_id', eventId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('[EmailSettings] Error fetching settings:', error);
            throw error;
        }

        return data;
    },

    /**
     * Create or update email settings for an event
     */
    async upsertSettings(settings: Partial<EmailSettings> & { event_id: string }): Promise<EmailSettings> {
        const { data, error } = await supabase
            .from('email_settings')
            .upsert(settings, { onConflict: 'event_id' })
            .select()
            .single();

        if (error) {
            console.error('[EmailSettings] Error upserting settings:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update specific fields of email settings
     */
    async updateSettings(
        eventId: string,
        updates: Partial<Omit<EmailSettings, 'id' | 'event_id' | 'created_at' | 'updated_at'>>
    ): Promise<EmailSettings> {
        const { data, error } = await supabase
            .from('email_settings')
            .update(updates)
            .eq('event_id', eventId)
            .select()
            .single();

        if (error) {
            console.error('[EmailSettings] Error updating settings:', error);
            throw error;
        }

        return data;
    },

    /**
     * Initialize default settings for an event if they don't exist
     */
    async initializeDefaults(eventId: string): Promise<EmailSettings> {
        const existing = await this.getSettings(eventId);

        if (existing) {
            return existing;
        }

        const defaults: Partial<EmailSettings> & { event_id: string } = {
            event_id: eventId,
            session_reminders_enabled: false,
            session_reminder_minutes: 15,
            session_reminder_subject: 'Reminder: {{session_name}} starts in 15 minutes',
            daily_agenda_enabled: false,
            daily_agenda_time: '18:00:00',
            daily_agenda_timezone: 'America/Chicago',
            daily_agenda_subject: 'Your Agenda for Tomorrow - {{date}}',
            from_name: 'LyVentum Events',
            from_email: 'lyventum@gmail.com',
        };

        return this.upsertSettings(defaults);
    },
};
