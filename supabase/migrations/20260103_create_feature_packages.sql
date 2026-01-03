-- Migration: Create feature packages for marketing-friendly plan configuration
-- Date: 2026-01-03
-- Purpose: Group technical features into sellable packages

-- Step 1: Create feature_packages table
CREATE TABLE IF NOT EXISTS feature_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  features TEXT[] NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create plan_packages junction table
CREATE TABLE IF NOT EXISTS plan_packages (
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES feature_packages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (plan_id, package_id)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_packages_key ON feature_packages(key);
CREATE INDEX IF NOT EXISTS idx_plan_packages_plan_id ON plan_packages(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_packages_package_id ON plan_packages(package_id);

-- Step 4: Add comments
COMMENT ON TABLE feature_packages IS 'Marketing-friendly groupings of technical features';
COMMENT ON TABLE plan_packages IS 'Maps subscription plans to feature packages';
COMMENT ON COLUMN feature_packages.key IS 'Unique identifier for package (e.g., booth_management_suite)';
COMMENT ON COLUMN feature_packages.features IS 'Array of feature keys included in this package';

-- Step 5: Insert core feature packages
INSERT INTO feature_packages (key, name, description, icon, category, features) VALUES
(
  'booth_management_suite',
  'Booth Management Suite',
  'Complete booth setup, scanning, vendor management, and booth-level analytics',
  '🏢',
  'configuration',
  ARRAY[
    'feature_booth_setup',
    'feature_qr_scanner',
    'feature_booth_map',
    'feature_vendor_profiles',
    'feature_access_codes'
  ]
),
(
  'session_conference_tools',
  'Session & Conference Tools',
  'Full session scheduling, speaker management, tracks, and calendar integration',
  '🎤',
  'configuration',
  ARRAY[
    'feature_session_settings',
    'feature_tracks',
    'feature_calendar_sync',
    'feature_session_reminders'
  ]
),
(
  'lead_capture_pro',
  'Lead Capture Pro',
  'Advanced lead capture with walk-in registration and CRM export capabilities',
  '📊',
  'tools',
  ARRAY[
    'feature_qr_scanner',
    'feature_attendee_registration',
    'feature_master_import',
    'feature_data_editor'
  ]
),
(
  'analytics_reporting',
  'Analytics & Reporting',
  'Real-time analytics, advanced data visualization, and professional PDF reports',
  '📈',
  'analytics',
  ARRAY[
    'feature_dashboard',
    'feature_real_time_analytics',
    'feature_data_visualization',
    'feature_reports'
  ]
),
(
  'attendee_portal_standard',
  'Attendee Portal',
  'Self-service attendee portal with agenda, journey tracking, and email updates',
  '👥',
  'attendee-portal',
  ARRAY[
    'feature_attendee_portal',
    'feature_daily_email_agenda',
    'feature_attendee_journey_view',
    'feature_attendee_portal_preview'
  ]
),
(
  'gamification_engagement',
  'Gamification & Engagement',
  'Booth challenges, leaderboards, and achievement system for attendee engagement',
  '🎮',
  'gamification',
  ARRAY[
    'feature_booth_challenge',
    'feature_leaderboard',
    'feature_achievement_system'
  ]
),
(
  'live_operations',
  'Live Operations',
  'Real-time attendee tracking, check-in desk, and location services',
  '📍',
  'live-operations',
  ARRAY[
    'feature_check_in_desk',
    'feature_check_in_photo',
    'feature_attendee_locator'
  ]
),
(
  'communication_tools',
  'Communication Tools',
  'Email campaigns, attendee alerts, and messaging capabilities',
  '💬',
  'communication',
  ARRAY[
    'feature_email_communications',
    'feature_email_settings',
    'feature_attendee_alerts',
    'feature_attendee_chat'
  ]
),
(
  'sponsorship_management',
  'Sponsorship Management',
  'Manage sponsors, tiers, branding, and sponsor visibility across the event',
  '⭐',
  'configuration',
  ARRAY[
    'feature_sponsorship'
  ]
);

-- Step 6: Create helper function to check if plan has package
CREATE OR REPLACE FUNCTION plan_has_package(
  plan_id_param UUID,
  package_key_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM plan_packages pp
    JOIN feature_packages fp ON pp.package_id = fp.id
    WHERE pp.plan_id = plan_id_param
    AND fp.key = package_key_param
  );
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to check if plan has all features in a package
CREATE OR REPLACE FUNCTION plan_has_package_features(
  plan_id_param UUID,
  package_key_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  package_features TEXT[];
  feature_count INTEGER;
  matched_count INTEGER;
BEGIN
  -- Get features in the package
  SELECT features INTO package_features
  FROM feature_packages
  WHERE key = package_key_param;
  
  IF package_features IS NULL THEN
    RETURN FALSE;
  END IF;
  
  feature_count := array_length(package_features, 1);
  
  -- Count how many of those features the plan has
  SELECT COUNT(*) INTO matched_count
  FROM plan_features pf
  JOIN features f ON pf.feature_id = f.id
  WHERE pf.plan_id = plan_id_param
  AND f.key = ANY(package_features);
  
  -- Plan has package if it has ALL features
  RETURN matched_count = feature_count;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create function to get all packages for a plan
CREATE OR REPLACE FUNCTION get_plan_packages(plan_id_param UUID)
RETURNS TABLE (
  package_id UUID,
  package_key TEXT,
  package_name TEXT,
  package_description TEXT,
  package_icon TEXT,
  has_all_features BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.key,
    fp.name,
    fp.description,
    fp.icon,
    plan_has_package_features(plan_id_param, fp.key) as has_all_features
  FROM feature_packages fp
  ORDER BY fp.category, fp.name;
END;
$$ LANGUAGE plpgsql;

/*
===========================================
USAGE EXAMPLES:
===========================================

-- Check if plan has a specific package
SELECT plan_has_package('plan-uuid', 'booth_management_suite');

-- Check if plan has all features needed for a package
SELECT plan_has_package_features('plan-uuid', 'analytics_reporting');

-- Get all packages for a plan with completion status
SELECT * FROM get_plan_packages('plan-uuid');

-- Assign package to plan
INSERT INTO plan_packages (plan_id, package_id)
SELECT 'plan-uuid', id FROM feature_packages WHERE key = 'booth_management_suite';

===========================================
ROLLBACK:
===========================================

DROP FUNCTION IF EXISTS get_plan_packages(UUID);
DROP FUNCTION IF EXISTS plan_has_package_features(UUID, TEXT);
DROP FUNCTION IF EXISTS plan_has_package(UUID, TEXT);
DROP TABLE IF EXISTS plan_packages;
DROP TABLE IF EXISTS feature_packages;

*/
