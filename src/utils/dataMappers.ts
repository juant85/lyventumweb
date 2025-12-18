// src/utils/dataMappers.ts
import { Session, Booth, Attendee, ScanRecord, SessionRegistration, Event } from '../types';
import { Database } from '../database.types';
import { SessionWithCapacities } from '../contexts/EventDataContext';

// --- DB Row Types for Realtime Payloads ---
export interface DbSessionRow { id: string; name: string; start_time: string; end_time: string; event_id: string; /* other direct columns */ }
export interface DbSessionBoothCapacityRow { id: string; session_id: string; booth_id: string; capacity: number; /* other direct columns */ }
export interface DbBoothRow { id: string; physical_id: string; company_name: string; event_id: string; access_code: string; email: string | null; phone: string | null; notes: string | null; }
export interface DbScanRecordRow { id: string; attendee_id: string; attendee_name: string | null; booth_id: string; booth_name: string | null; session_id: string | null; event_id: string; timestamp: string; notes: string | null; scan_type: ScanRecord['scanType']; device_id: string | null; }
type DbEventWithRelations = Database['public']['Tables']['events']['Row'] & {
  companies: Database['public']['Tables']['companies']['Row'] | null;
  plans: Pick<Database['public']['Tables']['plans']['Row'], "name"> | null;
};

// A generic type for a registration row that may or may not have joined relation data
export type DbSessionRegistrationRow = Database['public']['Tables']['session_registrations']['Row'] & {
  attendees?: { name?: string | null } | null;
  booths?: { company_name?: string | null } | null;
};

// --- Data Transformation Utilities ---
export const mapSessionFromDb = (dbSession: SessionWithCapacities): Session => ({
  id: dbSession.id,
  name: dbSession.name,
  startTime: dbSession.start_time,
  endTime: dbSession.end_time,
  eventId: dbSession.event_id,
  boothSettings: (dbSession.session_booth_capacities || []).map((cap) => ({
    boothId: cap.booth_id,
    capacity: cap.capacity
  })),
  sessionType: (dbSession as any).session_type || 'meeting',
  location: (dbSession as any).location,
  description: (dbSession as any).description,
  speaker: (dbSession as any).speaker,
  maxCapacity: (dbSession as any).max_capacity
});

export const mapBoothFromDb = (dbBooth: Database['public']['Tables']['booths']['Row']): Booth => ({
  id: dbBooth.id,
  physicalId: dbBooth.physical_id,
  companyName: dbBooth.company_name,
  eventId: dbBooth.event_id,
  accessCode: dbBooth.access_code,
  email: dbBooth.email,
  phone: dbBooth.phone,
  notes: dbBooth.notes,
  // Sponsor fields
  companyId: dbBooth.company_id,
  isSponsor: dbBooth.is_sponsor,
  sponsorshipTier: dbBooth.sponsorship_tier as 'platinum' | 'gold' | 'silver' | null,
  sponsorLogoUrl: dbBooth.sponsor_logo_url,
  sponsorWebsiteUrl: dbBooth.sponsor_website_url,
  sponsorDescription: dbBooth.sponsor_description,
});

export const mapAttendeeFromDb = (dbAttendee: Database['public']['Tables']['attendees']['Row']): Attendee => ({
  id: dbAttendee.id || '',
  name: dbAttendee.name || 'Unknown Attendee',
  email: dbAttendee.email ?? '',
  organization: dbAttendee.organization || '',
  phone: dbAttendee.phone ?? null,
  position: dbAttendee.position ?? null,
  notes: dbAttendee.notes ?? null,
  linkedin_url: dbAttendee.linkedin_url ?? null,
  avatar_url: dbAttendee.avatar_url ?? null,
  last_day_lunch: dbAttendee.last_day_lunch ?? null,
  is_veggie: dbAttendee.is_veggie ?? null,
  has_tour: dbAttendee.has_tour ?? null,
  is_vendor: dbAttendee.is_vendor ?? false,
  push_subscription: dbAttendee.push_subscription ?? null,
  metadata: dbAttendee.metadata ?? null,
});

export const mapScanRecordFromDb = (dbScanRecord: Database['public']['Tables']['scan_records']['Row']): ScanRecord => ({
  id: dbScanRecord.id,
  attendeeId: dbScanRecord.attendee_id,
  attendeeName: dbScanRecord.attendee_name ?? undefined,
  boothId: dbScanRecord.booth_id,
  boothName: dbScanRecord.booth_name ?? undefined,
  sessionId: dbScanRecord.session_id ?? null,
  eventId: dbScanRecord.event_id,
  timestamp: dbScanRecord.timestamp,
  notes: dbScanRecord.notes ?? undefined,
  scanType: dbScanRecord.scan_type as ScanRecord['scanType'],
  deviceId: dbScanRecord.device_id ?? undefined,
  scanStatus: (dbScanRecord as any).scan_status || undefined,
  expectedBoothId: (dbScanRecord as any).expected_booth_id || undefined,
  expectedBoothName: undefined // Will be populated via join if needed
});

export const mapSessionRegistrationFromDb = (dbReg: DbSessionRegistrationRow): SessionRegistration => ({
  id: dbReg.id,
  eventId: dbReg.event_id,
  sessionId: dbReg.session_id,
  attendeeId: dbReg.attendee_id,
  attendeeName: dbReg.attendees?.name || undefined,
  expectedBoothId: dbReg.expected_booth_id || undefined,
  status: dbReg.status as SessionRegistration['status'],
  registrationTime: dbReg.registration_time,
  actualScanId: dbReg.actual_scan_id || undefined,
});

export const mapEventFromDb = (dbEvent: DbEventWithRelations): Event => ({
  id: dbEvent.id,
  name: dbEvent.name,
  clientCompanyId: dbEvent.company_id ?? '',
  companyName: dbEvent.companies?.name || null,
  companyLogoUrl: dbEvent.companies?.logo_url || null,
  eventLogoUrl: dbEvent.event_logo_url,
  startDate: dbEvent.start_date ?? '',
  endDate: dbEvent.end_date ?? '',
  location: dbEvent.location,
  planId: dbEvent.plan_id,
  planName: dbEvent.plans?.name || 'N/A',
  isActive: dbEvent.is_active ?? true,
  mainSponsorId: dbEvent.main_sponsor_id,
  eventType: (dbEvent as any).event_type || 'vendor_meetings', // NEW: Default to vendor_meetings for backward compat
  timezone: (dbEvent as any).timezone || 'America/Chicago', // NEW: Default timezone
});