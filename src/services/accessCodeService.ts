import { supabase } from '../supabaseClient';

export interface AccessCodeResult {
    success: boolean;
    message: string;
    code?: string;
}

export interface CodeValidationResult {
    valid: boolean;
    attendeeId?: string;
    eventId?: string;
    email?: string;
    attendeeName?: string;
    organization?: string;
    error?: string;
}

export class AccessCodeService {
    /**
     * Genera código de 6 dígitos único
     */
    private async generateUniqueCode(): Promise<string> {
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            // Generar código aleatorio de 6 dígitos
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // Verificar si es único
            const { data, error } = await supabase
                .from('attendee_access_codes')
                .select('id')
                .eq('code', code)
                .maybeSingle();

            if (error) {
                console.error('Error checking code uniqueness:', error);
                attempts++;
                continue;
            }

            if (!data) {
                return code; // Código único encontrado
            }

            attempts++;
        }

        throw new Error('Could not generate unique code after 10 attempts');
    }

    /**
     * Invalida códigos antiguos del mismo attendee-evento
     */
    private async invalidateOldCodes(attendeeId: string, eventId: string): Promise<void> {
        const { error } = await supabase
            .from('attendee_access_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('attendee_id', attendeeId)
            .eq('event_id', eventId)
            .is('used_at', null);

        if (error) {
            console.error('Error invalidating old codes:', error);
            // No lanzar error, continuar
        }
    }

    /**
   * Get event end date for expiration calculation
   */
    private async getEventEndDate(eventId: string): Promise<Date> {
        const { data: event } = await supabase
            .from('events')
            .select('end_date')
            .eq('id', eventId)
            .single();

        if (event?.end_date) {
            // Add 1 day buffer after event ends
            const endDate = new Date(event.end_date);
            endDate.setDate(endDate.getDate() + 1);
            return endDate;
        }

        // Default: 30 days from now if no end date
        const defaultExpiration = new Date();
        defaultExpiration.setDate(defaultExpiration.getDate() + 30);
        return defaultExpiration;
    }

    /**
     * Creates and sends access code via email
     */
    async createAndSendCode(params: {
        email: string;
        attendeeId: string;
        eventId: string;
    }): Promise<AccessCodeResult> {
        try {
            // 1. Check if already has active code
            const existing = await this.getCurrentCode(params.attendeeId, params.eventId);
            if (existing.code && existing.expiresAt) {
                const expiresAt = new Date(existing.expiresAt);
                if (expiresAt > new Date()) {
                    // Reuse existing code - just resend email
                    const { emailService } = await import('../emails/services/emailService');
                    await emailService.sendAccessCode({
                        recipientEmail: params.email,
                        code: existing.code,
                        eventId: params.eventId,
                        attendeeId: params.attendeeId,
                    });
                    // console.log('Email sending temporarily disabled');

                    return {
                        success: true,
                        message: 'Access code sent! Check your email.',
                        code: existing.code,
                    };
                }
            }

            // 2. Invalidar códigos antiguos
            await this.invalidateOldCodes(params.attendeeId, params.eventId);

            // 3. Generar código único
            const code = await this.generateUniqueCode();

            // 4. Calcular expiración basada en fin del evento
            const expiresAt = await this.getEventEndDate(params.eventId);

            // 5. Guardar en DB con expiración correcta
            const { error: dbError } = await supabase
                .from('attendee_access_codes')
                .insert({
                    code,
                    email: params.email,
                    attendee_id: params.attendeeId,
                    event_id: params.eventId,
                    expires_at: expiresAt.toISOString(),
                });

            if (dbError) {
                console.error('Error saving code:', dbError);
                throw new Error('Failed to save access code');
            }

            // 6. Enviar email via Resend
            const { emailService } = await import('../emails/services/emailService');

            const emailResult = await emailService.sendAccessCode({
                recipientEmail: params.email,
                code,
                eventId: params.eventId,
                attendeeId: params.attendeeId,
            });
            // const emailResult = { success: true, error: undefined };
            // console.log('Email sending temporarily disabled');

            if (!emailResult.success) {
                throw new Error(emailResult.error || 'Failed to send email');
            }

            return {
                success: true,
                message: 'Access code sent! Check your email.',
                code,
            };
        } catch (error: any) {
            console.error('Error in createAndSendCode:', error);
            return {
                success: false,
                message: error.message || 'Failed to send access code',
            };
        }
    }

    /**
     * Valida código y retorna info del attendee
     */
    async validateCode(code: string): Promise<CodeValidationResult> {
        try {
            // 1. Buscar código en DB con info del attendee
            const { data, error } = await supabase
                .from('attendee_access_codes')
                .select(`
          *,
          attendees (
            id,
            name,
            email,
            organization
          )
        `)
                .eq('code', code)
                .maybeSingle();

            if (error) {
                console.error('Error validating code:', error);
                return { valid: false, error: 'Database error' };
            }

            if (!data) {
                return { valid: false, error: 'Invalid code' };
            }

            // 2. Verificar si ya fue usado
            if (data.used_at) {
                return { valid: false, error: 'Code already used' };
            }

            // 3. Verificar si expiró
            const expiresAt = new Date(data.expires_at);
            if (expiresAt < new Date()) {
                return { valid: false, error: 'Code expired' };
            }

            // 4. Marcar como usado
            const { error: updateError } = await supabase
                .from('attendee_access_codes')
                .update({ used_at: new Date().toISOString() })
                .eq('code', code);

            if (updateError) {
                console.error('Error marking code as used:', updateError);
                // No bloquear el login por esto
            }

            // DEBUG: Ver qué retorna el query
            console.log('[validateCode] Raw data from query:', {
                code: data.code,
                attendee_id: data.attendee_id,
                attendees: data.attendees,
                email: data.email
            });

            // 5. Retornar info del attendee
            return {
                valid: true,
                attendeeId: data.attendee_id,
                eventId: data.event_id,
                email: data.email,
                attendeeName: data.attendees?.name,
                organization: data.attendees?.organization,
            };
        } catch (error: any) {
            console.error('Exception in validateCode:', error);
            return { valid: false, error: 'Validation failed' };
        }
    }

    /**
     * Obtiene código actual de un attendee (si existe y es válido)
     */
    async getCurrentCode(attendeeId: string, eventId: string): Promise<{
        code?: string;
        expiresAt?: string;
        status?: 'active' | 'expired' | 'used' | 'none';
    }> {
        const { data } = await supabase
            .from('attendee_access_codes')
            .select('code, expires_at, used_at')
            .eq('attendee_id', attendeeId)
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!data) {
            return { status: 'none' };
        }

        const now = new Date();
        const expires = new Date(data.expires_at);

        let status: 'active' | 'expired' | 'used' = 'active';
        if (data.used_at) {
            status = 'used';
        } else if (expires < now) {
            status = 'expired';
        }

        return {
            code: data.code,
            expiresAt: data.expires_at,
            status,
        };
    }

    /**
     * Obtiene historial de códigos de un attendee para un evento
     */
    async getCodeHistory(attendeeId: string, eventId: string): Promise<Array<{
        code: string;
        createdAt: string;
        expiresAt: string;
        usedAt: string | null;
        status: 'active' | 'expired' | 'used';
    }>> {
        const { data } = await supabase
            .from('attendee_access_codes')
            .select('code, created_at, expires_at, used_at')
            .eq('attendee_id', attendeeId)
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!data) return [];

        const now = new Date();

        return data.map(item => {
            const expires = new Date(item.expires_at);
            let status: 'active' | 'expired' | 'used' = 'active';

            if (item.used_at) {
                status = 'used';
            } else if (expires < now) {
                status = 'expired';
            }

            return {
                code: item.code,
                createdAt: item.created_at,
                expiresAt: item.expires_at,
                usedAt: item.used_at,
                status,
            };
        });
    }

    /**
     * Genera y envía códigos en masa
     */
    async bulkCreateAndSendCodes(attendees: Array<{
        attendeeId: string;
        email: string;
        eventId: string;
    }>): Promise<{
        success: number;
        failed: number;
        errors: Array<{ email: string; error: string }>;
    }> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ email: string; error: string }>,
        };

        for (const attendee of attendees) {
            const result = await this.createAndSendCode(attendee);

            if (result.success) {
                results.success++;
            } else {
                results.failed++;
                results.errors.push({
                    email: attendee.email,
                    error: result.message,
                });
            }
        }

        return results;
    }
}

export const accessCodeService = new AccessCodeService();
