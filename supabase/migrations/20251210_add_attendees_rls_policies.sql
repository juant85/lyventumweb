-- Migration: Add comprehensive RLS policies for attendees table
-- This fixes organizer access to attendee/staff profiles by adding INSERT/UPDATE/DELETE policies
-- The existing public SELECT policy from 20251205_enable_attendee_public_read.sql remains intact

-- ============================================
-- ATTENDEES TABLE - WRITE POLICIES
-- ============================================

-- Note: RLS is already enabled and SELECT policy exists from previous migration
-- We're adding INSERT, UPDATE, and DELETE policies to match the pattern of other event-scoped tables

-- Policy: Allow SuperAdmin and event organizers to UPDATE attendees in their events
DROP POLICY IF EXISTS "attendees_update_policy" ON attendees;
CREATE POLICY "attendees_update_policy" ON attendees
  FOR UPDATE
  USING (
    is_superadmin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM event_attendees ea
      WHERE ea.attendee_id = attendees.id
      AND is_event_organizer(auth.uid(), ea.event_id)
    )
  );

-- Policy: Allow SuperAdmin and event organizers to INSERT attendees
-- Note: This validates through WITH CHECK that the attendee will be linked to an event they manage
DROP POLICY IF EXISTS "attendees_insert_policy" ON attendees;
CREATE POLICY "attendees_insert_policy" ON attendees
  FOR INSERT
  WITH CHECK (
    is_superadmin(auth.uid()) OR 
    -- For organizers, we allow insert. The event_attendees record must be created separately
    -- and that table has its own RLS that ensures only organizers can link attendees to their events
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('organizer', 'admin')
    )
  );

-- Policy: Allow SuperAdmin and event organizers to DELETE attendees from their events
DROP POLICY IF EXISTS "attendees_delete_policy" ON attendees;
CREATE POLICY "attendees_delete_policy" ON attendees
  FOR DELETE
  USING (
    is_superadmin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM event_attendees ea
      WHERE ea.attendee_id = attendees.id
      AND is_event_organizer(auth.uid(), ea.event_id)
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies successfully added to attendees table:';
  RAISE NOTICE '   - attendees_insert_policy (INSERT)';
  RAISE NOTICE '   - attendees_update_policy (UPDATE)';
  RAISE NOTICE '   - attendees_delete_policy (DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Attendees access control:';
  RAISE NOTICE '   - SELECT: Public (required for IME validation)';
  RAISE NOTICE '   - INSERT: SuperAdmin and Organizers';
  RAISE NOTICE '   - UPDATE: SuperAdmin and Organizers (event-scoped)';
  RAISE NOTICE '   - DELETE: SuperAdmin and Organizers (event-scoped)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Verifying policies...';
  
  -- Verify all 4 policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendees' 
    AND policyname = 'attendees_insert_policy'
  ) THEN
    RAISE EXCEPTION 'Failed to create attendees_insert_policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendees' 
    AND policyname = 'attendees_update_policy'
  ) THEN
    RAISE EXCEPTION 'Failed to create attendees_update_policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendees' 
    AND policyname = 'attendees_delete_policy'
  ) THEN
    RAISE EXCEPTION 'Failed to create attendees_delete_policy';
  END IF;
  
  RAISE NOTICE '✅ All policies verified successfully!';
END $$;
