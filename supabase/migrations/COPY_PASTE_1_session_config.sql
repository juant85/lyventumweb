-- ============================================
-- MIGRACIÓN 1: Session Config
-- ============================================
-- Copia todo este bloque y pégalo en Supabase SQL Editor

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

COMMENT ON COLUMN sessions.config IS 'Session-level configuration for scanning behavior, capacity, and context-specific settings';

CREATE INDEX IF NOT EXISTS idx_sessions_config ON sessions USING GIN (config);

CREATE OR REPLACE FUNCTION validate_session_config(config_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
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

ALTER TABLE sessions 
ADD CONSTRAINT sessions_config_valid 
CHECK (validate_session_config(config));

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
