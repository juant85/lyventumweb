-- Enable pg_cron extension (required for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions to service_role
GRANT USAGE ON SCHEMA cron TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO service_role;

-- Schedule: Send session reminders every 5 minutes
-- This checks for sessions starting in 15 minutes and sends reminder emails
SELECT cron.schedule(
    'send-session-reminders-job',           -- Job name
    '*/5 * * * *',                          -- Every 5 minutes
    $$
    SELECT
      net.http_post(
          url:='https://rnltgsfzkgpbfgzqskex.supabase.co/functions/v1/send-session-reminders',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
          body:='{}'::jsonb
      ) AS request_id;
    $$
);

-- Schedule: Send daily agenda emails at 6:00 PM (18:00) Central Time
-- This sends tomorrow's agenda to all attendees with registered sessions
SELECT cron.schedule(
    'send-daily-agenda-job',                -- Job name
    '0 18 * * *',                           -- Daily at 6:00 PM (18:00)
    $$
    SELECT
      net.http_post(
          url:='https://rnltgsfzkgpbfgzqskex.supabase.co/functions/v1/send-daily-agenda',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
          body:='{}'::jsonb
      ) AS request_id;
    $$
);

-- To view all scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job (if needed):
-- SELECT cron.unschedule('send-session-reminders-job');
-- SELECT cron.unschedule('send-daily-agenda-job');
