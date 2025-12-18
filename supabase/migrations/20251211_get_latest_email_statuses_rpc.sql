-- Migration: Create RPC to get latest email status per attendee
-- Date: 2025-12-11
-- Purpose: Efficiently fetch the most recent email status for the attendee list view without N+1 queries.

CREATE OR REPLACE FUNCTION get_latest_email_statuses(p_event_id UUID)
RETURNS TABLE (
  attendee_id UUID,
  status TEXT,
  sent_at TIMESTAMPTZ,
  template_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH combined_history AS (
    -- From email_logs (newer system, includes detailed tracking)
    SELECT
      el.attendee_id,
      el.status,
      el.sent_at,
      el.template_type
    FROM email_logs el
    WHERE el.event_id = p_event_id
    AND el.attendee_id IS NOT NULL

    UNION ALL

    -- From ime_email_tracking (legacy/specific system)
    SELECT
      t.attendee_id,
      CASE
        WHEN t.opened_at IS NOT NULL THEN 'opened'
        WHEN t.delivered_at IS NOT NULL THEN 'delivered'
        ELSE 'sent'
      END as status,
      t.sent_at,
      'access_code' as template_type
    FROM ime_email_tracking t
    WHERE t.event_id = p_event_id
  )
  SELECT DISTINCT ON (ch.attendee_id)
      ch.attendee_id,
      ch.status,
      ch.sent_at,
      ch.template_type
  FROM combined_history ch
  ORDER BY ch.attendee_id, ch.sent_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_email_statuses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_email_statuses(UUID) TO service_role;
