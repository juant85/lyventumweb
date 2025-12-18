-- Migration: Implement Row Level Security (RLS) policies for event-scoped access
-- SuperAdmin can access everything, organizers only their assigned events

-- ============================================
-- EVENTS TABLE
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: SuperAdmin or assigned users can SELECT events
DROP POLICY IF EXISTS "events_select_policy" ON events;
CREATE POLICY "events_select_policy" ON events
  FOR SELECT
  USING (
    is_superadmin(auth.uid()) OR 
    user_has_event_access(auth.uid(), id)
  );

-- Policy: Only SuperAdmin can INSERT events
DROP POLICY IF EXISTS "events_insert_policy" ON events;
CREATE POLICY "events_insert_policy" ON events
  FOR INSERT
  WITH CHECK (is_superadmin(auth.uid()));

-- Policy: SuperAdmin or event organizers can UPDATE
DROP POLICY IF EXISTS "events_update_policy" ON events;
CREATE POLICY "events_update_policy" ON events
  FOR UPDATE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), id)
  );

-- Policy: Only SuperAdmin can DELETE events
DROP POLICY IF EXISTS "events_delete_policy" ON events;
CREATE POLICY "events_delete_policy" ON events
  FOR DELETE
  USING (is_superadmin(auth.uid()));

-- ============================================
-- BOOTHS TABLE
-- ============================================

ALTER TABLE booths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booths_select_policy" ON booths;
CREATE POLICY "booths_select_policy" ON booths
  FOR SELECT
  USING (
    is_superadmin(auth.uid()) OR 
    user_has_event_access(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "booths_insert_policy" ON booths;
CREATE POLICY "booths_insert_policy" ON booths
  FOR INSERT
  WITH CHECK (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "booths_update_policy" ON booths;
CREATE POLICY "booths_update_policy" ON booths
  FOR UPDATE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "booths_delete_policy" ON booths;
CREATE POLICY "booths_delete_policy" ON booths
  FOR DELETE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

-- ============================================
-- SESSIONS TABLE
-- ============================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  USING (
    is_superadmin(auth.uid()) OR 
    user_has_event_access(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "sessions_insert_policy" ON sessions;
CREATE POLICY "sessions_insert_policy" ON sessions
  FOR INSERT
  WITH CHECK (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "sessions_update_policy" ON sessions;
CREATE POLICY "sessions_update_policy" ON sessions
  FOR UPDATE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "sessions_delete_policy" ON sessions;
CREATE POLICY "sessions_delete_policy" ON sessions
  FOR DELETE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

-- ============================================
-- SCAN_RECORDS TABLE
-- ============================================

ALTER TABLE scan_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scan_records_select_policy" ON scan_records;
CREATE POLICY "scan_records_select_policy" ON scan_records
  FOR SELECT
  USING (
    is_superadmin(auth.uid()) OR 
    user_has_event_access(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "scan_records_insert_policy" ON scan_records;
CREATE POLICY "scan_records_insert_policy" ON scan_records
  FOR INSERT
  WITH CHECK (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "scan_records_delete_policy" ON scan_records;
CREATE POLICY "scan_records_delete_policy" ON scan_records
  FOR DELETE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

-- ============================================
-- SESSION_REGISTRATIONS TABLE
-- ============================================

ALTER TABLE session_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_registrations_select_policy" ON session_registrations;
CREATE POLICY "session_registrations_select_policy" ON session_registrations
  FOR SELECT
  USING (
    is_superadmin(auth.uid()) OR 
    user_has_event_access(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "session_registrations_insert_policy" ON session_registrations;
CREATE POLICY "session_registrations_insert_policy" ON session_registrations
  FOR INSERT
  WITH CHECK (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "session_registrations_update_policy" ON session_registrations;
CREATE POLICY "session_registrations_update_policy" ON session_registrations
  FOR UPDATE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "session_registrations_delete_policy" ON session_registrations;
CREATE POLICY "session_registrations_delete_policy" ON session_registrations
  FOR DELETE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

-- ============================================
-- EVENT_ATTENDEES TABLE
-- ============================================

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_attendees_select_policy" ON event_attendees;
CREATE POLICY "event_attendees_select_policy" ON event_attendees
  FOR SELECT
  USING (
    is_superadmin(auth.uid()) OR 
    user_has_event_access(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "event_attendees_insert_policy" ON event_attendees;
CREATE POLICY "event_attendees_insert_policy" ON event_attendees
  FOR INSERT
  WITH CHECK (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "event_attendees_update_policy" ON event_attendees;
CREATE POLICY "event_attendees_update_policy" ON event_attendees
  FOR UPDATE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

DROP POLICY IF EXISTS "event_attendees_delete_policy" ON event_attendees;
CREATE POLICY "event_attendees_delete_policy" ON event_attendees
  FOR DELETE
  USING (
    is_superadmin(auth.uid()) OR 
    is_event_organizer(auth.uid(), event_id)
  );

-- ============================================
-- EVENT_USERS TABLE (Self-management)
-- ============================================

ALTER TABLE event_users ENABLE ROW LEVEL SECURITY;

-- Only SuperAdmin can view event assignments
DROP POLICY IF EXISTS "event_users_select_policy" ON event_users;
CREATE POLICY "event_users_select_policy" ON event_users
  FOR SELECT
  USING (is_superadmin(auth.uid()));

-- Only SuperAdmin can assign users to events
DROP POLICY IF EXISTS "event_users_insert_policy" ON event_users;
CREATE POLICY "event_users_insert_policy" ON event_users
  FOR INSERT
  WITH CHECK (is_superadmin(auth.uid()));

-- Only SuperAdmin can update roles
DROP POLICY IF EXISTS "event_users_update_policy" ON event_users;
CREATE POLICY "event_users_update_policy" ON event_users
  FOR UPDATE
  USING (is_superadmin(auth.uid()));

-- Only SuperAdmin can remove access
DROP POLICY IF EXISTS "event_users_delete_policy" ON event_users;
CREATE POLICY "event_users_delete_policy" ON event_users
  FOR DELETE
  USING (is_superadmin(auth.uid()));

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies successfully applied to:';
  RAISE NOTICE '   - events';
  RAISE NOTICE '   - booths';
  RAISE NOTICE '   - sessions';
  RAISE NOTICE '   - scan_records';
  RAISE NOTICE '   - session_registrations';
  RAISE NOTICE '   - event_attendees';
  RAISE NOTICE '   - event_users';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Access control:';
  RAISE NOTICE '   - SuperAdmin: Full access to all tables';
  RAISE NOTICE '   - Organizers: Access to assigned events only';
  RAISE NOTICE '   - Viewers: Read-only access to assigned events';
END $$;
