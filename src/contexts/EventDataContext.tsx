// src/contexts/EventDataContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { Session, Booth, Attendee, ScanRecord, Event, SessionRegistration, PendingScanPayload } from '../types';
import { supabase } from '../supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload, PostgrestError } from '@supabase/supabase-js';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import * as localDb from '../utils/localDb';
import { toast } from 'react-hot-toast';
import { mapSessionFromDb, mapBoothFromDb, mapAttendeeFromDb, mapScanRecordFromDb, mapSessionRegistrationFromDb } from '../utils/dataMappers';
import { getActiveSessionDetails, ActiveSessionReturn, GRACE_PERIOD_FOR_REGULAR_SCAN } from '../utils/sessionUtils';
import { Json, Database } from '../database.types';


// --- Helper Sort Functions ---
const sortSessions = (sessions: Session[]): Session[] => {
  return [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

const sortBooths = (booths: Booth[]): Booth[] => {
  return [...booths].sort((a, b) => a.physicalId.localeCompare(b.physicalId, undefined, { numeric: true, sensitivity: 'base' }));
};

const sortAttendees = (attendees: (Attendee & { checkInTime: string | null })[]): (Attendee & { checkInTime: string | null })[] => {
  return [...attendees].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export type SessionWithCapacities = Database['public']['Tables']['sessions']['Row'] & {
  session_booth_capacities: Pick<Database['public']['Tables']['session_booth_capacities']['Row'], 'booth_id' | 'capacity'>[];
};

interface EventDataContextType {
  sessions: Session[];
  scans: ScanRecord[];
  pendingScans: PendingScanPayload[];
  booths: Booth[];
  attendees: (Attendee & { checkInTime: string | null })[];
  loadingData: boolean;
  dataError: string | null;
  isSyncing: boolean;
  realtimeEnabled: boolean;
  realtimeConnected: boolean;
  changedBoothIds: Set<string>;
  fetchData: (isInitialLoad?: boolean) => Promise<void>;
  addSession: (sessionName: string, startTime: string, endTime: string, details?: Partial<Session>) => Promise<{ success: boolean, message: string, newSession?: Session }>;
  updateSession: (updatedSession: Session) => Promise<{ success: boolean, message: string, updatedSession?: Session }>;
  deleteSession: (sessionId: string) => Promise<{ success: boolean, message: string }>; // Added
  addScan: (attendeeId: string, boothId: string, notes?: string, deviceId?: string) => Promise<{ success: boolean, message: string, scan?: ScanRecord, wasOffline: boolean }>;
  deleteScan: (scanId: string) => Promise<{ success: boolean, message: string }>;
  getBoothById: (boothId: string) => Booth | undefined;
  getBoothName: (boothId: string) => string | undefined;
  activeBoothsForSession: (sessionId: string) => Promise<Booth[]>;
  allConfiguredBooths: Booth[];
  clearAllEventDataFromSupabase: () => Promise<{ success: boolean; message: string }>;
  addBooth: (physicalId: string, companyName: string) => Promise<{ success: boolean; message: string; newBooth?: Booth }>;
  updateBooth: (updatedBooth: Partial<Booth> & { id: string }) => Promise<{ success: boolean; message: string; updatedBooth?: Booth }>;
  deleteBooth: (boothId: string) => Promise<{ success: boolean; message: string }>;
  regenerateAllBoothAccessCodes: () => Promise<{ success: boolean; message: string }>;
  getOperationalSessionDetails: (currentTime?: Date, gracePeriodMinutes?: number) => ActiveSessionReturn;
  findOrCreateAttendeesBatch: (attendeesToProcess: { firstName: string, lastName: string, email?: string; organization: string; metadata?: Json | null }[]) => Promise<{ success: boolean; attendees: Attendee[]; errors: string[] }>;
  addSessionRegistrationsBatch: (registrations: Omit<SessionRegistration, 'id' | 'registrationTime' | 'attendeeName'>[]) => Promise<{ success: boolean; message: string; createdCount: number }>;
  getSessionRegistrationsForSession: (sessionId: string) => Promise<{ success: boolean; data: (SessionRegistration & { boothName?: string })[]; message?: string }>;
  getSessionRegistrationsForAttendee: (attendeeId: string) => Promise<{ success: boolean; data: (SessionRegistration & { sessionName: string, sessionStartTime: string, boothName?: string, boothDetails?: { physicalId: string } })[]; message?: string }>;
  getAttendeeById: (attendeeId: string) => Promise<Attendee | null>;
  searchGlobalAttendees: (searchTerm: string) => Promise<Attendee[]>;
  updateSessionBoothAssignments: (sessionId: string, boothId: string, newAttendeeIds: string[]) => Promise<{ success: boolean; message: string; }>;
  addSessionRegistration: (registrationData: Omit<SessionRegistration, 'id' | 'registrationTime' | 'attendeeName' | 'eventId'>) => Promise<{ success: boolean; message: string; newRegistration?: SessionRegistration }>;
  updateSessionRegistration: (registrationId: string, updates: Partial<Pick<SessionRegistration, 'expectedBoothId' | 'status'>>) => Promise<{ success: boolean; message: string; updatedRegistration?: SessionRegistration }>;
  deleteSessionRegistration: (registrationId: string) => Promise<{ success: boolean; message: string }>;
  addBoothsBatch: (booths: Pick<Booth, 'physicalId' | 'companyName'>[]) => Promise<{ success: boolean; data: Booth[]; errors: { physicalId: string, error: string }[] }>;
  addSessionsBatch: (sessions: { name: string; startTime: string; endTime: string }[]) => Promise<{ success: boolean; data: Session[]; errors: { name: string, error: string }[] }>;
  updateAttendee: (attendeeId: string, updates: Database['public']['Tables']['attendees']['Update']) => Promise<{ success: boolean; message: string; updatedAttendee?: Attendee }>;
  markAttendeesAsVendors: (attendeeIds: string[]) => Promise<{ success: boolean; message: string }>;
  markAttendeesAsNonVendors: (attendeeIds: string[]) => Promise<{ success: boolean; message: string }>;
  deleteAttendee: (attendeeId: string) => Promise<{ success: boolean; message: string }>;
  mergeAttendees: (primaryAttendeeId: string, duplicateIds: string[]) => Promise<{ success: boolean; message: string }>;
  getSessionNameById: (sessionId: string | null) => string;
  checkInAttendee: (attendeeId: string) => Promise<{ success: boolean; message: string }>;
  undoCheckIn: (attendeeId: string) => Promise<{ success: boolean; message: string }>;
  addWalkInAttendee: (newAttendee: Omit<Partial<Attendee>, 'id' | 'checkInTime' | 'organization'> & { name: string, email: string, organization: string }) => Promise<{ success: boolean; message: string; newAttendee?: Attendee }>;
  getVendorsForBooth: (companyName: string) => Promise<Attendee[]>;
  addSessionBoothCapacitiesBatch: (capacities: Database['public']['Tables']['session_booth_capacities']['Insert'][]) => Promise<{ success: boolean; message: string; createdCount: number }>;
  findOrCreateTracksAndAssignAttendees: (assignments: { attendeeId: string; trackName: string }[]) => Promise<{ success: boolean; message: string; createdTracksCount: number; assignedAttendeesCount: number; }>;
  bulkAssignAttendeesToBooth: (sessionId: string, assignments: Array<{ attendeeId: string; boothId: string }>) => Promise<{ success: boolean; message: string; createdCount: number }>;
}

const EventDataContext = createContext<EventDataContextType | undefined>(undefined);

// Specific return type for the getSessionRegistrationsForAttendee query
type AttendeeRegistrationWithDetails = Database['public']['Tables']['session_registrations']['Row'] & {
  attendees: {
    name: string;
  } | null;
  sessions: {
    name: string;
    start_time: string;
  } | null;
  booths: {
    company_name: string;
    physical_id: string;
  } | null;
};

// Specific return type for getSessionRegistrationsForSession query
type SessionRegWithDetails = Database['public']['Tables']['session_registrations']['Row'] & {
  attendees: {
    name: string;
    is_vendor: boolean;  // Added for filtering vendor staff
  } | null;
  booths: {
    company_name: string;
  } | null;
};

type EventAttendeeLink = Pick<Database['public']['Tables']['event_attendees']['Row'], 'attendee_id' | 'check_in_time'>;


export const EventDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedEventId, currentEvent } = useSelectedEvent();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [pendingScans, setPendingScans] = useState<PendingScanPayload[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [attendees, setAttendees] = useState<(Attendee & { checkInTime: string | null })[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [changedBoothIds, setChangedBoothIds] = useState<Set<string>>(new Set());

  const processingScansRef = useRef<Set<string>>(new Set());
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData: EventDataContextType['fetchData'] = useCallback(async (isInitialLoad = false) => {
    if (!selectedEventId) {
      setSessions([]); setScans([]); setBooths([]); setAttendees([]);
      setLoadingData(false);
      return;
    }

    if (isInitialLoad) setLoadingData(true);
    setDataError(null);
    try {
      const { data: boothsData, error: boothsError } = await supabase.from('booths').select('*').eq('event_id', selectedEventId);
      if (boothsError) throw new Error(`Booths: ${boothsError.message}`);

      const { data: scansData, error: scansError } = await supabase.from('scan_records').select('*').eq('event_id', selectedEventId);
      if (scansError) throw new Error(`Scans: ${scansError.message}`);

      const { data: eventAttendeeLinksData, error: eventAttendeeLinksError } = await supabase.from('event_attendees').select('attendee_id, check_in_time').eq('event_id', selectedEventId);
      if (eventAttendeeLinksError) throw new Error(`Attendee Links: ${eventAttendeeLinksError.message}`);

      const { data: sessionsData, error: sessionsError } = await supabase.from('sessions').select('id, name, start_time, end_time, event_id, session_booth_capacities(booth_id, capacity)').eq('event_id', selectedEventId).returns<SessionWithCapacities[]>();
      if (sessionsError) throw new Error(`Sessions: ${sessionsError.message}`);

      setBooths(sortBooths((boothsData ?? []).map(mapBoothFromDb)));
      setScans((scansData ?? []).map(mapScanRecordFromDb));

      const eventAttendeeLinks: EventAttendeeLink[] = eventAttendeeLinksData || [];

      if (eventAttendeeLinks.length === 0) {
        setAttendees([]);
      } else {
        const checkInTimes = new Map<string, string | null>();
        const attendeeIds = eventAttendeeLinks.map(link => {
          checkInTimes.set(link.attendee_id, link.check_in_time);
          return link.attendee_id;
        });
        const { data: attendeeProfiles, error: attendeeError } = await supabase.from('attendees').select('*').in('id', attendeeIds);
        if (attendeeError) throw new Error(`Attendee Profiles: ${attendeeError.message}`);

        // Fetch latest email statuses
        const { data: emailStatuses, error: emailError } = await supabase.rpc('get_latest_email_statuses', { p_event_id: selectedEventId });
        if (emailError) console.error("Failed to fetch email statuses:", emailError); // Log but don't fail full load

        const emailStatusMap = new Map();
        if (emailStatuses) {
          emailStatuses.forEach((stat: any) => {
            emailStatusMap.set(stat.attendee_id, stat);
          });
        }

        setAttendees(sortAttendees((attendeeProfiles ?? []).map((attendee) => {
          const emailStat = emailStatusMap.get(attendee.id);
          return {
            ...mapAttendeeFromDb(attendee),
            checkInTime: checkInTimes.get(attendee.id) ?? null,
            lastEmailStatus: emailStat?.status,
            lastEmailSentAt: emailStat?.sent_at
          };
        })));
      }

      setSessions(sortSessions((sessionsData ?? []).map(mapSessionFromDb)));

    } catch (error: any) {
      console.error("EventDataContext: Error fetching data", error);
      setDataError(error.message || "Failed to load event data.");
    } finally {
      if (isInitialLoad) setLoadingData(false);
    }
  }, [selectedEventId]);

  // Debounced version of fetchData to prevent request floods during bulk operations
  // Batches rapid changes into a single refresh after 500ms of inactivity
  const debouncedFetchData = useCallback(() => {
    // Clear any pending timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Schedule new fetch after 500ms
    debounceTimeoutRef.current = setTimeout(() => {
      fetchData(false);
      debounceTimeoutRef.current = null;
    }, 500);
  }, [fetchData]);

  const getOperationalSessionDetails: EventDataContextType['getOperationalSessionDetails'] = useCallback((currentTime = new Date(), gracePeriodMinutes = GRACE_PERIOD_FOR_REGULAR_SCAN) => getActiveSessionDetails(sessions, currentTime, gracePeriodMinutes), [sessions]);

  const _performScanUpload = useCallback(async (payload: Omit<PendingScanPayload, 'localId'>): Promise<{ success: boolean; message: string; scan?: ScanRecord }> => {
    const { eventId, attendeeId, boothId, notes, deviceId } = payload;
    if (!eventId) return { success: false, message: "Internal error: Event ID missing." };

    const { data: attendeeData, error: attendeeFetchError } = await supabase.from('attendees').select('id, name').eq('id', attendeeId).maybeSingle();
    if (attendeeFetchError) return { success: false, message: `Failed to fetch attendee: ${attendeeFetchError.message}` };
    if (!attendeeData) return { success: false, message: `Attendee with ID ${attendeeId} not found in the central database.` };
    const attendeeName = attendeeData.name;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentScan } = await supabase.from('scan_records').select('id').eq('attendee_id', attendeeId).eq('booth_id', boothId).gte('timestamp', fiveMinutesAgo).limit(1);
    if (recentScan && recentScan.length > 0) return { success: false, message: `Frequent Scan: ${attendeeName} was already scanned at this booth recently.` };

    const operationalDetails = getOperationalSessionDetails(new Date(payload.timestamp), GRACE_PERIOD_FOR_REGULAR_SCAN);
    let effectiveSessionId: string | null = operationalDetails.session?.id || null;
    let scanType: ScanRecord['scanType'] = 'regular';

    const { data: boothRegistrations } = await supabase
      .from('session_registrations')
      .select('id')
      .eq('session_id', effectiveSessionId || '')
      .eq('expected_booth_id', boothId);

    if (!effectiveSessionId || !boothRegistrations || boothRegistrations.length === 0) {
      scanType = 'out_of_schedule';
    }

    const currentBooth = booths.find(b => b.id === boothId);

    const newScanPayload: Database['public']['Tables']['scan_records']['Insert'] = {
      event_id: eventId,
      attendee_id: attendeeId,
      attendee_name: attendeeName ?? null,
      booth_id: boothId,
      booth_name: currentBooth?.companyName ?? null,
      session_id: effectiveSessionId,
      notes: notes ?? null,
      device_id: deviceId ?? null,
      scan_type: scanType,
      timestamp: payload.timestamp
    };

    const { data: createdScanData, error } = await supabase.from('scan_records').insert(newScanPayload).select().single();
    if (error || !createdScanData) return { success: false, message: `Failed to save scan: ${error?.message}` };

    const newScan = mapScanRecordFromDb(createdScanData);

    if (newScan.sessionId && newScan.scanType === 'regular') {
      await supabase.rpc('link_scan_to_registration', { p_attendee_id: newScan.attendeeId, p_session_id: newScan.sessionId, p_scan_id: newScan.id });
    }

    let feedbackMessage = `${newScan.attendeeName || 'Attendee'} scanned at ${newScan.boothName || 'booth'}.`;
    if (newScan.scanType === 'out_of_schedule') feedbackMessage += ' (Note: Outside of any scheduled session time/location)';

    return { success: true, message: feedbackMessage, scan: newScan };
  }, [sessions, booths, getOperationalSessionDetails]);

  const syncPendingScans = useCallback(async (): Promise<void> => {
    if (isSyncing) return;
    setIsSyncing(true);
    const scansToSync = await localDb.getPendingScans();
    if (scansToSync.length === 0) { setIsSyncing(false); return; }

    toast.loading(`Syncing ${scansToSync.length} offline scan(s)...`, { id: 'sync' });
    let successCount = 0;

    for (const pending of scansToSync) {
      const result = await _performScanUpload(pending);
      if (result.success) {
        await localDb.deletePendingScan(pending.localId);
        successCount++;
      } else {
        console.error(`Failed to sync scan ${pending.localId}:`, result.message);
      }
    }
    setPendingScans(await localDb.getPendingScans());

    if (successCount > 0) fetchData(false);

    toast.success(`${successCount} scan(s) synced! ${scansToSync.length - successCount} failed.`, { id: 'sync' });
    setIsSyncing(false);
  }, [_performScanUpload, fetchData, isSyncing]);

  useEffect(() => {
    window.addEventListener('online', syncPendingScans);
    return () => window.removeEventListener('online', syncPendingScans);
  }, [syncPendingScans]);

  useEffect(() => {
    console.log('🔵 [EventDataContext] useEffect triggered', { selectedEventId, hasSelectedEventId: !!selectedEventId });

    if (selectedEventId) {
      console.log('🔵 [EventDataContext] Calling fetchData(true) for event:', selectedEventId);
      fetchData(true);
      localDb.getPendingScans().then(setPendingScans);
    } else {
      console.log('⚠️ [EventDataContext] No selectedEventId, clearing data');
      setLoadingData(false); setSessions([]); setScans([]); setBooths([]); setAttendees([]);
    }

    const channelName = `event-data-${selectedEventId || 'none'}`;
    if (realtimeChannelRef.current?.topic === channelName) return;

    if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);

    if (selectedEventId && realtimeEnabled) {
      const channel = supabase.channel(channelName);

      channel
        // Enhanced: Specific handler for scan inserts (instant updates)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'scan_records',
          filter: `event_id=eq.${selectedEventId}`
        }, (payload) => {
          console.log('🔴 REALTIME SCAN INSERT:', payload.new);

          // Add new scan to state immediately
          const newScan = mapScanRecordFromDb(payload.new as any);
          setScans(prev => [...prev, newScan]);

          // Mark booth as recently changed for highlighting
          if (newScan.boothId) {
            setChangedBoothIds(prev => new Set(prev).add(newScan.boothId || ''));

            // Auto-remove highlight after 5 seconds
            setTimeout(() => {
              setChangedBoothIds(prev => {
                const next = new Set(prev);
                next.delete(newScan.boothId || '');
                return next;
              });
            }, 5000);
          }
        })
        // Other table changes (debounced refresh to prevent request floods)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, () => debouncedFetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, () => debouncedFetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => debouncedFetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'booths' }, () => debouncedFetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'session_registrations' }, () => debouncedFetchData())
        .subscribe((status) => {
          console.log('🔴 Realtime connection status:', status);
          setRealtimeConnected(status === 'SUBSCRIBED');
        });

      realtimeChannelRef.current = channel;
    }

    return () => {
      if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    };
  }, [selectedEventId, fetchData, debouncedFetchData, realtimeEnabled]);

  const addScan: EventDataContextType['addScan'] = useCallback(async (attendeeId, boothId, notes, deviceId) => {
    if (!selectedEventId) return { success: false, message: "No event selected.", wasOffline: false };

    const payload: PendingScanPayload = {
      localId: `${Date.now()}-${attendeeId}`, eventId: selectedEventId, attendeeId, boothId,
      timestamp: new Date().toISOString(), notes, deviceId,
      attendeeName: attendees.find(a => a.id === attendeeId)?.name,
      boothName: booths.find(b => b.id === boothId)?.companyName,
    };

    if (!navigator.onLine) {
      await localDb.addPendingScan(payload);
      setPendingScans(prev => [payload, ...prev]);
      return { success: true, message: `Offline: Scan for ${payload.attendeeName} saved locally.`, wasOffline: true };
    } else {
      const result = await _performScanUpload(payload);
      if (result.success) fetchData(false);
      return { ...result, wasOffline: false };
    }
  }, [selectedEventId, attendees, booths, _performScanUpload, fetchData]);

  const syncVendorsFromBooths = useCallback(async (): Promise<{ success: boolean; count: number; }> => {
    if (!selectedEventId) return { success: false, count: 0 };
    const { data, error } = await supabase.rpc('sync_vendors_from_booths', { p_event_id: selectedEventId });
    if (error) {
      console.error("Failed to sync vendors from booths:", error);
      return { success: false, count: 0 };
    }
    if (data && Number(data) > 0) {
      toast.success(`${data} profile(s) automatically marked as Vendor Staff.`, { icon: '🔄' });
    }
    return { success: true, count: Number(data) || 0 };
  }, [selectedEventId]);

  const updateAttendee: EventDataContextType['updateAttendee'] = useCallback(async (attendeeId, updates) => {
    const { data, error } = await supabase.from('attendees').update(updates).eq('id', attendeeId).select().single();
    if (error || !data) return { success: false, message: error?.message || 'Failed to update attendee data.' };
    const updated = mapAttendeeFromDb(data);
    await syncVendorsFromBooths();
    await fetchData(false);
    return { success: true, message: "Attendee updated.", updatedAttendee: updated };
  }, [fetchData, syncVendorsFromBooths]);

  const addWalkInAttendee: EventDataContextType['addWalkInAttendee'] = useCallback(async (newAttendee) => {
    if (!selectedEventId) return { success: false, message: "No event selected" };

    const payload: Database['public']['Tables']['attendees']['Insert'] = {
      name: newAttendee.name,
      email: newAttendee.email,
      organization: newAttendee.organization || '',
      phone: newAttendee.phone ?? null,
      position: newAttendee.position ?? null,
      notes: newAttendee.notes ?? null,
      last_day_lunch: newAttendee.last_day_lunch ?? null,
      is_veggie: newAttendee.is_veggie ?? null,
      has_tour: newAttendee.has_tour ?? null,
      is_vendor: newAttendee.is_vendor ?? false,
      push_subscription: newAttendee.push_subscription ?? null,
      metadata: newAttendee.metadata ?? null,
    };

    const { data: createdAttendeeData, error: attendeeError } = await supabase.from('attendees').insert(payload).select().single();
    if (attendeeError || !createdAttendeeData) {
      if (attendeeError?.code === '23505') {
        return { success: false, message: `An attendee with email '${newAttendee.email}' already exists.` };
      }
      return { success: false, message: attendeeError?.message ?? 'Failed to create attendee' };
    }

    const linkPayload: Database['public']['Tables']['event_attendees']['Insert'] = { event_id: selectedEventId, attendee_id: createdAttendeeData.id };
    const { error: linkError } = await supabase.from('event_attendees').insert(linkPayload);
    if (linkError) {
      await supabase.from('attendees').delete().eq('id', createdAttendeeData.id);
      return { success: false, message: `Attendee creation failed during event linking: ${linkError.message}` };
    }

    await syncVendorsFromBooths();
    await fetchData(false);
    return { success: true, message: "Walk-in attendee added.", newAttendee: mapAttendeeFromDb(createdAttendeeData) };
  }, [selectedEventId, fetchData, syncVendorsFromBooths]);

  const markAttendeesAsVendors: EventDataContextType['markAttendeesAsVendors'] = useCallback(async (attendeeIds) => {
    if (attendeeIds.length === 0) {
      return { success: true, message: "No attendees selected." };
    }
    const payload: Database['public']['Tables']['attendees']['Update'] = { is_vendor: true };
    const { error } = await supabase.from('attendees').update(payload).in('id', attendeeIds);

    if (error) {
      console.error("Error marking attendees as vendors:", error);
      return { success: false, message: `Failed to mark vendors: ${error.message}` };
    }

    await fetchData(false);

    return { success: true, message: `${attendeeIds.length} attendee(s) marked as vendors.` };
  }, [fetchData]);

  const markAttendeesAsNonVendors: EventDataContextType['markAttendeesAsNonVendors'] = useCallback(async (attendeeIds) => {
    if (attendeeIds.length === 0) {
      return { success: true, message: "No attendees selected." };
    }
    const payload: Database['public']['Tables']['attendees']['Update'] = { is_vendor: false };
    const { error } = await supabase.from('attendees').update(payload).in('id', attendeeIds);

    if (error) {
      console.error("Error marking attendees as non-vendors:", error);
      return { success: false, message: `Failed to mark as attendees: ${error.message}` };
    }

    await fetchData(false);

    return { success: true, message: `${attendeeIds.length} profile(s) marked as regular attendees.` };
  }, [fetchData]);

  const getBoothById: EventDataContextType['getBoothById'] = useCallback((boothId) => booths.find(b => b.id === boothId), [booths]);
  const getBoothName: EventDataContextType['getBoothName'] = useCallback((boothId) => getBoothById(boothId)?.companyName, [getBoothById]);

  const allConfiguredBooths = useMemo(() => booths, [booths]);

  const generateAccessCode = useCallback(() => {
    if (!currentEvent) return ''; // Should not happen if selectedEventId is checked
    const baseCode = (currentEvent.companyName || currentEvent.name).substring(0, 4).toUpperCase();
    return `${baseCode}-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
  }, [currentEvent]);

  // --- BOOTH MANAGEMENT ---
  const addBooth: EventDataContextType['addBooth'] = useCallback(async (physicalId, companyName) => {
    if (!selectedEventId) return { success: false, message: "No event selected." };

    console.log('🔵 [addBooth] Starting...');
    console.log('🔵 [addBooth] Sessions available:', sessions.length);
    console.log('🔵 [addBooth] Sessions:', sessions.map(s => ({ id: s.id, name: s.name })));

    // Prevent duplicate physical IDs
    if (booths.some(b => b.physicalId.toLowerCase() === physicalId.toLowerCase())) {
      return { success: false, message: `Booth with Physical ID "${physicalId}" already exists.` };
    }

    try {
      // Generate access code
      const accessCode = generateAccessCode();

      const newBoothPayload: Database['public']['Tables']['booths']['Insert'] = {
        event_id: selectedEventId,
        physical_id: physicalId,
        company_name: companyName,
        access_code: accessCode,
      };

      console.log('🔵 [addBooth] Creating booth in DB...');
      const { data: createdBoothData, error } = await supabase.from('booths').insert(newBoothPayload).select().single();
      if (error || !createdBoothData) {
        console.error('❌ [addBooth] Failed to create booth:', error);
        return { success: false, message: `Failed to create booth: ${error?.message}` };
      }

      const newBooth = mapBoothFromDb(createdBoothData);
      console.log('✅ [addBooth] Booth created:', newBooth.id);

      // NEW: Auto-link to all existing sessions with default capacity 0
      if (sessions.length > 0) {
        console.log('🔵 [addBooth] Auto-linking to', sessions.length, 'session(s)...');

        const capacitiesToInsert = sessions.map(session => ({
          session_id: session.id,
          booth_id: newBooth.id,
          capacity: 3 // Default capacity - reasonable default for meetings
        }));

        console.log('🔵 [addBooth] Capacities to insert:', capacitiesToInsert);

        const { data: insertedCapacities, error: capacityError } = await supabase
          .from('session_booth_capacities')
          .insert(capacitiesToInsert)
          .select();

        if (capacityError) {
          console.error('❌ [addBooth] Failed to auto-link:', capacityError);
          // Don't fail the whole operation, just warn
        } else {
          console.log('✅ [addBooth] Auto-linked successfully:', insertedCapacities);
        }
      } else {
        console.warn('⚠️ [addBooth] No sessions found to link booth to');
      }

      console.log('🔵 [addBooth] Refreshing data...');
      await fetchData(false);
      console.log('✅ [addBooth] Data refreshed');

      return {
        success: true,
        message: `Booth "${physicalId}" created successfully${sessions.length > 0 ? ` and linked to ${sessions.length} session(s)` : ''}.`,
        newBooth
      };
    } catch (err: any) {
      console.error('❌ [addBooth] Exception:', err);
      return { success: false, message: `Unexpected error: ${err.message}` };
    }
  }, [selectedEventId, booths, sessions, fetchData, generateAccessCode]);

  const regenerateAllBoothAccessCodes: EventDataContextType['regenerateAllBoothAccessCodes'] = useCallback(async () => {
    if (!selectedEventId || !currentEvent) {
      return { success: false, message: "No event selected." };
    }
    if (booths.length === 0) {
      return { success: true, message: "No booths to update." };
    }

    const baseCode = (currentEvent.companyName || currentEvent.name).replace(/\s+/g, '').toUpperCase();
    const eventYear = new Date().getFullYear();

    const updates: Database['public']['Tables']['booths']['Update'][] = booths.map((booth, index) => ({
      id: booth.id,
      physical_id: booth.physicalId,
      company_name: booth.companyName,
      event_id: booth.eventId,
      email: booth.email,
      phone: booth.phone,
      notes: booth.notes,
      access_code: `${baseCode}${eventYear}${index + 1}`
    }));

    const { error } = await supabase.from('booths').upsert(updates);

    if (error) {
      console.error("Failed to regenerate booth codes:", error);
      return { success: false, message: `Failed to update codes: ${error.message}` };
    }

    await fetchData(false);
    return { success: true, message: "All booth access codes have been regenerated." };
  }, [selectedEventId, currentEvent, booths, fetchData]);


  const updateBooth: EventDataContextType['updateBooth'] = useCallback(async (updatedBooth) => {
    const payload: Database['public']['Tables']['booths']['Update'] = {
      physical_id: updatedBooth.physicalId,
      company_name: updatedBooth.companyName,
      email: updatedBooth.email,
      phone: updatedBooth.phone,
      notes: updatedBooth.notes,
      access_code: updatedBooth.accessCode
    };
    const { data, error } = await supabase.from('booths').update(payload).eq('id', updatedBooth.id).select().single();
    if (error || !data) return { success: false, message: `Failed to update booth: ${error?.message}` };
    const changedBooth = mapBoothFromDb(data);
    await syncVendorsFromBooths();
    await fetchData(false);
    return { success: true, message: "Booth updated successfully.", updatedBooth: changedBooth };
  }, [fetchData, syncVendorsFromBooths]);

  const deleteBooth: EventDataContextType['deleteBooth'] = useCallback(async (boothId) => {
    const { error } = await supabase.from('booths').delete().eq('id', boothId);
    if (error) return { success: false, message: `Failed to delete booth: ${error.message}` };
    await fetchData(false);
    return { success: true, message: "Booth deleted successfully." };
  }, [fetchData]);

  // --- SESSION MANAGEMENT ---
  const addSession: EventDataContextType['addSession'] = useCallback(async (sessionName, startTime, endTime, details) => {
    if (!selectedEventId) return { success: false, message: "No event selected." };
    const payload: Database['public']['Tables']['sessions']['Insert'] = {
      name: sessionName,
      start_time: startTime,
      end_time: endTime,
      event_id: selectedEventId,
      session_type: details?.sessionType || 'meeting',
      location: details?.location,
      description: details?.description,
      speaker: details?.speaker,
      max_capacity: details?.maxCapacity
    };
    const { data: newSessionData, error: sessionError } = await supabase.from('sessions').insert(payload).select().single();

    if (sessionError || !newSessionData) {
      if (sessionError?.code === '23505') return { success: false, message: `A session with the name "${sessionName}" already exists.` };
      return { success: false, message: `Failed to create session: ${sessionError?.message ?? 'Unknown error'}` };
    }

    await fetchData(false);
    const createdSession = mapSessionFromDb(newSessionData as SessionWithCapacities);
    return { success: true, message: "Session created successfully.", newSession: createdSession };
  }, [selectedEventId, fetchData]);

  const updateSession: EventDataContextType['updateSession'] = useCallback(async (updatedSession) => {
    const sessionPayload: Database['public']['Tables']['sessions']['Update'] = {
      name: updatedSession.name,
      start_time: updatedSession.startTime,
      end_time: updatedSession.endTime,
      session_type: updatedSession.sessionType,
      location: updatedSession.location,
      description: updatedSession.description,
      speaker: updatedSession.speaker,
      max_capacity: updatedSession.maxCapacity
    };
    const { data, error: sessionError } = await supabase.from('sessions').update(sessionPayload).eq('id', updatedSession.id).select().single();
    if (sessionError) return { success: false, message: `Failed to update session: ${sessionError.message}` };

    await fetchData(false);
    return { success: true, message: 'Session updated successfully.', updatedSession: mapSessionFromDb(data as SessionWithCapacities) };
  }, [fetchData]);

  const deleteSession: EventDataContextType['deleteSession'] = useCallback(async (sessionId) => {
    const { error: deleteError } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (deleteError) return { success: false, message: `Failed to delete session: ${deleteError.message}` };
    await fetchData(false);
    return { success: true, message: 'Session deleted successfully.' };
  }, [fetchData]);

  type SessionAssignment = Pick<Database['public']['Tables']['session_registrations']['Row'], 'id' | 'attendee_id' | 'expected_booth_id'>;

  const updateSessionBoothAssignments: EventDataContextType['updateSessionBoothAssignments'] = useCallback(async (sessionId, boothId, newAttendeeIds) => {
    if (!selectedEventId) return { success: false, message: "No event selected" };

    const { data, error: fetchError } = await supabase
      .from('session_registrations')
      .select('id, attendee_id, expected_booth_id')
      .eq('session_id', sessionId);

    if (fetchError) {
      return { success: false, message: `Failed to fetch current assignments: ${fetchError.message}` };
    }
    const currentRegistrations: SessionAssignment[] = data || [];

    const currentAssignmentsForThisBooth = currentRegistrations.filter(r => r.expected_booth_id === boothId).map(r => r.attendee_id);
    const newAttendeeIdSet = new Set(newAttendeeIds);
    const currentAttendeeIdSet = new Set(currentAssignmentsForThisBooth);

    const attendeesToRemoveAssignment = currentAssignmentsForThisBooth.filter(id => !newAttendeeIdSet.has(id));
    const attendeesToAddAssignment = newAttendeeIds.filter(id => !currentAttendeeIdSet.has(id));

    const upsertPayloads: Database['public']['Tables']['session_registrations']['Insert'][] = attendeesToAddAssignment.map(attendeeId => ({
      event_id: selectedEventId,
      session_id: sessionId,
      attendee_id: attendeeId,
      expected_booth_id: boothId,
      status: 'Registered' as const,
    }));

    const promises = [];

    if (attendeesToRemoveAssignment.length > 0) {
      const updatePayload: Database['public']['Tables']['session_registrations']['Update'] = { expected_booth_id: null };
      promises.push(
        supabase
          .from('session_registrations')
          .update(updatePayload)
          .eq('session_id', sessionId)
          .in('attendee_id', attendeesToRemoveAssignment)
      );
    }

    if (upsertPayloads.length > 0) {
      promises.push(
        supabase
          .from('session_registrations')
          .upsert(upsertPayloads, { onConflict: 'event_id,session_id,attendee_id' })
      );
    }

    if (promises.length === 0) {
      return { success: true, message: "No changes to assignments were needed." };
    }

    const results = await Promise.all(promises);
    const errors = results.map(r => r.error).filter((e): e is PostgrestError => e !== null);

    if (errors.length > 0) {
      const errorMessage = errors.map(e => e.message).join(', ');
      return { success: false, message: `Failed to update assignments: ${errorMessage}` };
    }

    fetchData(false);
    return { success: true, message: "Assignments updated successfully." };
  }, [selectedEventId, fetchData]);

  // --- SCAN & ATTENDEE MANAGEMENT ---
  const deleteScan: EventDataContextType['deleteScan'] = useCallback(async (scanId) => {
    const { error } = await supabase.from('scan_records').delete().eq('id', scanId);
    if (error) return { success: false, message: `Failed to delete scan: ${error.message}` };
    await fetchData(false);
    return { success: true, message: 'Scan deleted.' };
  }, [fetchData]);

  const deleteAttendee: EventDataContextType['deleteAttendee'] = useCallback(async (attendeeId) => {
    const { error } = await supabase.from('attendees').delete().eq('id', attendeeId);
    if (error) return { success: false, message: `Failed to delete attendee: ${error.message}` };
    await fetchData(false);
    return { success: true, message: 'Attendee and all related data deleted.' };
  }, [fetchData]);

  const mergeAttendees: EventDataContextType['mergeAttendees'] = useCallback(async (primaryAttendeeId, duplicateIds) => {
    const { error } = await supabase.rpc('merge_attendees', { primary_id: primaryAttendeeId, duplicate_ids: duplicateIds });
    if (error) return { success: false, message: `Merge failed: ${error.message}` };
    await fetchData(false);
    return { success: true, message: 'Attendees merged successfully.' };
  }, [fetchData]);

  type ExistingBooth = Pick<Database['public']['Tables']['booths']['Row'], 'id' | 'physical_id' | 'access_code'>;

  // --- BATCH IMPORTS ---
  const addBoothsBatch: EventDataContextType['addBoothsBatch'] = useCallback(async (boothsData) => {
    if (!selectedEventId || !currentEvent) {
      return { success: false, data: [], errors: [{ physicalId: 'N/A', error: 'No event selected or event details missing.' }] };
    }

    const { data: existingBoothsData, error: fetchError } = await supabase
      .from('booths')
      .select('id, physical_id, access_code')
      .eq('event_id', selectedEventId);

    if (fetchError) {
      const errorList = boothsData.map(b => ({ physicalId: b.physicalId, error: `Failed to fetch existing booths: ${fetchError.message}` }));
      return { success: false, data: [], errors: errorList };
    }
    const existingBooths: ExistingBooth[] = existingBoothsData || [];

    const existingBoothsMap = new Map(existingBooths.map(b => [b.physical_id.toLowerCase(), b]));

    const generateUniqueCode = () => `${(currentEvent.companyName || currentEvent.name).substring(0, 4).toUpperCase()}-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;

    const boothsToUpsert: Database['public']['Tables']['booths']['Insert'][] = boothsData.map(boothFromFile => {
      const existingBooth = existingBoothsMap.get(boothFromFile.physicalId.toLowerCase());
      if (existingBooth) {
        return {
          id: existingBooth.id,
          physical_id: boothFromFile.physicalId,
          company_name: boothFromFile.companyName,
          event_id: selectedEventId,
          access_code: existingBooth.access_code,
        };
      } else {
        return {
          physical_id: boothFromFile.physicalId,
          company_name: boothFromFile.companyName,
          event_id: selectedEventId,
          access_code: generateUniqueCode(),
        };
      }
    });

    if (boothsToUpsert.length === 0) {
      return { success: true, data: [], errors: [] };
    }

    const { data, error } = await supabase
      .from('booths')
      .upsert(boothsToUpsert)
      .select();

    if (error) {
      const errorList = boothsData.map(b => ({ physicalId: b.physicalId, error: error.message }));
      return { success: false, data: [], errors: errorList };
    }

    const createdBooths = (data || []).map(b => mapBoothFromDb(b));
    await syncVendorsFromBooths();
    await fetchData(false);
    return { success: true, data: createdBooths, errors: [] };

  }, [selectedEventId, currentEvent, fetchData, syncVendorsFromBooths]);

  const addSessionsBatch: EventDataContextType['addSessionsBatch'] = useCallback(async (sessionsData) => {
    if (!selectedEventId) {
      return { success: false, data: [], errors: [{ name: 'N/A', error: 'No event selected' }] };
    }

    const uniqueSessions = Array.from(
      new Map(sessionsData.map(s => [s.name.toLowerCase(), s])).values()
    );

    const sessionsToUpsert: Database['public']['Tables']['sessions']['Insert'][] = uniqueSessions.map(session => ({
      name: session.name,
      start_time: session.startTime,
      end_time: session.endTime,
      event_id: selectedEventId,
    }));

    if (sessionsToUpsert.length === 0) {
      return { success: true, data: [], errors: [] };
    }

    const { data, error } = await supabase
      .from('sessions')
      .upsert(sessionsToUpsert, { onConflict: 'event_id, name' })
      .select();

    if (error) {
      const errorList = uniqueSessions.map(s => ({ name: s.name, error: error.message }));
      return { success: false, data: [], errors: errorList };
    }

    const createdSessions = (data || []).map(s => mapSessionFromDb(s as SessionWithCapacities));
    await fetchData(false);
    return { success: true, data: createdSessions, errors: [] };

  }, [selectedEventId, fetchData]);

  const findOrCreateAttendeesBatch: EventDataContextType['findOrCreateAttendeesBatch'] = useCallback(async (attendeesToProcess) => {
    if (!selectedEventId) {
      return { success: false, attendees: [], errors: ['No event selected.'] };
    }

    const errors: string[] = [];

    // Step 1: Handle attendees with emails to check for existing profiles.
    const withEmail = attendeesToProcess.filter(p => p.email && p.email.trim() !== '');
    const emailsToFetch = withEmail.map(p => p.email!);

    const { data: existingByEmailData, error: fetchError } = emailsToFetch.length > 0
      ? await supabase.from('attendees').select('*').in('email', emailsToFetch).returns<Database['public']['Tables']['attendees']['Row'][]>()
      : { data: [], error: null };

    if (fetchError) {
      return { success: false, attendees: [], errors: [`DB Error fetching existing attendees: ${fetchError.message}`] };
    }

    const existingByEmailMap = new Map<string, Attendee>();
    (existingByEmailData || []).forEach(dbAttendee => {
      if (dbAttendee.email) {
        existingByEmailMap.set(dbAttendee.email.toLowerCase(), mapAttendeeFromDb(dbAttendee));
      }
    });

    const newAttendeesToCreate: Database['public']['Tables']['attendees']['Insert'][] = [];
    const finalAttendeeList: Attendee[] = [...existingByEmailMap.values()];

    // Step 2: Iterate through all attendees to decide who needs to be created.
    for (const p of attendeesToProcess) {
      const fullName = `${p.firstName} ${p.lastName}`.trim();

      if (p.email && p.email.trim() !== '') {
        // If they have an email but weren't found in the initial fetch, they are new.
        if (!existingByEmailMap.has(p.email.toLowerCase())) {
          newAttendeesToCreate.push({
            name: fullName,
            email: p.email,
            organization: p.organization || '',
            metadata: p.metadata || null,
          });
        }
      } else {
        // If they DON'T have an email, they are always considered new for this import.
        // Create a unique placeholder email to satisfy DB constraints.
        const placeholderEmail = `no-email.${Date.now()}.${Math.random().toString(36).substring(2, 11)}@lyventum.placeholder`;
        newAttendeesToCreate.push({
          name: fullName,
          email: placeholderEmail,
          organization: p.organization || '',
          metadata: p.metadata || null,
        });
      }
    }

    // Step 3: Batch insert all the new attendees.
    if (newAttendeesToCreate.length > 0) {
      const { data: createdData, error: createError } = await supabase
        .from('attendees')
        .insert(newAttendeesToCreate)
        .select();

      if (createError) {
        errors.push(`Failed to create new attendee profiles: ${createError.message}`);
      } else {
        finalAttendeeList.push(...(createdData || []).map(mapAttendeeFromDb));
      }
    }

    // Step 4: Link all relevant attendees to the current event.
    const allAttendeeIds = finalAttendeeList.map(a => a.id);
    if (allAttendeeIds.length > 0) {
      const linkPayload: Database['public']['Tables']['event_attendees']['Insert'][] = allAttendeeIds.map(id => ({ event_id: selectedEventId, attendee_id: id }));
      const { error: linkError } = await supabase.from('event_attendees').upsert(linkPayload, { onConflict: 'event_id, attendee_id' });
      if (linkError) {
        errors.push(`Failed to link attendees to the current event: ${linkError.message}`);
      }
    }

    // Step 5: Finalize and refetch data for UI consistency.
    await syncVendorsFromBooths();
    await fetchData(false);

    return { success: errors.length === 0, attendees: finalAttendeeList, errors };
  }, [selectedEventId, fetchData, syncVendorsFromBooths]);

  const addSessionRegistrationsBatch: EventDataContextType['addSessionRegistrationsBatch'] = useCallback(async (registrations) => {
    if (registrations.length === 0) return { success: true, message: 'No registrations to add.', createdCount: 0 };

    const payload: Database['public']['Tables']['session_registrations']['Insert'][] = registrations.map(r => ({
      event_id: r.eventId,
      session_id: r.sessionId,
      attendee_id: r.attendeeId,
      expected_booth_id: r.expectedBoothId ?? null,
      status: r.status,
      actual_scan_id: r.actualScanId ?? null
    }));

    const { error, count } = await supabase.from('session_registrations').upsert(payload, { onConflict: 'event_id, session_id, attendee_id' });
    if (error) return { success: false, message: `Failed to add registrations: ${error.message}`, createdCount: 0 };
    await fetchData(false);
    return { success: true, message: `${count || 0} registrations created or updated.`, createdCount: count || 0 };
  }, [fetchData]);

  const addSessionBoothCapacitiesBatch: EventDataContextType['addSessionBoothCapacitiesBatch'] = useCallback(async (capacities) => {
    if (capacities.length === 0) return { success: true, message: 'No capacities to update.', createdCount: 0 };
    const { error, count } = await supabase.from('session_booth_capacities').upsert(capacities, { onConflict: 'session_id,booth_id' });
    if (error) return { success: false, message: `Failed to update capacities: ${error.message}`, createdCount: 0 };
    return { success: true, message: 'Capacities updated.', createdCount: count || 0 };
  }, []);

  const getSessionNameById: EventDataContextType['getSessionNameById'] = useCallback((sessionId) => {
    if (!sessionId) return "N/A";
    const session = sessions.find(s => s.id === sessionId);
    return session?.name || "Unknown Session";
  }, [sessions]);

  const activeBoothsForSession: EventDataContextType['activeBoothsForSession'] = useCallback(async (sessionId) => {
    const { data } = await supabase.from('session_registrations').select('expected_booth_id').eq('session_id', sessionId).not('expected_booth_id', 'is', null);
    const boothIds = new Set((data || []).map(r => r.expected_booth_id as string));
    return booths.filter(b => boothIds.has(b.id));
  }, [booths]);

  const clearAllEventDataFromSupabase: EventDataContextType['clearAllEventDataFromSupabase'] = useCallback(async () => {
    if (!selectedEventId) return { success: false, message: "No event selected." };
    const { error } = await supabase.rpc('delete_event_and_related_data', { event_id_to_delete: selectedEventId });
    if (error) {
      console.error("Error clearing event data:", error);
      return { success: false, message: `Failed to clear event data: ${error.message}` };
    }
    await fetchData(true);
    return { success: true, message: "All event data cleared." };
  }, [selectedEventId, fetchData]);

  const getAttendeeById: EventDataContextType['getAttendeeById'] = useCallback(async (attendeeId) => {
    const { data, error } = await supabase.from('attendees').select('*').eq('id', attendeeId).single();
    return data ? mapAttendeeFromDb(data) : null;
  }, []);

  const searchGlobalAttendees: EventDataContextType['searchGlobalAttendees'] = useCallback(async (searchTerm) => {
    const { data, error } = await supabase.from('attendees').select('*').textSearch('name', searchTerm, { type: 'websearch' });
    return (data || []).map(mapAttendeeFromDb);
  }, []);

  const addSessionRegistration: EventDataContextType['addSessionRegistration'] = useCallback(async (registrationData) => {
    if (!selectedEventId) return { success: false, message: "No event selected." };
    const payload: Database['public']['Tables']['session_registrations']['Insert'] = {
      event_id: selectedEventId,
      session_id: registrationData.sessionId,
      attendee_id: registrationData.attendeeId,
      expected_booth_id: registrationData.expectedBoothId ?? null,
      status: registrationData.status,
      actual_scan_id: registrationData.actualScanId ?? null
    };
    const { data, error } = await supabase.from('session_registrations').insert(payload).select().single();
    if (error || !data) return { success: false, message: error?.message || 'Failed to add registration' };
    fetchData(false);
    return { success: true, message: "Registration added.", newRegistration: mapSessionRegistrationFromDb(data) };
  }, [selectedEventId, fetchData]);

  const updateSessionRegistration: EventDataContextType['updateSessionRegistration'] = useCallback(async (registrationId, updates) => {
    const payload: Database['public']['Tables']['session_registrations']['Update'] = { expected_booth_id: updates.expectedBoothId, status: updates.status };
    const { data, error } = await supabase.from('session_registrations').update(payload).eq('id', registrationId).select().single();
    if (error || !data) return { success: false, message: error?.message || 'Failed to update registration' };
    fetchData(false);
    return { success: true, message: "Registration updated.", updatedRegistration: mapSessionRegistrationFromDb(data) };
  }, [fetchData]);

  const deleteSessionRegistration: EventDataContextType['deleteSessionRegistration'] = useCallback(async (registrationId) => {
    const { error } = await supabase.from('session_registrations').delete().eq('id', registrationId);
    if (error) return { success: false, message: error.message };
    fetchData(false);
    return { success: true, message: "Registration deleted." };
  }, [fetchData]);

  const checkInAttendee: EventDataContextType['checkInAttendee'] = useCallback(async (attendeeId) => {
    if (!selectedEventId) return { success: false, message: "No event selected." };
    const payload: Database['public']['Tables']['event_attendees']['Update'] = { check_in_time: new Date().toISOString() };
    const { error } = await supabase
      .from('event_attendees')
      .update(payload)
      .eq('event_id', selectedEventId)
      .eq('attendee_id', attendeeId);
    if (error) return { success: false, message: error.message };
    fetchData(false);
    return { success: true, message: "Attendee checked in." };
  }, [selectedEventId, fetchData]);

  const undoCheckIn: EventDataContextType['undoCheckIn'] = useCallback(async (attendeeId) => {
    if (!selectedEventId) return { success: false, message: "No event selected." };
    const payload: Database['public']['Tables']['event_attendees']['Update'] = { check_in_time: null };
    const { error } = await supabase
      .from('event_attendees')
      .update(payload)
      .eq('event_id', selectedEventId)
      .eq('attendee_id', attendeeId);
    if (error) return { success: false, message: error.message };
    fetchData(false);
    return { success: true, message: "Check-in undone." };
  }, [selectedEventId, fetchData]);

  const getSessionRegistrationsForSession: EventDataContextType['getSessionRegistrationsForSession'] = useCallback(async (sessionId) => {
    const { data, error } = await supabase
      .from('session_registrations')
      .select(`id, event_id, session_id, attendee_id, expected_booth_id, status, registration_time, actual_scan_id, attendees!inner(name, is_vendor), booths(company_name)`)
      .eq('session_id', sessionId)
      .eq('attendees.is_vendor', false)  // Only show regular attendees, not vendor staff
      .returns<SessionRegWithDetails[]>();

    if (error) return { success: false, message: error.message, data: [] };
    const mappedData = (data || []).map((d) => ({ ...mapSessionRegistrationFromDb(d), boothName: d.booths?.company_name }));
    return { success: true, data: mappedData };
  }, []);

  const getSessionRegistrationsForAttendee: EventDataContextType['getSessionRegistrationsForAttendee'] = useCallback(async (attendeeId: string) => {
    const { data, error } = await supabase
      .from('session_registrations')
      .select('id, event_id, session_id, attendee_id, expected_booth_id, status, registration_time, actual_scan_id, attendees(name), sessions(name, start_time), booths(company_name, physical_id)')
      .eq('attendee_id', attendeeId)
      .returns<AttendeeRegistrationWithDetails[]>();

    if (error) return { success: false, message: error.message, data: [] };
    const mappedData = (data || []).map((d) => ({
      ...mapSessionRegistrationFromDb(d),
      sessionName: d.sessions?.name || 'N/A',
      sessionStartTime: d.sessions?.start_time || 'N/A',
      boothName: d.booths?.company_name,
      boothDetails: d.booths ? { physicalId: d.booths.physical_id } : undefined
    }));
    return { success: true, data: mappedData };
  }, []);

  const getVendorsForBooth: EventDataContextType['getVendorsForBooth'] = useCallback(async (companyName) => {
    const { data, error } = await supabase.from('attendees').select('*').eq('is_vendor', true).eq('organization', companyName);
    if (error) { console.error(error); return []; }
    return (data || []).map(mapAttendeeFromDb);
  }, []);

  const PREDEFINED_COLORS = ['#3b82f6', '#16a34a', '#f97316', '#e11d48', '#8b5cf6', '#06b6d4', '#f59e0b', '#64748b', '#ec4899', '#1d4ed8', '#047857', '#991b1b'];

  const findOrCreateTracksAndAssignAttendees: EventDataContextType['findOrCreateTracksAndAssignAttendees'] = useCallback(async (assignments) => {
    if (!selectedEventId) return { success: false, message: "No event selected.", createdTracksCount: 0, assignedAttendeesCount: 0 };
    if (assignments.length === 0) return { success: true, message: "No track assignments to process.", createdTracksCount: 0, assignedAttendeesCount: 0 };

    const uniqueTrackNames = [...new Set(assignments.map(a => a.trackName.trim()).filter(Boolean))];
    if (uniqueTrackNames.length === 0) return { success: true, message: "No track names found in data.", createdTracksCount: 0, assignedAttendeesCount: 0 };

    // 1. Find existing tracks
    const { data: existingTracks, error: fetchError } = await supabase.from('event_tracks').select('id, name').eq('event_id', selectedEventId).in('name', uniqueTrackNames);
    if (fetchError) return { success: false, message: `DB Error fetching tracks: ${fetchError.message}`, createdTracksCount: 0, assignedAttendeesCount: 0 };

    const existingTrackMap = new Map<string, string>();
    (existingTracks || []).forEach(t => existingTrackMap.set(t.name.toLowerCase(), t.id));

    // 2. Identify new tracks
    const tracksToCreate: Database['public']['Tables']['event_tracks']['Insert'][] = [];
    uniqueTrackNames.forEach((name, index) => {
      if (!existingTrackMap.has(name.toLowerCase())) {
        tracksToCreate.push({
          event_id: selectedEventId,
          name: name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          color: PREDEFINED_COLORS[index % PREDEFINED_COLORS.length],
          active: true,
        });
      }
    });

    // 3. Create new tracks
    let allTracksMap = new Map<string, string>();
    existingTrackMap.forEach((id, name) => allTracksMap.set(name, id));

    let createdTracksCount = 0;
    if (tracksToCreate.length > 0) {
      const { data: newTracks, error: createError } = await supabase.from('event_tracks').insert(tracksToCreate).select('id, name');
      if (createError) return { success: false, message: `Failed to create new tracks: ${createError.message}`, createdTracksCount: 0, assignedAttendeesCount: 0 };
      (newTracks || []).forEach(t => allTracksMap.set(t.name.toLowerCase(), t.id));
      createdTracksCount = newTracks?.length || 0;
    }

    // 4. Prepare assignment payload
    const assignmentPayload: Database['public']['Tables']['attendee_tracks']['Insert'][] = [];
    assignments.forEach(({ attendeeId, trackName }) => {
      const trackId = allTracksMap.get(trackName.trim().toLowerCase());
      if (attendeeId && trackId) {
        assignmentPayload.push({
          event_id: selectedEventId,
          attendee_id: attendeeId,
          track_id: trackId,
        });
      }
    });

    if (assignmentPayload.length === 0) return { success: true, message: 'No valid assignments to create.', createdTracksCount, assignedAttendeesCount: 0 };

    // 5. Upsert assignments
    const { error: upsertError, count } = await supabase.from('attendee_tracks').upsert(assignmentPayload);
    if (upsertError) return { success: false, message: `Failed to assign attendees to tracks: ${upsertError.message}`, createdTracksCount, assignedAttendeesCount: 0 };

    return { success: true, message: `${count || 0} track assignments processed.`, createdTracksCount, assignedAttendeesCount: count || 0 };
  }, [selectedEventId]);

  /**
   * Bulk assign multiple attendees to booths within a session
   * Useful for assigning available attendees from session view
   */
  const bulkAssignAttendeesToBooth: EventDataContextType['bulkAssignAttendeesToBooth'] = useCallback(async (sessionId, assignments) => {
    if (!selectedEventId) {
      return { success: false, message: 'No event selected', createdCount: 0 };
    }

    if (assignments.length === 0) {
      return { success: true, message: 'No assignments to create', createdCount: 0 };
    }

    try {
      // Prepare registration payloads
      const registrations: Database['public']['Tables']['session_registrations']['Insert'][] = assignments.map(({ attendeeId, boothId }) => ({
        event_id: selectedEventId,
        session_id: sessionId,
        attendee_id: attendeeId,
        expected_booth_id: boothId,
        status: 'Registered',
        registration_time: new Date().toISOString(),
      }));

      // Insert all registrations in one batch
      const { data, error } = await supabase
        .from('session_registrations')
        .insert(registrations)
        .select();

      if (error) {
        console.error('Error in bulk assignment:', error);
        return { success: false, message: `Failed to assign attendees: ${error.message}`, createdCount: 0 };
      }

      // Refresh data to update UI
      await fetchData(false);

      return {
        success: true,
        message: `Successfully assigned ${data?.length || 0} attendee(s)`,
        createdCount: data?.length || 0
      };

    } catch (err: any) {
      console.error('Exception in bulk assignment:', err);
      return { success: false, message: `Unexpected error: ${err.message}`, createdCount: 0 };
    }
  }, [selectedEventId, fetchData]);

  const contextValue: EventDataContextType = {

    sessions, scans, pendingScans, booths, attendees, loadingData, dataError, isSyncing,
    realtimeEnabled, realtimeConnected, changedBoothIds,
    fetchData, addSession, updateSession, deleteSession, addScan, deleteScan, getBoothById, getBoothName,
    activeBoothsForSession, allConfiguredBooths, clearAllEventDataFromSupabase,
    addBooth, updateBooth, deleteBooth, regenerateAllBoothAccessCodes,
    getOperationalSessionDetails, findOrCreateAttendeesBatch, addSessionRegistrationsBatch,
    getSessionRegistrationsForSession, getSessionRegistrationsForAttendee, getAttendeeById,
    searchGlobalAttendees, updateSessionBoothAssignments, addSessionRegistration,
    updateSessionRegistration, deleteSessionRegistration, addBoothsBatch, addSessionsBatch,
    updateAttendee, markAttendeesAsVendors,
    markAttendeesAsNonVendors, deleteAttendee, mergeAttendees, getSessionNameById,
    checkInAttendee, undoCheckIn, addWalkInAttendee, getVendorsForBooth, addSessionBoothCapacitiesBatch,
    findOrCreateTracksAndAssignAttendees, bulkAssignAttendeesToBooth,
  };


  return (
    <EventDataContext.Provider value={contextValue}>
      {children}
    </EventDataContext.Provider>
  );
};

export const useEventData = (): EventDataContextType => {
  const context = useContext(EventDataContext);
  if (context === undefined) {
    throw new Error('useEventData must be used within an EventDataProvider');
  }
  return context;
};