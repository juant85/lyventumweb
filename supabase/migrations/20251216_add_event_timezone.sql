-- Migration: Add timezone support to events
-- Purpose: Store event timezone for proper time display and conversion
-- Author: LyVentum Dev Team
-- Date: 2025-12-16

-- Add timezone column to events table
ALTER TABLE events
ADD COLUMN timezone VARCHAR(100) DEFAULT 'America/Chicago' NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN events.timezone IS 'IANA timezone identifier for the event location (e.g., America/New_York, Europe/London). Used for displaying times correctly regardless of user location.';

-- Create index for faster timezone queries
CREATE INDEX idx_events_timezone ON events(timezone);

-- Update any existing events to default timezone
UPDATE events 
SET timezone = 'America/Chicago' 
WHERE timezone IS NULL OR timezone = '';

-- Verification query
-- Should return all events with their timezone
SELECT id, name, timezone, start_date, end_date
FROM events
ORDER BY created_at DESC
LIMIT 10;
