// Supabase Edge Function: create-organizer
// Handles creation of new organizer users with proper authentication and profiles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Parse request body
        const { email, username, autoAssignToEvent, createdBy } = await req.json()

        // Validate required fields
        if (!email || !username || !createdBy) {
            return new Response(
                JSON.stringify({
                    error: 'Missing required fields: email, username, and createdBy are required'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // 1. Verify requester is superadmin
        console.log('[create-organizer] Verifying superadmin permissions for:', createdBy)

        const { data: requesterProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, username')
            .eq('user_id', createdBy)
            .single()

        if (profileError || !requesterProfile) {
            console.error('[create-organizer] Profile fetch error:', profileError)
            throw new Error('Could not verify user permissions')
        }

        if (requesterProfile.role !== 'superadmin') {
            console.error('[create-organizer] Unauthorized attempt by:', requesterProfile.role)
            return new Response(
                JSON.stringify({ error: 'Unauthorized. Only SuperAdmins can create organizers.' }),
                {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log('[create-organizer] SuperAdmin verified:', requesterProfile.username)

        // 2. Check if user already exists
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) {
            console.error('[create-organizer] Error listing users:', listError)
            throw new Error('Failed to check existing users')
        }

        const existingUser = users.find(u => u.email === email)

        if (existingUser) {
            console.warn('[create-organizer] User already exists:', email)
            return new Response(
                JSON.stringify({
                    error: 'User with this email already exists',
                    suggestion: 'Search for this user and assign them to the event instead'
                }),
                {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // 3. Create user in Supabase Auth (WITHOUT password)
        console.log('[create-organizer] Creating auth user for:', email)

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                username: username
            }
        })

        if (authError || !authData.user) {
            console.error('[create-organizer] Auth creation failed:', authError)
            throw new Error(`Failed to create user: ${authError?.message || 'Unknown error'}`)
        }

        console.log('[create-organizer] Auth user created:', authData.user.id)

        // 4. Create profile record
        console.log('[create-organizer] Creating profile for user:', authData.user.id)

        const { error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                user_id: authData.user.id,
                username: username,
                role: 'organizer'
            })

        if (profileInsertError) {
            console.error('[create-organizer] Profile creation failed:', profileInsertError)

            // Rollback: Delete auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

            throw new Error(`Profile creation failed: ${profileInsertError.message}`)
        }

        console.log('[create-organizer] Profile created successfully')

        // 5. Auto-assign to event if specified
        let eventData = null
        if (autoAssignToEvent) {
            console.log('[create-organizer] Auto-assigning to event:', autoAssignToEvent)

            // Fetch event details
            const { data: event, error: eventError } = await supabaseAdmin
                .from('events')
                .select('name, location, start_date, end_date')
                .eq('id', autoAssignToEvent)
                .single()

            if (!eventError && event) {
                eventData = event

                // Create event_users record
                const { error: assignError } = await supabaseAdmin
                    .from('event_users')
                    .insert({
                        event_id: autoAssignToEvent,
                        user_id: authData.user.id,
                        role: 'organizer',
                        assigned_by: createdBy
                    })

                if (assignError) {
                    console.error('[create-organizer] Event assignment failed:', assignError)
                    // Don't fail the whole operation, just log it
                } else {
                    console.log('[create-organizer] Assigned to event successfully')
                }
            }
        }

        // 6. Generate password recovery link
        console.log('[create-organizer] Generating password setup link')

        const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173'

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${APP_URL}/set-password`
            }
        })

        if (linkError || !linkData) {
            console.error('[create-organizer] Link generation failed:', linkError)
            throw new Error('Failed to generate password setup link')
        }

        const passwordSetupLink = linkData.properties.action_link

        console.log('[create-organizer] Password setup link generated')

        // 7. Send welcome email (if RESEND_API_KEY is configured)
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

        if (RESEND_API_KEY) {
            console.log('[create-organizer] Sending welcome email to:', email)

            try {
                // Create email HTML
                const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LyVentum! 🎉</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${username}</strong>,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                You've been added as an <strong>Organizer</strong> to the LyVentum platform by <strong>${requesterProfile.username}</strong>.
              </p>
              
              <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #667eea;">Quick Start Guide:</p>
                <ol style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Click the button below to set your password</li>
                  <li style="margin-bottom: 8px;">Create a secure password (at least 8 characters)</li>
                  <li style="margin-bottom: 8px;">You'll be automatically logged in to your dashboard</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${passwordSetupLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; 
                          font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Set My Password →
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 20px 0;">
                ⏰ This link expires in 24 hours
              </p>

              ${eventData ? `
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">📅 You've been assigned to:</p>
                  <p style="margin: 0; font-size: 18px; color: #1e40af; font-weight: bold;">${eventData.name}</p>
                  ${eventData.location ? `<p style="margin: 5px 0 0 0; color: #3b82f6;">📍 ${eventData.location}</p>` : ''}
                  ${eventData.start_date && eventData.end_date ? `
                    <p style="margin: 5px 0 0 0; color: #3b82f6;">
                      📆 ${new Date(eventData.start_date).toLocaleDateString()} - ${new Date(eventData.end_date).toLocaleDateString()}
                    </p>
                  ` : ''}
                </div>
              ` : ''}

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
                Need help? Reply to this email or contact 
                <a href="mailto:support@lyventum.com" style="color: #667eea; text-decoration: none;">support@lyventum.com</a>
              </p>
            </div>
          </body>
          </html>
        `

                const emailText = `
Welcome to LyVentum!

Hi ${username},

You've been added as an Organizer by ${requesterProfile.username}.

To get started:
1. Set your password: ${passwordSetupLink}
2. Create a secure password (at least 8 characters)
3. You'll be automatically logged in

This link expires in 24 hours.

${eventData ? `
You've been assigned to: ${eventData.name}
${eventData.location ? `Location: ${eventData.location}` : ''}
${eventData.start_date && eventData.end_date ? `Dates: ${new Date(eventData.start_date).toLocaleDateString()} - ${new Date(eventData.end_date).toLocaleDateString()}` : ''}
` : ''}

Need help? Contact support@lyventum.com
        `

                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'LyVentum <noreply@lyventum.com>',
                        to: email,
                        subject: 'Welcome to LyVentum - Set Your Password',
                        html: emailHtml,
                        text: emailText
                    })
                })

                if (!resendResponse.ok) {
                    const errorText = await resendResponse.text()
                    console.error('[create-organizer] Resend failed:', errorText)
                    // Don't fail the whole operation if email fails
                } else {
                    console.log('[create-organizer] Welcome email sent successfully')
                }
            } catch (emailError) {
                console.error('[create-organizer] Email error:', emailError)
                // Don't fail the whole operation if email fails
            }
        } else {
            console.warn('[create-organizer] RESEND_API_KEY not configured, skipping email')
        }

        // 8. Return success response
        return new Response(
            JSON.stringify({
                success: true,
                userId: authData.user.id,
                email: email,
                username: username,
                message: `Organizer created successfully!${RESEND_API_KEY ? ' Welcome email sent to ' + email : ' Please share the setup link manually: ' + passwordSetupLink}`,
                passwordSetupLink: !RESEND_API_KEY ? passwordSetupLink : undefined // Only include if email not sent
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error: any) {
        console.error('[create-organizer] Error:', error)

        return new Response(
            JSON.stringify({
                error: error.message || 'An unexpected error occurred',
                details: error.toString()
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
