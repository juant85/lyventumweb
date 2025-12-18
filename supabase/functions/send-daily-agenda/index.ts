import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderTemplate, loadSponsors, getDailyAgendaTemplate } from '../_shared/template-helpers.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to generate Google Calendar link
function generateGoogleCalendarLink(params: {
    name: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
}): string {
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        const seconds = String(d.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };

    const start = formatDate(params.startTime);
    const end = formatDate(params.endTime);

    const urlParams = new URLSearchParams({
        action: 'TEMPLATE',
        text: params.name,
        dates: `${start}/${end}`,
        details: params.description,
        location: params.location
    });

    return `https://calendar.google.com/calendar/render?${urlParams.toString()}`;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Parse body to check for Test Mode
    let isTest = false;
    let testEmail = '';
    let testEventId = '';

    try {
        const body = await req.json();
        isTest = body.isTest;
        testEmail = body.testEmail;
        testEventId = body.eventId;
    } catch {
        // No body or invalid json, normal scheduled execution
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not configured');
        }

        // --- TEST MODE LOGIC ---
        if (isTest && testEmail && testEventId) {
            console.log(`[DailyAgenda] Running in TEST MODE for ${testEmail}`);

            // Get event details
            const { data: event, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', testEventId)
                .single();

            if (eventError || !event) throw new Error('Test event not found');

            const now = new Date();
            const tomorrow = new Date(now.getTime() + 86400000);

            // Fetch simulated sessions (next valid ones)
            const { data: testSessions } = await supabase
                .from('sessions')
                .select('name, start_time, end_time, description, session_type, location, speaker, booths(company_name)')
                .eq('event_id', testEventId)
                .gte('start_time', now.toISOString())
                .order('start_time', { ascending: true })
                .limit(2);

            const sessions = (testSessions && testSessions.length > 0) ? testSessions : [
                {
                    name: 'Keynote Speech (Test)',
                    start_time: tomorrow.toISOString(),
                    end_time: new Date(tomorrow.getTime() + 3600000).toISOString(),
                    description: 'This is a test session.',
                    session_type: 'presentation',
                    location: 'Main Auditorium',
                    speaker: 'Dr. Jane Smith',
                    booths: { company_name: 'Main Stage' }
                }
            ];

            const sessionsData = sessions.map((s: any) => {
                const durationMs = new Date(s.end_time).getTime() - new Date(s.start_time).getTime();
                const durationMins = Math.floor(durationMs / 60000);
                const hours = Math.floor(durationMins / 60);
                const mins = durationMins % 60;
                const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                return {
                    name: s.name,
                    time: new Date(s.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                    sessionType: s.session_type || 'meeting',
                    booth: s.booths?.company_name || null,
                    location: s.location || s.booths?.company_name || null,
                    speaker: s.speaker || null,
                    duration: durationStr,
                    calendarUrl: generateGoogleCalendarLink({
                        name: s.name,
                        startTime: s.start_time,
                        endTime: s.end_time,
                        location: s.location || s.booths?.company_name || 'Event',
                        description: s.description || ''
                    })
                };
            });

            const sponsors = await loadSponsors(supabase, testEventId);

            const { data: prefs } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('event_id', testEventId)
                .single();

            const fromEmail = prefs?.fromEmail || 'events@lyventum.com';
            const fromName = prefs?.fromName || 'Event Team';

            const template = getDailyAgendaTemplate();
            const emailHtml = renderTemplate(template, {
                ATTENDEE_NAME: 'Test Attendee',
                AGENDA_DATE: tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                SESSION_COUNT: sessions.length,
                SESSIONS: sessionsData,
                AGENDA_URL: `${Deno.env.get('PORTAL_URL') || 'https://app.lyventum.com'}/attendee/agenda`,
                EVENT_NAME: event.name,
                SUPPORT_EMAIL: fromEmail,
                PLATINUM_SPONSOR: sponsors.platinum
            });

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: `${fromName} <${fromEmail.includes('@') ? 'noreply@lyventum.com' : 'noreply@lyventum.com'}>`,
                    reply_to: fromEmail,
                    to: [testEmail],
                    subject: `[TEST] Your Agenda for Tomorrow`,
                    html: emailHtml
                })
            });

            if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);

            return new Response(JSON.stringify({ sent: 1, message: 'Test email sent successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        // --- END TEST MODE LOGIC ---

        // Get all events with daily agenda enabled
        const { data: enabledEvents, error: settingsError } = await supabase
            .from('email_settings')
            .select('event_id, daily_agenda_enabled, daily_agenda_subject, from_name, from_email')
            .eq('daily_agenda_enabled', true);

        if (settingsError) {
            console.error('[DailyAgenda] Settings query error:', settingsError);
            throw settingsError;
        }

        if (!enabledEvents || enabledEvents.length === 0) {
            console.log('[DailyAgenda] No events have daily agenda enabled');
            return new Response(JSON.stringify({ sent: 0, message: 'Daily agenda not enabled for any event' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`[DailyAgenda] Found ${enabledEvents.length} events with daily agenda enabled`);

        // Get tomorrow's date range
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        console.log(`[DailyAgenda] Fetching sessions for ${tomorrow.toISOString()}`);

        const enabledEventIds = enabledEvents.map(e => e.event_id);

        // Get all session registrations for tomorrow (only for enabled events)
        const { data: tomorrowSessions, error: sessionsError } = await supabase
            .from('session_registrations')
            .select(`
        attendee_id,
        event_id,
        attendees!inner(id, name, email),
        sessions!inner(name, start_time, end_time, session_type, location, speaker, description),
        booths(company_name),
        events!inner(id, name, logo_url)
      `)
            .gte('sessions.start_time', tomorrow.toISOString())
            .lt('sessions.start_time', dayAfter.toISOString())
            .in('event_id', enabledEventIds);

        if (sessionsError) {
            console.error('[DailyAgenda] Query error:', sessionsError);
            throw sessionsError;
        }

        console.log(`[DailyAgenda] Found ${tomorrowSessions?.length || 0} session registrations`);

        if (!tomorrowSessions || tomorrowSessions.length === 0) {
            return new Response(JSON.stringify({ sent: 0, message: 'No sessions tomorrow' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Group sessions by attendee
        const attendeeGroups: Record<string, typeof tomorrowSessions> = {};
        tomorrowSessions.forEach(session => {
            const attendeeId = session.attendee_id;
            if (!attendeeGroups[attendeeId]) {
                attendeeGroups[attendeeId] = [];
            }
            attendeeGroups[attendeeId].push(session);
        });

        console.log(`[DailyAgenda] Grouped into ${Object.keys(attendeeGroups).length} attendees`);

        // Get event IDs for sponsor logos
        const eventIds = [...new Set(tomorrowSessions.map(s => s.events.id))];

        // Get sponsor logos
        const { data: sponsors } = await supabase
            .from('booths')
            .select('event_id, sponsor_logo_url')
            .in('event_id', eventIds)
            .not('sponsor_logo_url', 'is', null)
            .limit(5);

        // Group sponsors by event_id
        const sponsorsByEvent: Record<string, string[]> = {};
        sponsors?.forEach(s => {
            if (!sponsorsByEvent[s.event_id]) {
                sponsorsByEvent[s.event_id] = [];
            }
            if (s.sponsor_logo_url) {
                sponsorsByEvent[s.event_id].push(s.sponsor_logo_url);
            }
        });

        let sentCount = 0;
        const errors: string[] = [];

        // Send email to each attendee
        for (const [attendeeId, sessions] of Object.entries(attendeeGroups)) {
            try {
                const attendee = sessions[0].attendees;
                const event = sessions[0].events;
                const eventSettings = enabledEvents.find(e => e.event_id === event.id);

                // Load sponsors for this event
                const sponsors = await loadSponsors(supabase, event.id);

                // Sort sessions by start time
                const sortedSessions = sessions.sort((a, b) =>
                    new Date(a.sessions.start_time).getTime() - new Date(b.sessions.start_time).getTime()
                );

                // Format date
                const agendaDate = tomorrow.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });

                // Format sessions for template
                const formattedSessions = sortedSessions.map(s => {
                    const sessionType = s.sessions.session_type || 'meeting';
                    const isPresentation = sessionType === 'presentation';

                    // For presentations use location/speaker, for meetings use booth
                    const displayLocation = isPresentation
                        ? (s.sessions.location || 'TBD')
                        : (s.booths?.company_name || 'TBD');

                    // Generate Google Calendar link
                    const calendarUrl = generateGoogleCalendarLink({
                        name: s.sessions.name,
                        startTime,
                        endTime,
                        location: displayLocation,
                        description: s.sessions.description || `Session at ${event.name}`
                    });

                    return {
                        name: s.sessions.name,
                        time: new Date(startTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        startTime,  // ISO datetime for calendar links
                        endTime,    // ISO datetime for calendar links
                        sessionType,
                        location: displayLocation,
                        speaker: s.sessions.speaker || null,
                        description: s.sessions.description || null,
                        duration: calculateDuration(startTime, endTime),
                        calendarUrl,  // Pre-generated calendar URL
                        booth: s.booths?.company_name || null,
                        status: null,
                        attended: false
                    };
                });

                // Get template and render
                const template = getDailyAgendaTemplate();
                const emailHtml = renderTemplate(template, {
                    ATTENDEE_NAME: attendee.name,
                    AGENDA_DATE: agendaDate,
                    SESSION_COUNT: sortedSessions.length,
                    MULTIPLE_SESSIONS: sortedSessions.length > 1,
                    SESSIONS: formattedSessions,
                    AGENDA_URL: `${Deno.env.get('PORTAL_URL') || 'https://app.lyventum.com'}/attendee/agenda`,
                    EVENT_NAME: event.name,
                    EVENT_LOGO_URL: event.logo_url || '',
                    SUPPORT_EMAIL: eventSettings?.from_email || 'support@lyventum.com',
                    PLATINUM_SPONSOR: sponsors.platinum,
                    GOLD_SPONSORS: sponsors.gold,
                    SILVER_SPONSORS: sponsors.silver
                });

                // Send via Resend
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'LyVentum Events <noreply@lyventum.com>',
                        to: attendee.email,
                        subject: `Your Agenda for Tomorrow - ${tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                        html: emailHtml
                    })
                });

                if (response.ok) {
                    sentCount++;
                    console.log(`[DailyAgenda] ✓ Sent to ${attendee.email} (${sortedSessions.length} sessions)`);
                } else {
                    const errorData = await response.text();
                    errors.push(`Failed for ${attendee.email}: ${errorData}`);
                    console.error(`[DailyAgenda] ✗ Failed for ${attendee.email}:`, errorData);
                }
            } catch (e) {
                errors.push(`Exception for attendee ${attendeeId}: ${e.message}`);
                console.error(`[DailyAgenda] Exception:`, e);
            }
        }

        return new Response(JSON.stringify({
            sent: sentCount,
            total: Object.keys(attendeeGroups).length,
            errors: errors.length > 0 ? errors : undefined
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[DailyAgenda] Fatal error:', error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function calculateDuration(start: string, end: string): string {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes}min`;
}
