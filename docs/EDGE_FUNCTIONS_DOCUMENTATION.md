# Edge Functions Documentation

This document describes the Supabase Edge Functions implemented in the LyVentum project.

## 1. create-organizer

**Purpose**:
Securely creates a new Organizer user, including:
1.  Verifying the requester is a SuperAdmin.
2.  Creating the user in Supabase Auth (without a temporary password).
3.  Creating a corresponding record in the `profiles` table with the `organizer` role.
4.  Optionally assigning the new organizer to a specific event.
5.  Generating a secure password recovery link.
6.  Sending a welcome email with the setup link via Resend.

**Endpoint**: `/functions/v1/create-organizer`

**Method**: `POST`

**Required Environment Variables**:
-   `SUPABASE_URL`: Auto-injected by Supabase.
-   `SUPABASE_SERVICE_ROLE_KEY`: Auto-injected by Supabase.
-   `APP_URL`: The URL of the frontend application (e.g., `https://app.lyventum.com`).
-   `RESEND_API_KEY`: API key for Resend email service.

**Request Body**:
```json
{
  "email": "organizer@example.com",
  "username": "John Doe",
  "createdBy": "uuid-of-superadmin-user",
  "autoAssignToEvent": "optional-uuid-of-event-to-assign"
}
```

**Response**:
Success (200):
```json
{
  "success": true,
  "userId": "new-user-uuid",
  "email": "organizer@example.com",
  "username": "John Doe",
  "message": "Organizer created successfully! Welcome email sent to organizer@example.com"
}
```

Error (4xx/5xx):
```json
{
  "error": "Error message description"
}
```

## 2. send-email

**Purpose**:
Sends transactional emails via Resend. Used for access codes, notifications, etc.

**Endpoint**: `/functions/v1/send-email`

**Method**: `POST`

**Request Body**:
```json
{
  "recipientEmail": "user@example.com",
  "html": "<p>Your content here</p>",
  "type": "access-code|notification|other",
  "subject": "Email Subject"
}
```

## 3. handle-email-webhooks

**Purpose**:
Receives webhooks from Resend to track email events (delivered, opened, clicked, bounced). Updates the `ime_email_tracking` table.

**Endpoint**: `/functions/v1/handle-email-webhooks`

## 4. send-daily-agenda

**Purpose**:
Sends daily agenda emails to attendees (likely scheduled via pg_cron or triggered manually).

## 5. send-session-reminders

**Purpose**:
Sends reminders for upcoming sessions to registered attendees.

---

## Deployment Instructions

To deploy these functions, use the Supabase CLI:

```bash
supabase functions deploy create-organizer
supabase functions deploy send-email
# etc.
```

Ensure all required environment variables are set in the Supabase Dashboard > Edge Functions > Secrets.
