-- Migration: Create RLS helper functions for event access control
-- These functions are used in Row Level Security policies

-- Helper 1: Check if user is a superadmin
CREATE OR REPLACE FUNCTION is_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = $1 AND profiles.role = 'superadmin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_superadmin IS 'Returns true if user has superadmin role in profiles table';

-- Helper 2: Check if user has ANY access to an event (organizer or viewer)
CREATE OR REPLACE FUNCTION user_has_event_access(user_id UUID, event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_users 
    WHERE event_users.user_id = $1 AND event_users.event_id = $2
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_has_event_access IS 'Returns true if user is assigned to event (any role)';

-- Helper 3: Check if user is an organizer (can edit) for a specific event
CREATE OR REPLACE FUNCTION is_event_organizer(user_id UUID, event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_users 
    WHERE event_users.user_id = $1 
      AND event_users.event_id = $2 
      AND event_users.role = 'organizer'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_event_organizer IS 'Returns true if user has organizer role for event (can edit)';

-- Helper 4: Get user's event role (useful for application layer)
CREATE OR REPLACE FUNCTION get_user_event_role(user_id UUID, event_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM event_users 
  WHERE event_users.user_id = $1 AND event_users.event_id = $2
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_event_role IS 'Returns user role for event or NULL if no access';

-- Verify functions were created
DO $$
BEGIN
  RAISE NOTICE 'RLS helper functions created successfully:';
  RAISE NOTICE '  - is_superadmin(user_id)';
  RAISE NOTICE '  - user_has_event_access(user_id, event_id)';
  RAISE NOTICE '  - is_event_organizer(user_id, event_id)';
  RAISE NOTICE '  - get_user_event_role(user_id, event_id)';
END $$;
