// src/types.ts
import { Json } from './database.types';
import { SessionConfig } from './types/sessionConfig';

// === EVENT TYPE SYSTEM ===

/**
 * Event type determines workflow, features, and UI behavior
 * - vendor_meetings: B2B matchmaking with booth-to-attendee pre-assignments
 * - conference: Presentations/talks with session attendance tracking
 * - trade_show: Open lead capture without pre-registration
 * - hybrid: Combined features from multiple types
 */
export type EventType =
  | 'vendor_meetings'
  | 'conference'
  | 'trade_show'
  | 'hybrid';

export interface User {
  id: string; // Supabase User UID
  username: string; // From profiles.username, or email as fallback
  email?: string; // Made email optional as per Supabase user object
  role: 'admin' | 'organizer' | 'superadmin' | 'attendee'; // Updated roles
}

export interface Event {
  id: string;
  name: string;
  clientCompanyId: string; // Link to the client company who "owns" the event
  startDate: string;
  endDate: string;
  location?: string | null;
  description?: string | null;
  companyLogoUrl?: string | null; // For PDF reports
  eventLogoUrl?: string | null;    // For PDF reports
  companyName?: string | null;     // For PDF reports
  planId?: string | null; // New: Reference to the subscription/plan
  planName?: string | null; // Denormalized plan name for easy access
  isActive: boolean; // New: Controls if event is visible in event selection
  boothLayoutConfig?: BoothLayoutConfig | null; // New: Booth map configuration
  mainSponsorId?: string | null; // Reference to platinum sponsor booth
  eventType?: EventType; // NEW: Type of event (defaults to 'vendor_meetings' if not set)
  timezone?: string; // NEW: IANA timezone identifier (e.g., 'America/New_York')
}

export interface Booth {
  id: string; // Unique ID for this booth configuration
  physicalId: string; // User-defined location identifier, e.g., "A01"
  companyName: string; // The company name is fixed for the booth for the event.
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  eventId: string; // Booths are now event-specific
  accessCode: string;

  // Sponsor fields
  companyId?: string | null; // Link to companies table for logo/contact reuse
  isSponsor?: boolean; // Is this booth a paid sponsor?
  sponsorshipTier?: 'platinum' | 'gold' | 'silver' | null; // Sponsor tier level
  sponsorLogoUrl?: string | null; // Custom logo (overrides company logo)
  sponsorWebsiteUrl?: string | null; // Custom website (overrides company website)
  sponsorDescription?: string | null; // Sponsor description for display
}

export interface Attendee {
  id: string; // This would be the QR code content / unique ID from CSV
  name: string;
  email: string;
  organization: string;
  phone: string | null;
  position: string | null;
  notes: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  checkInTime?: string | null;
  last_day_lunch: boolean | null;
  is_veggie: boolean | null;
  has_tour: boolean | null;
  is_vendor: boolean;
  push_subscription: Json | null;
  metadata?: Json | null;
  lastEmailStatus?: string;
  lastEmailSentAt?: string;
}

export interface Session {
  id: string;
  name: string;
  startTime: string; // ISO Date string
  endTime: string;   // ISO Date string
  eventId: string; // Link to the Event this session belongs to
  boothSettings: { boothId: string; capacity: number }[];
  sessionType: 'meeting' | 'presentation' | 'networking' | 'break';
  location?: string | null;
  description?: string | null;
  speaker?: string | null;
  maxCapacity?: number | null;

  // NEW: Flexible session configuration
  config?: SessionConfig; // Defines scanning behavior, capacity, and context-specific settings
}

export interface ScanRecord {
  id: string;
  attendeeId: string;
  attendeeName?: string;
  boothId: string | null; // Nullable for session-only scans
  boothName?: string; // Denormalized company name AT THE TIME of the scan
  sessionId: string | null;
  eventId: string; // Link to the Event this scan belongs to
  timestamp: string; // ISO Date string
  notes?: string;
  scanType: 'regular' | 'out_of_schedule';
  deviceId?: string; // Added Device ID for QR Scanner
  scanStatus?: 'EXPECTED' | 'WALK_IN' | 'WRONG_BOOTH' | 'OUT_OF_SCHEDULE';
  expectedBoothId?: string;
  expectedBoothName?: string;
}

export interface PendingScanPayload {
  localId: string; // Unique ID for IndexedDB, e.g., timestamp + random string
  eventId: string;
  attendeeId: string;
  boothId?: string; // Optional: for booth scanning mode
  sessionId?: string; // Optional: for session scanning mode
  notes?: string;
  deviceId?: string;
  timestamp: string; // ISO string of when the scan happened
  // Add denormalized data for easier display while pending
  attendeeName?: string;
  boothName?: string;
  sessionName?: string; // For session mode
}

// === SMART SCANNING SYSTEM ===

/**
 * Status classification for intelligent scanning
 */
export type ScanStatus =
  | 'EXPECTED'          // Attendee registered + correct booth
  | 'WRONG_BOOTH'       // Attendee registered + wrong booth
  | 'WALK_IN'           // Not registered (walk-in during session)
  | 'OUT_OF_SCHEDULE';  // No active session

/**
 * Additional details returned with scan result
 */
export interface ScanResultDetails {
  expectedBoothName?: string;  // For WRONG_BOOTH scenario
  expectedBoothId?: string;    // For WRONG_BOOTH scenario
  attendeePhoto?: string;      // Avatar URL if available
  isRegistered: boolean;       // Was attendee pre-registered?
  sessionName?: string;        // Active session name
}

/**
 * Complete scan result with status and details
 */
export interface ScanResult {
  success: boolean;
  status: ScanStatus;
  message: string;
  scan?: ScanRecord;
  wasOffline: boolean;
  details?: ScanResultDetails;
}

