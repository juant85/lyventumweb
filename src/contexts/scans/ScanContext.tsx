// src/contexts/scans/ScanContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { ScanRecord, PendingScanPayload, ScanResult, ScanStatus, ScanResultDetails } from '../../types';
import { SessionConfig } from '../../types/sessionConfig';
import { supabase } from '../../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSelectedEvent } from '../SelectedEventContext';
import { useSessions } from '../sessions';
import { useBooths } from '../booths';
import { useAttendees } from '../attendees';
import { mapScanRecordFromDb } from '../../utils/dataMappers';
import * as localDb from '../../utils/localDb';
import { toast } from 'react-hot-toast';
import { GRACE_PERIOD_FOR_REGULAR_SCAN } from '../../utils/sessionUtils';
import { Database } from '../../database.types';

// --- Context Interface ---
export interface ScanContextType {
    // State
    scans: ScanRecord[];
    pendingScans: PendingScanPayload[];
    loading: boolean;
    isSyncing: boolean;
    error: string | null;

    // Operations
    addScan: (attendeeId: string, boothId?: string, sessionId?: string, deviceId?: string) => Promise<ScanResult>;
    deleteScan: (scanId: string) => Promise<{ success: boolean; message: string }>;

    // Offline Management
    syncPendingScans: () => Promise<void>;
    getPendingCount: () => number;

