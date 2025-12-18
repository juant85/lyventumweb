import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { type, recipientEmail, code, eventId, html } = await req.json()

        // Validation
        if (!recipientEmail) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set')
            return new Response(
                JSON.stringify({ error: 'Server configuration error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'LyVentum <noreply@lyventum.com>', // Update this if you have a verified domain
                to: [recipientEmail],
                subject: type === 'test' ? 'Test Access Code' : 'Your Access Code',
                html: html,
            }),
        })

        if (!resendResponse.ok) {
            const error = await resendResponse.text()
            console.error('Resend API Error:', error)
            throw new Error(`Resend error: ${error}`)
        }

        const result = await resendResponse.json()

        // Extract email ID for tracking
        const emailId = result.id // Resend returns { id: "xxx", ... }

        return new Response(
            JSON.stringify({
                success: true,
                data: result,
                emailId: emailId // Return ID for tracking record creation
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )

    } catch (error: any) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
