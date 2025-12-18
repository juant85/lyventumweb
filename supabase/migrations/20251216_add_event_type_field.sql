-- Migration: Add event_type field to events table
-- Date: 2025-12-16
-- Purpose: Support different event types (vendor_meetings, conference, trade_show, hybrid)
--
-- SAFETY FEATURES:
-- 1. DEFAULT value ensures existing events work
-- 2. NOT NULL after default prevents future mistakes
-- 3. CHECK constraint validates values
-- 4. Rollback instructions included

-- Step 1: Add column with default (safe for existing rows)
ALTER TABLE events 
ADD COLUMN event_type TEXT DEFAULT 'vendor_meetings';

-- Step 2: Add constraint to validate values
ALTER TABLE events
ADD CONSTRAINT event_type_valid 
CHECK (event_type IN ('vendor_meetings', 'conference', 'trade_show', 'hybrid'));

-- Step 3: Update existing events to have explicit type
-- (All existing events default to 'vendor_meetings' which is their current behavior)
UPDATE events 
SET event_type = 'vendor_meetings'
WHERE event_type IS NULL;

-- Step 4: Make NOT NULL now that all rows have values
ALTER TABLE events
ALTER COLUMN event_type SET NOT NULL;

-- Optional: Add index for faster queries by type
CREATE INDEX idx_events_event_type ON events(event_type);

-- Optional: Add comment for documentation
COMMENT ON COLUMN events.event_type IS 'Type of event: vendor_meetings (B2B matchmaking), conference (presentations/talks), trade_show (open lead capture), hybrid (combined)';

/*
===========================================
ROLLBACK INSTRUCTIONS (if needed):
===========================================

-- Remove index
DROP INDEX IF EXISTS idx_events_event_type;

-- Remove column
ALTER TABLE events DROP COLUMN IF EXISTS event_type;

===========================================
VERIFICATION QUERIES:
===========================================

-- Check all events have a type
SELECT COUNT(*) as total_events, 
       COUNT(event_type) as events_with_type,
       COUNT(*) - COUNT(event_type) as events_without_type
FROM events;

-- See distribution of event types
SELECT event_type, COUNT(*) as count
FROM events
GROUP BY event_type
ORDER BY count DESC;

-- Verify no NULL values
SELECT * FROM events WHERE event_type IS NULL;
-- Should return 0 rows

*/
