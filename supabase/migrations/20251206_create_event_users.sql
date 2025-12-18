-- Migration: Create event_users table for event-scoped access control
-- This enables SuperAdmin to assign organizers to specific events

-- Step 1: Create the event_users junction table
CREATE TABLE IF NOT EXISTS event_users (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'viewer')) DEFAULT 'organizer',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Step 2: Create index for efficient queries
CREATE INDEX idx_event_users_user_id ON event_users(user_id);
CREATE INDEX idx_event_users_event_id ON event_users(event_id);

-- Step 3: Add comment for documentation
COMMENT ON TABLE event_users IS 'Maps users to events they have access to. SuperAdmin assigns organizers here.';
COMMENT ON COLUMN event_users.role IS 'organizer = can edit, viewer = read-only';
COMMENT ON COLUMN event_users.assigned_by IS 'Tracks which SuperAdmin assigned this access';

-- Step 4: Migrate existing events to grant access to their creators
-- This ensures existing organizers don't lose access when RLS is enabled
INSERT INTO event_users (event_id, user_id, role, assigned_by)
SELECT 
  e.id as event_id,
  e.created_by_user_id as user_id,
  'organizer' as role,
  e.created_by_user_id as assigned_by  -- Self-assigned for migration
FROM events e
WHERE e.created_by_user_id IS NOT NULL
  AND NOT EXISTS (
    -- Avoid duplicates if migration runs twice
    SELECT 1 FROM event_users eu 
    WHERE eu.event_id = e.id AND eu.user_id = e.created_by_user_id
  );

-- Step 5: Verify migration success
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM event_users;
  RAISE NOTICE 'Migration complete. % event access records created.', migrated_count;
END $$;
