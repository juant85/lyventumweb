-- Migration: Add access codes to sessions and make booth_id nullable in scan_records
-- This enables sessions to function as scanner endpoints (for talks/presentations)
-- and allows scan_records to be associated with either booths OR sessions

-- ============================================
-- SESSIONS TABLE: Add access_code column
-- ============================================

-- Add access_code column (initially nullable)
ALTER TABLE sessions ADD COLUMN access_code TEXT;

-- Create unique index on access_code for performance
CREATE UNIQUE INDEX idx_sessions_access_code ON sessions(access_code) WHERE access_code IS NOT NULL;

-- Generate access codes for existing sessions
-- Format: SESSION-XXXX (e.g., SESSION-A2B4)
UPDATE sessions 
SET access_code = 'SESSION-' || UPPER(SUBSTRING(MD5(id::TEXT || RANDOM()::TEXT) FROM 1 FOR 4))
WHERE access_code IS NULL;

-- Make access_code required for all sessions
ALTER TABLE sessions ALTER COLUMN access_code SET NOT NULL;

-- ============================================
-- SCAN_RECORDS TABLE: Make booth_id nullable
-- ============================================

-- Allow scan_records to have either booth_id OR session_id (but not necessarily both)
ALTER TABLE scan_records ALTER COLUMN booth_id DROP NOT NULL;
ALTER TABLE scan_records ALTER COLUMN booth_name DROP NOT NULL;

-- Add check constraint: must have either booth_id or session_id
ALTER TABLE scan_records ADD CONSTRAINT scan_records_booth_or_session_check 
  CHECK (booth_id IS NOT NULL OR session_id IS NOT NULL);

-- ============================================
-- RPC FUNCTION: Get session by access code
-- ============================================

-- Function to retrieve session details by access code
-- Used by scanner login flow to validate session access codes
CREATE OR REPLACE FUNCTION get_session_by_access_code(p_access_code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  event_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.event_id, s.start_time, s.end_time
  FROM sessions s
  WHERE s.access_code = p_access_code;
END;
$$;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  session_count INT;
  sessions_with_codes INT;
BEGIN
  -- Count total sessions
  SELECT COUNT(*) INTO session_count FROM sessions;
  
  -- Count sessions with access codes
  SELECT COUNT(*) INTO sessions_with_codes FROM sessions WHERE access_code IS NOT NULL;
  
  RAISE NOTICE '✅ Session access code migration completed';
  RAISE NOTICE '   - Total sessions: %', session_count;
  RAISE NOTICE '   - Sessions with access codes: %', sessions_with_codes;
  RAISE NOTICE '   - booth_id in scan_records is now nullable';
  RAISE NOTICE '   - RPC function get_session_by_access_code created';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Sessions can now be used as scanner endpoints';
  RAISE NOTICE '   Format: SESSION-XXXX';
END $$;