    // Data Management
    fetchScans: () => Promise<void>;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

// --- Provider ---
export const ScanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { selectedEventId } = useSelectedEvent();
    const { getOperationalSessionDetails } = useSessions();
    const { booths } = useBooths();
    const { attendees } = useAttendees();

    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [pendingScans, setPendingScans] = useState<PendingScanPayload[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
    const processingScansRef = useRef<Set<string>>(new Set());

    // Fetch scans from database
    const fetchScans = useCallback(async () => {
        if (!selectedEventId) {
            setScans([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: scansData, error: scansError } = await supabase
                .from('scan_records')
                .select('*')
                .eq('event_id', selectedEventId);

            if (scansError) throw new Error(`Scans: ${scansError.message}`);

            setScans((scansData ?? []).map(mapScanRecordFromDb));
        } catch (err: any) {
            console.error('[ScanContext] Error fetching scans:', err);
            setError(err.message || 'Failed to load scans.');
        } finally {
            setLoading(false);
        }
    }, [selectedEventId]);

    // Initial fetch and setup
    useEffect(() => {
        fetchScans();

        if (selectedEventId) {
            // Load pending scans from local storage
            localDb.getPendingScans().then(setPendingScans);
        }

        if (!selectedEventId) return;

        // Setup realtime subscription for scans
        const channel = supabase
            .channel(`scans-changes-${selectedEventId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'scan_records',
                filter: `event_id=eq.${selectedEventId}`
            }, () => {
                console.log('[ScanContext] Scan records update detected, refetching');
                fetchScans();
            })
            .subscribe();

        realtimeChannelRef.current = channel;

        return () => {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
                realtimeChannelRef.current = null;
            }
        };
    }, [selectedEventId, fetchScans]);

    // --- Core Scan Upload Logic with INTELLIGENT 4-SCENARIO CLASSIFICATION ---

    const _performScanUpload = useCallback(async (payload: Omit<PendingScanPayload, 'localId'>): Promise<Omit<ScanResult, 'wasOffline'>> => {
        const { eventId, attendeeId, boothId, sessionId, notes, deviceId } = payload;

        if (!eventId) {
            return {
                success: false,
                status: 'OUT_OF_SCHEDULE',
                message: 'Internal error: Event ID missing.'
            };
        }

        // Determine scanning mode
        const isSessionMode = !!sessionId && !boothId;
        const isBoothMode = !!boothId;

        // === STEP 1: Fetch Attendee (with walk-in auto-creation) ===
        const { data: attendeeData } = await supabase
            .from('event_attendees')
            .select(`
                attendee_id,
                attendees!inner (
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq('event_id', eventId)
            .eq('attendee_id', attendeeId)
            .maybeSingle();

        let attendeeName: string;
        let attendeePhoto: string | undefined;
        let wasAutoCreated = false;

        // Auto-create walk-in if doesn't exist
        if (!attendeeData || !attendeeData.attendees) {
            console.log(`[Smart Scan] Attendee ${attendeeId} not found, creating as walk-in`);

            const { data: globalAttendee } = await supabase
                .from('attendees')
                .select('id, name, avatar_url')
                .eq('id', attendeeId)
                .maybeSingle();

            if (globalAttendee) {
                attendeeName = globalAttendee.name;
                attendeePhoto = globalAttendee.avatar_url || undefined;
                await supabase.from('event_attendees').insert({
                    event_id: eventId,
                    attendee_id: attendeeId
                });
            } else {
                attendeeName = `Walk-in (${attendeeId.substring(0, 8)})`;
                await supabase.from('attendees').insert({
                    id: attendeeId,
                    name: attendeeName,
                    email: '',
                    organization: ''
                });
                await supabase.from('event_attendees').insert({
                    event_id: eventId,
                    attendee_id: attendeeId
                });
            }
            wasAutoCreated = true;
        } else {
            attendeeName = (attendeeData.attendees as any).name;
            attendeePhoto = (attendeeData.attendees as any).avatar_url || undefined;
        }

        // === STEP 2: Duplicate Detection (5 min cooldown) ===
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        // Build duplicate check query based on mode
        let recentScanQuery = supabase
            .from('scan_records')
            .select('id')
            .eq('attendee_id', attendeeId)
            .gte('timestamp', fiveMinutesAgo)
            .limit(1);

        if (isBoothMode && boothId) {
            recentScanQuery = recentScanQuery.eq('booth_id', boothId);
        } else if (isSessionMode && sessionId) {
            recentScanQuery = recentScanQuery.eq('session_id', sessionId);
        }

        const { data: recentScan } = await recentScanQuery;

        if (recentScan && recentScan.length > 0) {
            const location = isBoothMode ? 'booth' : 'session';
            return {
                success: false,
                status: 'EXPECTED',
                message: `Frequent Scan: ${attendeeName} was already scanned at this ${location} recently.`
            };
        }

        // === STEP 3: Session-Specific Logic ===
        let effectiveSessionId: string | null = null;
        let sessionName: string | undefined;
        let status: ScanStatus = 'OUT_OF_SCHEDULE'; // Default value
        let scanType: ScanRecord['scanType'] = 'out_of_schedule'; // Default value
        const details: ScanResultDetails = {
            isRegistered: false,
            attendeePhoto
        };

        if (isSessionMode && sessionId) {
            // Session scanner mode: sessionId is provided directly
            effectiveSessionId = sessionId;

            // Get session details
            const { data: sessionData } = await supabase
                .from('sessions')
                .select('name, start_time, end_time, config')
                .eq('id', sessionId)
                .single();

            sessionName = sessionData?.name;
            const sessionConfig = sessionData?.config as SessionConfig | null;
            details.sessionName = sessionName;

            // Check if attendee is registered for THIS session
            const { data: currentSessionReg } = await supabase
                .from('session_registrations')
                .select('id, expected_booth_id')
                .eq('session_id', sessionId)
                .eq('attendee_id', attendeeId)
                .maybeSingle();

            if (currentSessionReg) {
                // Registered for this session
                status = 'EXPECTED';
                scanType = 'regular';
                details.isRegistered = true;
            } else {
                // Check if pre-assignment is REQUIRED by config
                if (sessionConfig?.requiresPreAssignment) {
                    status = 'WRONG_BOOTH'; // Flag as error
                    scanType = 'regular';
                    details.isRegistered = false;
                    details.expectedBoothName = '⛔ Registration Required';
                    console.log(`[Smart Scan] Rejected walk-in: Configuration requires pre-assignment.`);
                } else {
                    // Normal walk-in logic
                    // NOT registered for this session - check for conflicts
                    if (sessionData) {
                        const { data: conflictingRegs } = await supabase
                            .from('session_registrations')
                            .select(`
                            id,
                            session_id,
                            sessions!inner (
                                id,
                                name,
                                start_time,
                                end_time
                            )
                        `)
                            .eq('attendee_id', attendeeId)
                            .neq('session_id', sessionId);

                        // Check for time overlap
                        const conflicts = conflictingRegs?.filter((reg: any) => {
                            const s = reg.sessions;
                            return (
                                new Date(s.end_time) >= new Date(sessionData.start_time) &&
                                new Date(s.start_time) <= new Date(sessionData.end_time)
                            );
                        }) || [];

                        if (conflicts.length > 0) {
                            // CONFLICT DETECTED: Registered in overlapping session
                            const conflictSession = (conflicts[0] as any).sessions;
                            status = 'WALK_IN';
                            scanType = 'regular';
                            details.isRegistered = false;
                            details.expectedBoothName = `⚠️ Debería estar en: ${conflictSession.name}`;
                        } else {
                            // Walk-in (no conflict)
                            status = 'WALK_IN';
                            scanType = 'regular';
                            details.isRegistered = false;
                        }
                    }
                }
            }

            // Auto-register walk-ins
            if (!currentSessionReg && sessionId) {
                await supabase.from('session_registrations').insert({
                    event_id: eventId,
                    session_id: sessionId,
                    attendee_id: attendeeId,
                    status: 'Attended',
                    registration_time: new Date().toISOString()
                });
            }

        } else {
            // Booth scanner mode (original logic)
            const operationalDetails = getOperationalSessionDetails(new Date(payload.timestamp), GRACE_PERIOD_FOR_REGULAR_SCAN);
            effectiveSessionId = operationalDetails.session?.id || null;
            sessionName = operationalDetails.session?.name || undefined;
            details.sessionName = sessionName;

            // SCENARIO 4: No active session
            if (!effectiveSessionId) {
                status = 'OUT_OF_SCHEDULE';
                scanType = 'out_of_schedule';
            }
            // SCENARIOS 1, 2, 3: Active session
            else {
                // Check if attendee has registration for this session
                const { data: attendeeRegistration } = await supabase
                    .from('session_registrations')
                    .select(`
                        id,
                        expected_booth_id,
                        booths:expected_booth_id (
                            id,
                            company_name
                        )
                    `)
                    .eq('session_id', effectiveSessionId)
                    .eq('attendee_id', attendeeId)
                    .maybeSingle();

                if (!attendeeRegistration) {
                    // SCENARIO 3: Walk-in (not registered for this session)
                    // Check config first
                    if (operationalDetails.session?.config?.requiresPreAssignment) {
                        status = 'WRONG_BOOTH';
                        scanType = 'regular';
                        details.isRegistered = false;
                        details.expectedBoothName = '⛔ Registration Required';
                    } else {
                        status = 'WALK_IN';
                        scanType = 'regular'; // Still valid scan, just unexpected
                        details.isRegistered = false;
                    }
                } else if (attendeeRegistration.expected_booth_id === boothId) {
                    // SCENARIO 1: EXPECTED (correct booth!) ✅
                    status = 'EXPECTED';
                    scanType = 'regular';
                    details.isRegistered = true;
                } else {
                    // SCENARIO 2: WRONG BOOTH ⚠️
                    status = 'WRONG_BOOTH';
                    scanType = 'regular';
                    details.isRegistered = true;
                    details.expectedBoothId = attendeeRegistration.expected_booth_id;
                    details.expectedBoothName = (attendeeRegistration.booths as any)?.company_name;
                }
            }
        }

        // === STEP 4: Save Scan to Database ===
        const currentBooth = boothId ? booths.find(b => b.id === boothId) : null;
        const newScanPayload: Database['public']['Tables']['scan_records']['Insert'] = {
            event_id: eventId,
            attendee_id: attendeeId,
            attendee_name: attendeeName ?? null,
            booth_id: boothId || null, // NULL for session-only scans
            booth_name: currentBooth?.companyName ?? null,
            session_id: effectiveSessionId,
            notes: notes ?? null,
            device_id: deviceId ?? null,
            scan_type: scanType,
            timestamp: payload.timestamp,
            scan_status: status,
            expected_booth_id: details.expectedBoothId || null
        } as any; // Type assertion needed until Supabase types are regenerated

        const { data: createdScanData, error: insertError } = await supabase
            .from('scan_records')
            .insert(newScanPayload)
            .select()
            .single();

        if (insertError || !createdScanData) {
            return {
                success: false,
                status,
                message: `Failed to save scan: ${insertError?.message}`
            };
        }

        const newScan = mapScanRecordFromDb(createdScanData);

        // Link scan to registration if applicable
        if (newScan.sessionId && details.isRegistered) {
            await supabase.rpc('link_scan_to_registration', {
                p_attendee_id: newScan.attendeeId,
                p_session_id: newScan.sessionId,
                p_scan_id: newScan.id
            });
        }

        // === STEP 5: Generate Status-Specific Message ===
        let feedbackMessage: string;

        switch (status) {
            case 'EXPECTED':
                feedbackMessage = `✓ ${attendeeName} - Asistente esperado`;
                break;
            case 'WRONG_BOOTH':
                feedbackMessage = `⚠ ${attendeeName} - Stand equivocado (esperado en: ${details.expectedBoothName})`;
                break;
            case 'WALK_IN':
                if (details.expectedBoothName && details.expectedBoothName.includes('⚠️')) {
                    // Conflict detected
                    feedbackMessage = `⚠ ${attendeeName} - ${details.expectedBoothName}`;
                } else {
                    feedbackMessage = `ℹ ${attendeeName} - Walk-in (no pre-registrado)`;
                }
                break;
            case 'OUT_OF_SCHEDULE':
                feedbackMessage = `ℹ ${attendeeName} - Fuera de horario de sesión`;
                break;
        }

        if (wasAutoCreated) {
            feedbackMessage += ' [Auto-creado]';
        }

        console.log(`[Smart Scan] Status: ${status}, Message: ${feedbackMessage}`);

        return {
            success: true,
            status,
            message: feedbackMessage,
            scan: newScan,
            details
        };
    }, [getOperationalSessionDetails, booths]);


    // --- Sync Pending Scans ---

    const syncPendingScans = useCallback(async (): Promise<void> => {
        if (isSyncing) return;

        setIsSyncing(true);
        const scansToSync = await localDb.getPendingScans();

        if (scansToSync.length === 0) {
            setIsSyncing(false);
            return;
        }

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

        if (successCount > 0) {
            await fetchScans();
        }

        toast.success(`${successCount} scan(s) synced! ${scansToSync.length - successCount} failed.`, { id: 'sync' });
        setIsSyncing(false);
    }, [_performScanUpload, fetchScans, isSyncing]);

    // Auto-sync when coming back online
    useEffect(() => {
        window.addEventListener('online', syncPendingScans);
        return () => window.removeEventListener('online', syncPendingScans);
    }, [syncPendingScans]);

    // --- Add Scan (with offline support and session mode support) ---

    const addScan = useCallback(async (attendeeId: string, boothId?: string, sessionId?: string, deviceId?: string): Promise<ScanResult> => {
        if (!selectedEventId) {
            return {
                success: false,
                status: 'OUT_OF_SCHEDULE',
                message: 'No event selected.',
                wasOffline: false
            };
        }

        // Validate: must have either boothId or sessionId
        if (!boothId && !sessionId) {
            return {
                success: false,
                status: 'OUT_OF_SCHEDULE',
                message: 'Internal error: Neither booth nor session specified.',
                wasOffline: false
            };
        }

        const payload: PendingScanPayload = {
            localId: `${Date.now()}-${attendeeId}`,
            eventId: selectedEventId,
            attendeeId,
            boothId: boothId || '', // Empty string for session mode
            timestamp: new Date().toISOString(),
            notes: undefined,
            deviceId,
            attendeeName: attendees.find(a => a.id === attendeeId)?.name,
            boothName: boothId ? booths.find(b => b.id === boothId)?.companyName : undefined,
        };

        // Offline mode: save to local storage
        if (!navigator.onLine) {
            await localDb.addPendingScan(payload);
            setPendingScans(prev => [payload, ...prev]);
            return {
                success: true,
                status: 'OUT_OF_SCHEDULE', // Offline scans default to this
                message: `Offline: Scan for ${payload.attendeeName} saved locally.`,
                wasOffline: true
            };
        }

        // Online mode: upload immediately
        const result = await _performScanUpload(payload);
        if (result.success) {
            await fetchScans();
        }

        return { ...result, wasOffline: false };
    }, [selectedEventId, attendees, booths, _performScanUpload, fetchScans]);

    // --- Delete Scan ---

    const deleteScan = useCallback(async (scanId: string) => {
        const { error: deleteError } = await supabase
            .from('scan_records')
            .delete()
            .eq('id', scanId);

        if (deleteError) {
            return { success: false, message: `Failed to delete scan: ${deleteError.message}` };
        }

        await fetchScans();
        return { success: true, message: 'Scan deleted successfully.' };
    }, [fetchScans]);

    // --- Utilities ---

    const getPendingCount = useCallback((): number => {
        return pendingScans.length;
    }, [pendingScans]);

    // --- Context Value ---

    const value: ScanContextType = useMemo(() => ({
        scans,
        pendingScans,
        loading,
        isSyncing,
        error,
        addScan,
        deleteScan,
        syncPendingScans,
        getPendingCount,
        fetchScans
    }), [
        scans,
        pendingScans,
        loading,
        isSyncing,
        error,
        addScan,
        deleteScan,
        syncPendingScans,
        getPendingCount,
        fetchScans
    ]);

    return (
        <ScanContext.Provider value={value}>
            {children}
        </ScanContext.Provider>
    );
};

// --- Hook ---
export const useScans = (): ScanContextType => {
    const context = useContext(ScanContext);
    if (context === undefined) {
        throw new Error('useScans must be used within a ScanProvider');
    }
    return context;
};
