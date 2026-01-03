-- Migration: Add session configuration for flexible scanning contexts
-- Date: 2026-01-03
-- Purpose: Enable session-level scanning behavior configuration

-- Step 1: Add config JSONB column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- Step 2: Add comment for documentation
COMMENT ON COLUMN sessions.config IS 'Session-level configuration for scanning behavior, capacity, and context-specific settings';

-- Step 3: Create index for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_sessions_config ON sessions USING GIN (config);

-- Step 4: Add validation function for config structure
CREATE OR REPLACE FUNCTION validate_session_config(config_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate scanning context if present
  IF config_data ? 'scanningContext' THEN
    IF NOT (config_data->>'scanningContext' IN (
      'booth_meeting',
      'presentation', 
      'lead_capture',
      'open_attendance',
      'networking',
      'custom'
    )) THEN
      RAISE EXCEPTION 'Invalid scanningContext value';
    END IF;
  END IF;
  
  -- Validate boolean fields
  IF config_data ? 'requiresPreAssignment' THEN
    IF NOT jsonb_typeof(config_data->'requiresPreAssignment') = 'boolean' THEN
      RAISE EXCEPTION 'requiresPreAssignment must be boolean';
    END IF;
  END IF;
  
  IF config_data ? 'allowsWalkIns' THEN
    IF NOT jsonb_typeof(config_data->'allowsWalkIns') = 'boolean' THEN
      RAISE EXCEPTION 'allowsWalkIns must be boolean';
    END IF;
  END IF;
  
  IF config_data ? 'hasCapacity' THEN
    IF NOT jsonb_typeof(config_data->'hasCapacity') = 'boolean' THEN
      RAISE EXCEPTION 'hasCapacity must be boolean';
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add check constraint
ALTER TABLE sessions 
ADD CONSTRAINT sessions_config_valid 
CHECK (validate_session_config(config));

-- Step 6: Set default configs for existing sessions based on session_type
UPDATE sessions 
SET config = jsonb_build_object(
  'scanningContext', 
  CASE session_type
    WHEN 'meeting' THEN 'booth_meeting'
    WHEN 'presentation' THEN 'presentation'
    WHEN 'networking' THEN 'networking'
    WHEN 'break' THEN 'open_attendance'
    ELSE 'custom'
  END,
  'requiresPreAssignment', 
  CASE session_type
    WHEN 'meeting' THEN true
    ELSE false
  END,
  'allowsWalkIns',
  CASE session_type
    WHEN 'meeting' THEN false
    ELSE true
  END,
  'boothRestriction',
  CASE session_type
    WHEN 'meeting' THEN 'assigned'
    ELSE 'none'
  END
)
WHERE config = '{}' OR config IS NULL;

/*
===========================================
EXAMPLE CONFIGS:
===========================================

-- Booth Meeting Session
{
  "scanningContext": "booth_meeting",
  "requiresPreAssignment": true,
  "allowsWalkIns": false,
  "boothRestriction": "assigned",
  "boothIds": ["booth-1", "booth-2"]
}

-- Keynote Presentation
{
  "scanningContext": "presentation",
  "requiresPreAssignment": false,
  "allowsWalkIns": true,
  "boothRestriction": "none",
  "location": "Main Hall",
  "hasCapacity": true,
  "maxCapacity": 500
}

-- Lead Capture Station
{
  "scanningContext": "lead_capture",
  "requiresPreAssignment": false,
  "allowsWalkIns": true,
  "boothRestriction": "any",
  "boothIds": ["station-a", "station-b", "station-c"],
  "leadForm": {
    "collectEmail": true,
    "collectPhone": true,
    "collectNotes": true
  }
}

-- Open Networking
{
  "scanningContext": "open_attendance",
  "requiresPreAssignment": false,
  "allowsWalkIns": true,
  "boothRestriction": "none"
}

===========================================
ROLLBACK:
===========================================

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_config_valid;
DROP FUNCTION IF EXISTS validate_session_config(JSONB);
DROP INDEX IF EXISTS idx_sessions_config;
ALTER TABLE sessions DROP COLUMN IF EXISTS config;

*/
