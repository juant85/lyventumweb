-- Verification Queries for Event Type Migration
-- Run these in Supabase SQL Editor to confirm everything worked

-- ========================================
-- QUERY 1: Check all events have event_type
-- ========================================
SELECT 
  COUNT(*) as total_events,
  COUNT(event_type) as events_with_type,
  COUNT(*) - COUNT(event_type) as missing_type
FROM events;

-- Expected Result: missing_type should be 0


-- ========================================
-- QUERY 2: View distribution of event types
-- ========================================
SELECT 
  event_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM events
GROUP BY event_type
ORDER BY count DESC;

-- Expected: All events should be 'vendor_meetings' (100%)


-- ========================================
-- QUERY 3: Sample events with their types
-- ========================================
SELECT 
  id,
  name,
  event_type,
  start_date,
  end_date,
  is_active
FROM events
ORDER BY created_at DESC
LIMIT 10;

-- Expected: All should have event_type = 'vendor_meetings'


-- ========================================
-- QUERY 4: Test constraint (should FAIL)
-- ========================================
-- This query should return an error - that's good!
-- DO NOT run this if you don't want test data

-- INSERT INTO events (
--   name, 
--   company_id, 
--   start_date, 
--   end_date,
--   event_type
-- ) VALUES (
--   'Test Invalid Type',
--   (SELECT id FROM companies LIMIT 1),
--   NOW(),
--   NOW() + INTERVAL '1 day',
--   'invalid_type'  -- This should FAIL
-- );

-- Expected: ERROR: new row for relation "events" violates check constraint "event_type_valid"


-- ========================================
-- QUERY 5: Check index exists
-- ========================================
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'events' 
  AND indexname = 'idx_events_event_type';

-- Expected: 1 row showing the index definition


-- ========================================
-- ALL CHECKS PASSED? ✅
-- ========================================
-- If all queries return expected results:
-- 1. Copy results and share
-- 2. Proceed to test app
-- 3. Move to Paso 2
