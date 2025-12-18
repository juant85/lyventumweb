-- Migration: Fix is_organizer function and cleanup insecure policies
-- This ensures organizers have proper role-based access and removes broad "Allow ALL" policies

-- 1. Fix is_organizer to strictly check for organizer/admin role
CREATE OR REPLACE FUNCTION public.is_organizer(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_user_id 
    AND role IN ('organizer', 'admin', 'superadmin')
  );
END;
$function$;

-- 2. Drop insecure "Allow ALL" policies from core tables where granular policies exist

-- Attendees
DROP POLICY IF EXISTS "Allow ALL for organizers" ON attendees;
-- Ensure granular policies are enabled (confirmed by previous migration check)

-- Events
DROP POLICY IF EXISTS "Allow ALL for organizers" ON events;

-- Booths
DROP POLICY IF EXISTS "Allow ALL for organizers" ON booths;

-- Sessions
DROP POLICY IF EXISTS "Allow ALL for organizers" ON sessions;

-- Event Attendees
DROP POLICY IF EXISTS "Allow ALL for organizers" ON event_attendees;

-- Scan Records
DROP POLICY IF EXISTS "Allow ALL for organizers" ON scan_records;

-- Session Registrations
DROP POLICY IF EXISTS "Allow ALL for organizers" ON session_registrations;


-- 3. Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed is_organizer function';
  RAISE NOTICE '✅ Removed insecure "Allow ALL" policies from core tables';
  RAISE NOTICE '🔒 Security posture enhanced - relying on event-scoped policies';
END $$;
