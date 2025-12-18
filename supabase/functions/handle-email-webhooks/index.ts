import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const event = await req.json()

        console.log('[Webhook] Received:', event.type, event.data?.email_id)

        // LOGGING FOR DEBUGGING
        await supabase.from('webhook_debug_logs').insert({
            event_type: event.type,
            payload: event
        });

        const emailId = event.data?.email_id
        if (!emailId) {
            console.log('[Webhook] No email_id in event')
            return new Response(
                JSON.stringify({ error: 'No email_id' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Helper to find tracking records
        const findTrackingRecords = async () => {
            const [imeResult, logResult] = await Promise.all([
                supabase.from('ime_email_tracking').select('*').eq('resend_email_id', emailId).maybeSingle(),
                supabase.from('email_logs').select('*').eq('resend_email_id', emailId).maybeSingle()
            ])
            return { ime: imeResult.data, log: logResult.data }
        }

        let { ime: imeTracking, log: emailLog } = await findTrackingRecords()

        // RETRY LOGIC: If not found, wait and try again (handling client-side race condition)
        if (!imeTracking && !emailLog) {
            console.log('[Webhook] Record not found, retrying in 1500ms...')
            await new Promise(resolve => setTimeout(resolve, 1500))
            const retry1 = await findTrackingRecords()
            imeTracking = retry1.ime
            emailLog = retry1.log

            if (!imeTracking && !emailLog) {
                console.log('[Webhook] Still not found, retrying in 2000ms...')
                await new Promise(resolve => setTimeout(resolve, 2000))
                const retry2 = await findTrackingRecords()
                imeTracking = retry2.ime
                emailLog = retry2.log
            }
        }

        if (!imeTracking && !emailLog) {
            console.log('[Webhook] Tracking ABSOLUTELY not found for:', emailId)
            // Store in debug logs that we failed to find it
            await supabase.from('webhook_debug_logs').insert({
                event_type: 'error_missing_record',
                payload: { email_id: emailId, original_event: event }
            });

            return new Response(
                JSON.stringify({ ok: true, message: 'Tracking not found in any table after retries' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const now = new Date().toISOString()

        // Helper to prepare updates for a specific record
        const getUpdates = (record: any) => {
            let updates: any = {}
            if (record.updated_at !== undefined) updates.updated_at = now

            // Determine if we should update the status
            // Priority: failed > clicked > opened > delivered > sent
            const currentStatus = record.status;
            const isRegressing = (newStatus: string) => {
                if (currentStatus === 'failed') return true; // Failed is terminal
                if (currentStatus === 'clicked' && (newStatus === 'opened' || newStatus === 'delivered')) return true;
                if (currentStatus === 'opened' && newStatus === 'delivered') return true;
                return false;
            };

            switch (event.type) {
                case 'email.delivered':
                    updates.delivered_at = now
                    if (!isRegressing('delivered')) {
                        updates.status = 'delivered'
                    }
                    break

                case 'email.bounced':
                case 'email.delivery_delayed':
                    updates.delivery_failed_at = now
                    updates.delivery_error = event.data?.error || 'Email bounced or delivery failed'
                    updates.status = 'failed' // Failed always overrides
                    break

                case 'email.opened':
                    const isFirstOpen = !record.opened_at
                    updates.open_count = (record.open_count || 0) + 1
                    updates.last_opened_at = now
                    if (isFirstOpen) {
                        updates.opened_at = now
                        if (!isRegressing('opened')) {
                            updates.status = 'opened'
                        }
                    }
                    break

                case 'email.clicked':
                    const isFirstClick = !record.first_click_at
                    updates.click_count = (record.click_count || 0) + 1
                    updates.last_clicked_at = now
                    if (isFirstClick) {
                        updates.first_click_at = now
                        if (!isRegressing('clicked')) {
                            updates.status = 'clicked'
                        }
                    }
                    break
            }
            return updates
        }

        const updatesPromises = []

        // Update ime_email_tracking if found
        if (imeTracking) {
            const updates = getUpdates({ ...imeTracking, status: imeTracking.status || 'sent' }) // Ensure status exists for check
            // ime_email_tracking schema might not keep 'status' column in sync or might not have it, 
            // but for logic we used it. If table doesn't have 'status' column, exclude it.
            // Based on previous files, ime_email_tracking DOES NOT have a status column in schema definition usually, 
            // it's derived. BUT email_logs DOES.
            // Let's check if we should try to update status on ime_email_tracking.
            // If the schema doesn't have it, valid. Let's assume it doesn't for safety unless we verified schema.
            // However, previous code was filtering it out: "delete updates.status"

            delete updates.status // Remove status from update payload for ime_email_tracking

            updatesPromises.push(
                supabase.from('ime_email_tracking').update(updates).eq('id', imeTracking.id)
            )
        }

        // Update email_logs if found
        if (emailLog) {
            const updates = getUpdates(emailLog)
            updatesPromises.push(
                supabase.from('email_logs').update(updates).eq('id', emailLog.id)
            )
        }

        await Promise.all(updatesPromises)

        console.log(`[Webhook] Processed ${event.type} for ${emailId}.`)

        return new Response(
            JSON.stringify({ ok: true, updated: { ime: !!imeTracking, log: !!emailLog } }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('[Webhook] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
