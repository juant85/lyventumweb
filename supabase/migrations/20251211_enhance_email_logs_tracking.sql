-- Migration: Enhance Email Logs with Webhook Tracking
-- Date: 2025-12-11
-- Purpose: Extend email_logs table to support comprehensive email tracking with webhook integration
-- Safe: Adds nullable columns, can be safely rolled back

-- ========================================
-- STEP 1: Add Tracking Fields to email_logs
-- ========================================

-- Add webhook tracking fields (same as ime_email_tracking)
ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_click_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_error TEXT,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ;

-- Note: resend_email_id already added by 20251208_create_ime_email_tracking.sql
-- Note: tracking_id already added by 20251208_create_ime_email_tracking.sql

-- ========================================
-- STEP 2: Create Performance Indexes
-- ========================================

-- Index for querying email history by attendee and event
CREATE INDEX IF NOT EXISTS idx_email_logs_attendee_event 
  ON email_logs(attendee_id, event_id, sent_at DESC);

-- Index for quick lookup by resend email ID (for webhooks)
-- Already created by previous migration, but adding IF NOT EXISTS for safety
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id 
  ON email_logs(resend_email_id);

-- Index for filtering by email status
CREATE INDEX IF NOT EXISTS idx_email_logs_status 
  ON email_logs(status);

-- Index for tracking fields (for analytics queries)
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking_status 
  ON email_logs(sent_at, delivered_at, opened_at) 
  WHERE resend_email_id IS NOT NULL;

-- ========================================
-- STEP 3: Enable RLS (if not already enabled)
-- ========================================

-- Enable RLS on email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: Create RLS Policies
-- ========================================

-- Policy: Organizers can view email logs for their events
DROP POLICY IF EXISTS "Organizers can view email logs for their events" ON email_logs;
CREATE POLICY "Organizers can view email logs for their events"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = email_logs.event_id
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

-- Policy: Organizers can insert email logs for their events
DROP POLICY IF EXISTS "Organizers can insert email logs for their events" ON email_logs;
CREATE POLICY "Organizers can insert email logs for their events"
  ON email_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = email_logs.event_id
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

-- Policy: Service role can update email logs (for webhooks)
DROP POLICY IF EXISTS "Service role can update email logs" ON email_logs;
CREATE POLICY "Service role can update email logs"
  ON email_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ========================================
-- STEP 5: Add Table Comments for Documentation
-- ========================================

COMMENT ON COLUMN email_logs.delivered_at IS 'Timestamp when email was delivered (from webhook)';
COMMENT ON COLUMN email_logs.opened_at IS 'Timestamp when email was first opened (from webhook)';
COMMENT ON COLUMN email_logs.first_click_at IS 'Timestamp when first link was clicked (from webhook)';
COMMENT ON COLUMN email_logs.delivery_failed_at IS 'Timestamp when delivery failed/bounced (from webhook)';
COMMENT ON COLUMN email_logs.delivery_error IS 'Error message if delivery failed';
COMMENT ON COLUMN email_logs.open_count IS 'Number of times email was opened';
COMMENT ON COLUMN email_logs.click_count IS 'Number of times links were clicked';
COMMENT ON COLUMN email_logs.last_opened_at IS 'Timestamp of most recent open';
COMMENT ON COLUMN email_logs.last_clicked_at IS 'Timestamp of most recent click';

-- ========================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ========================================

-- To rollback this migration, run:
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS delivered_at;
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS opened_at;
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS first_click_at;
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS delivery_failed_at;
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS delivery_error;
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS open_count;
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS click_count;
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS last_opened_at;
-- ALTER TABLE email_logs DROP COLUMN IF EXISTS last_clicked_at;
-- DROP INDEX IF EXISTS idx_email_logs_attendee_event;
-- DROP INDEX IF EXISTS idx_email_logs_status;
-- DROP INDEX IF EXISTS idx_email_logs_tracking_status;
-- DROP POLICY IF EXISTS "Organizers can view email logs for their events" ON email_logs;
-- DROP POLICY IF EXISTS "Organizers can insert email logs for their events" ON email_logs;
-- DROP POLICY IF EXISTS "Service role can update email logs" ON email_logs;
