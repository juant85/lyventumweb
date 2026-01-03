// src/features.ts

/**
 * Defines all modular features available in the application.
 * This enum serves as the single source of truth for feature keys.
 */
export enum Feature {
  // Check-in Desk
  CHECK_IN_DESK = 'feature_check_in_desk',
  CHECK_IN_PHOTO = 'feature_check_in_photo',

  // Live Operations
  ATTENDEE_LOCATOR = 'feature_attendee_locator',

  // View & Analyze
  DASHBOARD = 'feature_dashboard',
  DATA_VISUALIZATION = 'feature_data_visualization',
  REAL_TIME_ANALYTICS = 'feature_real_time_analytics',
  REPORTS = 'feature_reports',

  // Manage & Edit
  ATTENDEE_PROFILES = 'feature_attendee_profiles',
  DATA_EDITOR = 'feature_data_editor',

  // Configure & Setup
  SESSION_SETTINGS = 'feature_session_settings',
  BOOTH_SETUP = 'feature_booth_setup',
  TRACKS = 'feature_tracks',
  BOOTH_MAP = 'feature_booth_map',

  // Import & Tools
  MASTER_IMPORT = 'feature_master_import',
  ATTENDEE_REGISTRATION = 'feature_attendee_registration',
  QR_SCANNER = 'feature_qr_scanner',

  // Super Admin
  SUPER_ADMIN_PLANS = 'feature_super_admin_plans',

  // Communication
  ATTENDEE_CHAT = 'feature_attendee_chat',
  ATTENDEE_ALERTS = 'feature_attendee_alerts',

  // Attendee-Facing Features
  ATTENDEE_PORTAL_PREVIEW = 'feature_attendee_portal_preview',

  // Attendee Portal Features
  ATTENDEE_PORTAL = 'feature_attendee_portal',
  DAILY_EMAIL_AGENDA = 'feature_daily_email_agenda',
  SESSION_REMINDERS = 'feature_session_reminders',
  ATTENDEE_JOURNEY_VIEW = 'feature_attendee_journey_view',
  CALENDAR_SYNC = 'feature_calendar_sync',
  BOOTH_CHALLENGE = 'feature_booth_challenge',
  ACHIEVEMENT_SYSTEM = 'feature_achievement_system',
  ATTENDEE_NETWORKING = 'feature_attendee_networking',
  LEADERBOARD = 'feature_leaderboard',

  // Added for Sidebar Refinement
  ANALYTICS = 'feature_analytics', // or alias to real_time_analytics
  EMAIL_COMMUNICATIONS = 'feature_email_communications',
  VENDOR_PROFILES = 'feature_vendor_profiles',
  ACCESS_CODES = 'feature_access_codes',
  EMAIL_SETTINGS = 'feature_email_settings',
  SPONSORSHIP = 'feature_sponsorship',
  ATTENDEE_IMPORT = 'feature_attendee_import',
  SCANNER = 'feature_scanner',
  MY_EVENTS = 'feature_my_events',
}