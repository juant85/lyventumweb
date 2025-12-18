-- Function to get aggregate email statistics for an event
CREATE OR REPLACE FUNCTION get_event_email_stats(p_event_id UUID)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_opened BIGINT,
  total_clicked BIGINT,
  total_failed BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC
) AS $$
DECLARE
  v_total_sent BIGINT;
  v_total_delivered BIGINT;
  v_total_opened BIGINT;
  v_total_clicked BIGINT;
  v_total_failed BIGINT;
BEGIN
  -- Calculate counts from email_logs using timestamps for accuracy
  -- Note: We include both 'email_logs' and 'ime_email_tracking' via the logs table which should be the comprehensive source
  SELECT
    COUNT(*),
    -- Delivered: Either has sent status (assumed delivered if not failed) or explicit timestamp
    -- Actually, Resend "Sent" means dispatched. "Delivered" is a webhook event.
    -- Strict definition: Count(delivered_at IS NOT NULL)
    COUNT(*) FILTER (WHERE delivered_at IS NOT NULL),
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL),
    COUNT(*) FILTER (WHERE first_click_at IS NOT NULL),
    COUNT(*) FILTER (WHERE delivery_failed_at IS NOT NULL OR status = 'failed' OR status = 'bounced')
  INTO
    v_total_sent,
    v_total_delivered,
    v_total_opened,
    v_total_clicked,
    v_total_failed
  FROM email_logs
  WHERE event_id = p_event_id;

  -- Return calculated rates
  RETURN QUERY SELECT
    v_total_sent,
    v_total_delivered,
    v_total_opened,
    v_total_clicked,
    v_total_failed,
    -- Open Rate: Opened / Delivered
    CASE WHEN v_total_delivered > 0 THEN ROUND((v_total_opened::NUMERIC / v_total_delivered::NUMERIC) * 100, 1) ELSE 0 END as open_rate,
    -- Click Rate: Clicked / Opened (Engagement of those who opened)
    CASE WHEN v_total_opened > 0 THEN ROUND((v_total_clicked::NUMERIC / v_total_opened::NUMERIC) * 100, 1) ELSE 0 END as click_rate,
    -- Bounce Rate: Failed / Sent
    CASE WHEN v_total_sent > 0 THEN ROUND((v_total_failed::NUMERIC / v_total_sent::NUMERIC) * 100, 1) ELSE 0 END as bounce_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_event_email_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_email_stats(UUID) TO service_role;
