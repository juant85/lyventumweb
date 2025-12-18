-- Migration: Create IME Email Tracking System
-- Purpose: Track email delivery status (sent, delivered, opened, clicked) for access code emails
-- Safe: This is a new table, does not modify existing tables or functionality

-- Create the tracking table
CREATE TABLE IF NOT EXISTS public.ime_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Email identifiers
  access_code_id UUID REFERENCES attendee_access_codes(id) ON DELETE SET NULL,
  resend_email_id TEXT, -- ID returned by Resend API for webhook matching
  
  -- Tracking states (progressive timeline)
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  first_click_at TIMESTAMPTZ,
  
  -- Engagement metrics
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  last_opened_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  
  -- Technical metadata (from webhooks)
  user_agent TEXT,
  ip_address TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ime_tracking_attendee ON ime_email_tracking(attendee_id);
CREATE INDEX IF NOT EXISTS idx_ime_tracking_event ON ime_email_tracking(event_id);
CREATE INDEX IF NOT EXISTS idx_ime_tracking_resend_id ON ime_email_tracking(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_ime_tracking_status ON ime_email_tracking(sent_at, delivered_at, opened_at);
CREATE INDEX IF NOT EXISTS idx_ime_tracking_access_code ON ime_email_tracking(access_code_id);

-- Enable Row Level Security
ALTER TABLE ime_email_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view tracking for events they have access to
CREATE POLICY "Users can view tracking for their events"
  ON ime_email_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = ime_email_tracking.event_id
      AND (
        -- Event creator
        auth.uid() = e.created_by_user_id
        -- OR assigned to event
        OR EXISTS (
          SELECT 1 FROM event_users eu
          WHERE eu.event_id = e.id AND eu.user_id = auth.uid()
        )
        -- OR superadmin
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.role = 'superadmin'
        )
      )
    )
  );

-- RLS Policy: Users can insert tracking for their events
CREATE POLICY "Users can insert tracking for their events"
  ON ime_email_tracking FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = ime_email_tracking.event_id
      AND (
        auth.uid() = e.created_by_user_id
        OR EXISTS (
          SELECT 1 FROM event_users eu
          WHERE eu.event_id = e.id AND eu.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.role = 'superadmin'
        )
      )
    )
  );

-- RLS Policy: Service role can update tracking (for webhooks)
CREATE POLICY "Service role can update tracking"
  ON ime_email_tracking FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add optional tracking reference to email_logs for backwards compatibility
ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS resend_email_id TEXT,
ADD COLUMN IF NOT EXISTS tracking_id UUID REFERENCES ime_email_tracking(id);

-- Create index on email_logs for resend_email_id lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_email_id);

-- Add comment for documentation
COMMENT ON TABLE ime_email_tracking IS 'Tracks email delivery status for IME access codes using Resend webhooks';
COMMENT ON COLUMN ime_email_tracking.resend_email_id IS 'Email ID from Resend API, used to match webhook events';
COMMENT ON COLUMN ime_email_tracking.open_count IS 'Number of times the email was opened (may include multiple opens by same user)';
COMMENT ON COLUMN ime_email_tracking.click_count IS 'Number of times links in the email were clicked';