export interface EventMetrics {
  totalAttendance: number;
  currentBoothActivityLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  activeSessionStatus: 'No Session' | 'In Progress' | 'Upcoming' | 'Finished' | 'Starting Soon' | 'Ending Soon';
}

export interface SessionRegistration {
  id: string;
  eventId: string;
  sessionId: string;
  attendeeId: string;
  attendeeName?: string;
  expectedBoothId?: string | null;
  status: 'Registered' | 'Attended' | 'No-Show';
  registrationTime: string;
  actualScanId?: string | null;
}

export interface Message {
  id: string;
  eventId: string;
  boothId: string;
  senderId: string;
  senderName: string;
  senderType: 'supervisor' | 'booth' | 'attendee';
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  attendeeId: string;
  eventId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export enum AppRoute {
  Landing = "/",
  Login = "/login",
  Pricing = "/pricing",
  ClientPortal = "/client-portal",
  EventSelection = "/events/:companyId",
  Dashboard = "/dashboard",
  QRScanner = "/qr-scanner",
  DataVisualization = "/data-visualization",
  SessionSettings = "/session-settings",
  DataEditor = "/data-editor",
  RealTimeAnalytics = "/real-time-analytics",
  Reports = "/reports",
  BoothSetup = "/booth-setup",
  TracksSettings = "/tracks-settings",
  BoothLogin = "/booth/login",
  SuperAdminEvents = "/superadmin/events",
  SuperAdminPlans = "/superadmin/plans",
  SuperAdminClients = "/superadmin/clients",
  SuperAdminClientDetail = "/superadmin/clients/:companyId",
  AttendeeRegistration = "/attendee-registration",
  AttendeeProfiles = "/attendee-profiles",
  AttendeeProfileDetail = "/attendee-profiles/:attendeeId",
  VendorProfiles = "/vendor-profiles",
  MasterImport = "/master-import",
  EventSelectorForScanner = "/scanner-setup",
  CheckInDesk = "/check-in-desk",
  AttendeeLocator = "/attendee-locator",
  AttendeePortalLogin = "/portal/login",
  AttendeePortalDashboard = "/portal/dashboard",

  // Added for Sidebar Refinement
  Analytics = "/real-time-analytics",
  EmailCommunications = "/email-communications",
  AccessCodes = "/access-codes",
  EmailSettings = "/email-settings",
  Sponsorship = "/sponsorship",
  AttendeeImport = "/attendee-registration",
  Scanner = "/qr-scanner",
  MyEvents = "/my-events",
  Features = "/features",
  ActivityLog = "/activity-log",
}

export interface CsvProcessingError {
  lineNumber: number;
  message: string;
  rowData: string;
}

// --- Booth Map Feature Types ---

export interface BoothLayoutConfig {
  template: 'side-walls-center' | 'side-walls-center-top';
  topWall: number;
  leftWall: number;
  centerLeft: number;
  centerRight: number;
  rightWall: number;
  customOrder?: Record<string, string[]>; // zone -> array of boothIds
}

export interface BoothPosition {
  boothId: string;
  zone: 'top-wall' | 'left-wall' | 'center-left' | 'center-right' | 'right-wall';
  index: number;
}

export type BoothStatus = 'empty' | 'partial' | 'full';

export type MetricPeriod = 'today' | '7days' | '30days' | 'all';

// ========================================
// Email System Types
// ========================================

export interface EmailTemplate {
  id: string;
  eventId: string;
  templateType: 'daily_agenda';
  subject: string;
  bodyHtml: string;
  includePlatinumSponsor: boolean;
  includeSilverSponsors: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailPreferences {
  id: string;
  eventId: string;
  dailyAgendaEnabled: boolean;
  dailyAgendaTime: string; // HH:MM:SS format
  magicLinkShowSponsor: boolean;
  fromName: string;
  fromEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  eventId: string;
  attendeeId: string;
  templateType: string;
  recipientEmail: string;
  subject: string;
  status: 'sent' | 'failed' | 'bounced';
  sentAt: string;
  errorMessage?: string | null;
  platinumSponsorId?: string | null;

  // Tracking fields
  deliveredAt?: string | null;
  openedAt?: string | null;
  firstClickAt?: string | null;
  deliveryFailedAt?: string | null;
  deliveryError?: string | null;
  openCount?: number;
  clickCount?: number;
  lastOpenedAt?: string | null;
  lastClickedAt?: string | null;
  metadata?: Json | null;
}

// === PLAN AND FEATURE MANAGEMENT ===

export interface PlanWithFeatures {
  id: string;
  name: string;
  description: string | null;
  features: Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
  }>;
}

export interface FeatureInfo {
  key: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  requiredBy?: string[];
}

// === JOURNEY VIEW TYPES ===

/**
 * Unified type for journey timeline events
 * Used across admin and attendee views
 */
export interface JourneyEvent {
  id: string;
  type: 'check-in' | 'booth-scan' | 'session-attendance' | 'achievement' | 'networking';
  timestamp: Date | string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  metadata?: {
    boothId?: string;
    boothName?: string;
    sessionId?: string;
    sessionName?: string;
    duration?: number; // in seconds
    rating?: number; // 1-5 stars
    notes?: string;
  };
}

// === ANALYTICS & DASHBOARD ===

export interface BoothActivity {
  boothId: string;
  boothName: string;
  ownerName?: string; // Optional if not always available
  scanCount: number;
}

export interface BoothMetrics {
  boothId: string;
  boothName: string;
  ownerName?: string;
  totalScans: number;
  uniqueScans: number;
  avgDwellTime?: number; // Optional
}