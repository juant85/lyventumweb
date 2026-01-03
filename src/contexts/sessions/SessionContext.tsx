// src/contexts/sessions/SessionContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Session } from '../../types';
import { supabase } from '../../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSelectedEvent } from '../SelectedEventContext';
import { mapSessionFromDb } from '../../utils/dataMappers';
import { getActiveSessionDetails, ActiveSessionReturn, GRACE_PERIOD_FOR_REGULAR_SCAN } from '../../utils/sessionUtils';
import { Database } from '../../database.types';

// Helper type for session with capacities
export type SessionWithCapacities = Database['public']['Tables']['sessions']['Row'] & {
    session_booth_capacities: Pick<Database['public']['Tables']['session_booth_capacities']['Row'], 'booth_id' | 'capacity'>[];
};

// Sort helper
const sortSessions = (sessions: Session[]): Session[] => {
    return [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

// --- Context Interface ---
export interface SessionContextType {
    // State
    sessions: Session[];
    loading: boolean;
    error: string | null;

    // CRUD Operations
    addSession: (sessionName: string, startTime: string, endTime: string, details?: Partial<Session>) => Promise<{ success: boolean; message: string; newSession?: Session }>;
    updateSession: (updatedSession: Pick<Session, 'id' | 'name' | 'startTime' | 'endTime'> & Partial<Session>) => Promise<{ success: boolean; message: string; updatedSession?: Session }>;
    addSessionsBatch: (sessions: { name: string; startTime: string; endTime: string }[]) => Promise<{ success: boolean; data: Session[]; errors: { name: string, error: string }[] }>;

    // Capacities
    addSessionBoothCapacitiesBatch: (capacities: Database['public']['Tables']['session_booth_capacities']['Insert'][]) => Promise<{ success: boolean; message: string; createdCount: number }>;

    // Utilities
    getSessionNameById: (sessionId: string | null) => string;
    getOperationalSessionDetails: (currentTime?: Date, gracePeriodMinutes?: number) => ActiveSessionReturn;

    // Data Management
    fetchSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// --- Provider ---
export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { selectedEventId } = useSelectedEvent();

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const realtimeChannelRef = React.useRef<RealtimeChannel | null>(null);

    // Fetch sessions from database
    const fetchSessions = useCallback(async () => {
        if (!selectedEventId) {
            setSessions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('sessions')
                .select('id, name, start_time, end_time, event_id, config, session_booth_capacities(booth_id, capacity)')
                .eq('event_id', selectedEventId)
                .returns<SessionWithCapacities[]>();

            if (sessionsError) throw new Error(`Sessions: ${sessionsError.message}`);

            setSessions(sortSessions((sessionsData ?? []).map(mapSessionFromDb)));
        } catch (err: any) {
            console.error('[SessionContext] Error fetching sessions:', err);
            setError(err.message || 'Failed to load sessions.');
        } finally {
            setLoading(false);
        }
    }, [selectedEventId]);

    // Initial fetch when selectedEventId changes
    useEffect(() => {
        fetchSessions();
    }, [selectedEventId]); // Only depend on selectedEventId

    // Realtime subscription (separate from initial fetch)
    useEffect(() => {
        if (!selectedEventId) return;

        const channel = supabase
            .channel(`sessions-changes-${selectedEventId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'sessions',
                filter: `event_id=eq.${selectedEventId}`
            }, () => {
                console.log('[SessionContext] Realtime update detected, refetching sessions');
                fetchSessions();
            })
            .subscribe();

        realtimeChannelRef.current = channel;

        return () => {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
                realtimeChannelRef.current = null;
            }
        };
    }, [selectedEventId, fetchSessions]);

    // --- CRUD Operations ---

    const addSession = useCallback(async (sessionName: string, startTime: string, endTime: string, details?: Partial<Session>) => {
        if (!selectedEventId) return { success: false, message: 'No event selected.' };

        const payload: Database['public']['Tables']['sessions']['Insert'] = {
            name: sessionName,
            start_time: startTime,
            end_time: endTime,
            event_id: selectedEventId,
            session_type: details?.sessionType || 'meeting',
            location: details?.location,
            description: details?.description,
            speaker: details?.speaker,
            max_capacity: details?.maxCapacity,
            config: details?.config as any,
            access_code: crypto.randomUUID().slice(0, 8).toUpperCase()
        };

        const { data: newSessionData, error: sessionError } = await supabase
            .from('sessions')
            .insert(payload)
            .select()
            .single();

        if (sessionError || !newSessionData) {
            if (sessionError?.code === '23505') {
                return { success: false, message: `A session with the name "${sessionName}" already exists.` };
            }
            return { success: false, message: `Failed to create session: ${sessionError?.message ?? 'Unknown error'}` };
        }

        await fetchSessions();
        const createdSession = mapSessionFromDb(newSessionData as SessionWithCapacities);
        return { success: true, message: 'Session created successfully.', newSession: createdSession };
    }, [selectedEventId, fetchSessions]);

    const updateSession = useCallback(async (updatedSession: Pick<Session, 'id' | 'name' | 'startTime' | 'endTime'> & Partial<Session>) => {
        const sessionPayload: Database['public']['Tables']['sessions']['Update'] = {
            name: updatedSession.name,
            start_time: updatedSession.startTime,
            end_time: updatedSession.endTime,
            session_type: updatedSession.sessionType,
            location: updatedSession.location,
            description: updatedSession.description,
            speaker: updatedSession.speaker,
            max_capacity: updatedSession.maxCapacity,
            config: updatedSession.config as any
        };

        const { data, error: sessionError } = await supabase
            .from('sessions')
            .update(sessionPayload)
            .eq('id', updatedSession.id)
            .select()
            .single();

        if (sessionError) {
            return { success: false, message: `Failed to update session: ${sessionError.message}` };
        }

        await fetchSessions();
        return { success: true, message: 'Session updated successfully.', updatedSession: mapSessionFromDb(data as SessionWithCapacities) };
    }, [fetchSessions]);

    const addSessionsBatch = useCallback(async (sessionsData: { name: string; startTime: string; endTime: string }[]) => {
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
            access_code: crypto.randomUUID().slice(0, 8).toUpperCase()
        }));

        if (sessionsToUpsert.length === 0) {
            return { success: true, data: [], errors: [] };
        }

        const { data, error } = await supabase
            .from('sessions')
            .upsert(sessionsToUpsert, { onConflict: 'event_id, name' })
            .select();

        if (error) {
            return { success: false, data: [], errors: [{ name: 'Batch Error', error: error.message }] };
        }

        await fetchSessions();
        const created = (data ?? []).map(d => mapSessionFromDb(d as SessionWithCapacities));
        return { success: true, data: created, errors: [] };
    }, [selectedEventId, fetchSessions]);

    // --- Capacities ---

    const addSessionBoothCapacitiesBatch = useCallback(async (capacities: Database['public']['Tables']['session_booth_capacities']['Insert'][]) => {
        if (capacities.length === 0) {
            return { success: true, message: 'No capacities to update.', createdCount: 0 };
        }

        const { error, count } = await supabase
            .from('session_booth_capacities')
            .upsert(capacities, { onConflict: 'session_id,booth_id' });

        if (error) {
            return { success: false, message: `Failed to update capacities: ${error.message}`, createdCount: 0 };
        }

        return { success: true, message: 'Capacities updated.', createdCount: count || 0 };
    }, []);

    // --- Utilities ---

    const getSessionNameById = useCallback((sessionId: string | null): string => {
        if (!sessionId) return 'N/A';
        const session = sessions.find(s => s.id === sessionId);
        return session?.name || 'Unknown Session';
    }, [sessions]);

    const getOperationalSessionDetails = useCallback((currentTime: Date = new Date(), gracePeriodMinutes: number = GRACE_PERIOD_FOR_REGULAR_SCAN): ActiveSessionReturn => {
        return getActiveSessionDetails(sessions, currentTime, gracePeriodMinutes);
    }, [sessions]);

    // --- Context Value ---

    const value: SessionContextType = useMemo(() => ({
        sessions,
        loading,
        error,
        addSession,
        updateSession,
        addSessionsBatch,
        addSessionBoothCapacitiesBatch,
        getSessionNameById,
        getOperationalSessionDetails,
        fetchSessions
    }), [
        sessions,
        loading,
        error,
        addSession,
        updateSession,
        addSessionsBatch,
        addSessionBoothCapacitiesBatch,
        getSessionNameById,
        getOperationalSessionDetails,
        fetchSessions
    ]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

// --- Hook ---
export const useSessions = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSessions must be used within a SessionProvider');
    }
    return context;
};
