// src/contexts/attendees/AttendeeContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Attendee } from '../../types';
import { supabase } from '../../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSelectedEvent } from '../SelectedEventContext';
import { mapAttendeeFromDb } from '../../utils/dataMappers';
import { Database, Json } from '../../database.types';

// Sort helper
const sortAttendees = (attendees: (Attendee & { checkInTime: string | null })[]): (Attendee & { checkInTime: string | null })[] => {
    return [...attendees].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

// Event-Attendee link type
type EventAttendeeLink = Pick<Database['public']['Tables']['event_attendees']['Row'], 'attendee_id' | 'check_in_time'>;

// --- Context Interface ---
export interface AttendeeContextType {
    // State
    attendees: (Attendee & { checkInTime: string | null })[];
    loading: boolean;
    error: string | null;

    // CRUD Operations
    updateAttendee: (attendeeId: string, updates: Database['public']['Tables']['attendees']['Update']) => Promise<{ success: boolean; message: string; updatedAttendee?: Attendee }>;
    deleteAttendee: (attendeeId: string) => Promise<{ success: boolean; message: string }>;
    mergeAttendees: (primaryAttendeeId: string, duplicateIds: string[]) => Promise<{ success: boolean; message: string }>;

    // Check-in Flow
    checkInAttendee: (attendeeId: string) => Promise<{ success: boolean; message: string }>;
    undoCheckIn: (attendeeId: string) => Promise<{ success: boolean; message: string }>;
    addWalkInAttendee: (newAttendee: Omit<Partial<Attendee>, 'id' | 'checkInTime' | 'organization'> & { name: string; email: string; organization: string }) => Promise<{ success: boolean; message: string; newAttendee?: Attendee }>;

    // Search & Lookup
    getAttendeeById: (attendeeId: string) => Promise<Attendee | null>;
    searchGlobalAttendees: (searchTerm: string) => Promise<Attendee[]>;

    // Vendor Management
    markAttendeesAsVendors: (attendeeIds: string[]) => Promise<{ success: boolean; message: string }>;
    markAttendeesAsNonVendors: (attendeeIds: string[]) => Promise<{ success: boolean; message: string }>;
    getVendorsForBooth: (companyName: string) => Promise<Attendee[]>;

    // Batch Operations
    findOrCreateAttendeesBatch: (attendeesToProcess: { firstName: string, lastName: string, email?: string; organization: string; metadata?: Json | null }[]) => Promise<{ success: boolean; attendees: Attendee[]; errors: string[] }>;

    // Data Management
    fetchAttendees: () => Promise<void>;
}

const AttendeeContext = createContext<AttendeeContextType | undefined>(undefined);

// --- Provider ---
export const AttendeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { selectedEventId } = useSelectedEvent();

    const [attendees, setAttendees] = useState<(Attendee & { checkInTime: string | null })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const realtimeChannelRef = React.useRef<RealtimeChannel | null>(null);

    // Fetch attendees from database
    const fetchAttendees = useCallback(async () => {
        if (!selectedEventId) {
            setAttendees([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch event-attendee links
            const { data: eventAttendeeLinksData, error: linksError } = await supabase
                .from('event_attendees')
                .select('attendee_id, check_in_time')
                .eq('event_id', selectedEventId);

            if (linksError) throw new Error(`Attendee Links: ${linksError.message}`);

            const eventAttendeeLinks: EventAttendeeLink[] = eventAttendeeLinksData || [];

            if (eventAttendeeLinks.length === 0) {
                setAttendees([]);
            } else {
                const checkInTimes = new Map<string, string | null>();
                const attendeeIds = eventAttendeeLinks.map(link => {
                    checkInTimes.set(link.attendee_id, link.check_in_time);
                    return link.attendee_id;
                });

                const { data: attendeeProfiles, error: attendeeError } = await supabase
                    .from('attendees')
                    .select('*')
                    .in('id', attendeeIds);

                if (attendeeError) throw new Error(`Attendee Profiles: ${attendeeError.message}`);

                setAttendees(sortAttendees((attendeeProfiles ?? []).map((attendee) => ({
                    ...mapAttendeeFromDb(attendee),
                    checkInTime: checkInTimes.get(attendee.id) ?? null
                }))));
            }
        } catch (err: any) {
            console.error('[AttendeeContext] Error fetching attendees:', err);
            setError(err.message || 'Failed to load attendees.');
        } finally {
            setLoading(false);
        }
    }, [selectedEventId]);

    // Initial fetch and realtime subscription
    useEffect(() => {
        fetchAttendees();

        if (!selectedEventId) return;

        // Setup realtime subscriptions for both tables
        const attendeesChannel = supabase
            .channel(`attendees-changes-${selectedEventId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'attendees'
            }, () => {
                console.log('[AttendeeContext] Attendees table update detected, refetching');
                fetchAttendees();
            })
            .subscribe();

        const eventAttendeesChannel = supabase
            .channel(`event-attendees-changes-${selectedEventId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'event_attendees',
                filter: `event_id=eq.${selectedEventId}`
            }, () => {
                console.log('[AttendeeContext] Event-attendees link update detected, refetching');
                fetchAttendees();
            })
            .subscribe();

        realtimeChannelRef.current = attendeesChannel;

        return () => {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
            }
            supabase.removeChannel(attendeesChannel);
            supabase.removeChannel(eventAttendeesChannel);
            realtimeChannelRef.current = null;
        };
    }, [selectedEventId, fetchAttendees]);

    // --- CRUD Operations ---

    const updateAttendee = useCallback(async (attendeeId: string, updates: Database['public']['Tables']['attendees']['Update']) => {
        const { data, error: updateError } = await supabase
            .from('attendees')
            .update(updates)
            .eq('id', attendeeId)
            .select()
            .single();

        if (updateError || !data) {
            return { success: false, message: updateError?.message || 'Failed to update attendee data.' };
        }

        const updated = mapAttendeeFromDb(data);
        await fetchAttendees();

        return { success: true, message: 'Attendee updated.', updatedAttendee: updated };
    }, [fetchAttendees]);

    const deleteAttendee = useCallback(async (attendeeId: string) => {
        const { error: deleteError } = await supabase
            .from('attendees')
            .delete()
            .eq('id', attendeeId);

        if (deleteError) {
            return { success: false, message: `Failed to delete attendee: ${deleteError.message}` };
        }

        await fetchAttendees();
        return { success: true, message: 'Attendee deleted successfully.' };
    }, [fetchAttendees]);

    const mergeAttendees = useCallback(async (primaryAttendeeId: string, duplicateIds: string[]) => {
        if (duplicateIds.length === 0) {
            return { success: false, message: 'No duplicate attendees selected.' };
        }

        // Use RPC function to merge attendees
        const { error: mergeError } = await supabase.rpc('merge_attendees', {
            p_primary_attendee_id: primaryAttendeeId,
            p_duplicate_ids: duplicateIds
        });

        if (mergeError) {
            console.error('Error merging attendees:', mergeError);
            return { success: false, message: `Failed to merge attendees: ${mergeError.message}` };
        }

        await fetchAttendees();
        return { success: true, message: `${duplicateIds.length} attendee(s) merged successfully.` };
    }, [fetchAttendees]);

    // --- Check-in Flow ---

    const checkInAttendee = useCallback(async (attendeeId: string) => {
        if (!selectedEventId) {
            return { success: false, message: 'No event selected.' };
        }

        const payload: Database['public']['Tables']['event_attendees']['Update'] = {
            check_in_time: new Date().toISOString()
        };

        const { error: updateError } = await supabase
            .from('event_attendees')
            .update(payload)
            .eq('event_id', selectedEventId)
            .eq('attendee_id', attendeeId);

        if (updateError) {
            return { success: false, message: updateError.message };
        }

        await fetchAttendees();
        return { success: true, message: 'Attendee checked in.' };
    }, [selectedEventId, fetchAttendees]);

    const undoCheckIn = useCallback(async (attendeeId: string) => {
        if (!selectedEventId) {
            return { success: false, message: 'No event selected.' };
        }

        const payload: Database['public']['Tables']['event_attendees']['Update'] = {
            check_in_time: null
        };

        const { error: updateError } = await supabase
            .from('event_attendees')
            .update(payload)
            .eq('event_id', selectedEventId)
            .eq('attendee_id', attendeeId);

        if (updateError) {
            return { success: false, message: updateError.message };
        }

        await fetchAttendees();
        return { success: true, message: 'Check-in undone.' };
    }, [selectedEventId, fetchAttendees]);

    const addWalkInAttendee = useCallback(async (newAttendee: Omit<Partial<Attendee>, 'id' | 'checkInTime' | 'organization'> & { name: string; email: string; organization: string }) => {
        if (!selectedEventId) {
            return { success: false, message: 'No event selected' };
        }

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

        const { data: createdAttendeeData, error: attendeeError } = await supabase
            .from('attendees')
            .insert(payload)
            .select()
            .single();

        if (attendeeError || !createdAttendeeData) {
            if (attendeeError?.code === '23505') {
                return { success: false, message: `An attendee with email '${newAttendee.email}' already exists.` };
            }
            return { success: false, message: attendeeError?.message ?? 'Failed to create attendee' };
        }

        const linkPayload: Database['public']['Tables']['event_attendees']['Insert'] = {
            event_id: selectedEventId,
            attendee_id: createdAttendeeData.id
        };

        const { error: linkError } = await supabase
            .from('event_attendees')
            .insert(linkPayload);

        if (linkError) {
            await supabase.from('attendees').delete().eq('id', createdAttendeeData.id);
            return { success: false, message: `Attendee creation failed during event linking: ${linkError.message}` };
        }

        await fetchAttendees();
        return { success: true, message: 'Walk-in attendee added.', newAttendee: mapAttendeeFromDb(createdAttendeeData) };
    }, [selectedEventId, fetchAttendees]);

    // --- Search & Lookup ---

    const getAttendeeById = useCallback(async (attendeeId: string): Promise<Attendee | null> => {
        const { data, error: fetchError } = await supabase
            .from('attendees')
            .select('*')
            .eq('id', attendeeId)
            .single();

        return data ? mapAttendeeFromDb(data) : null;
    }, []);

    const searchGlobalAttendees = useCallback(async (searchTerm: string): Promise<Attendee[]> => {
        if (!searchTerm || searchTerm.trim().length === 0) return [];

        const { data, error: searchError } = await supabase
            .from('attendees')
            .select('*')
            .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,organization.ilike.%${searchTerm}%`)
            .limit(50);

        if (searchError) {
            console.error('Error searching attendees:', searchError);
            return [];
        }

        return (data || []).map(mapAttendeeFromDb);
    }, []);

    // --- Vendor Management ---

    const markAttendeesAsVendors = useCallback(async (attendeeIds: string[]) => {
        if (attendeeIds.length === 0) {
            return { success: true, message: 'No attendees selected.' };
        }

        const payload: Database['public']['Tables']['attendees']['Update'] = { is_vendor: true };
        const { error: updateError } = await supabase
            .from('attendees')
            .update(payload)
            .in('id', attendeeIds);

        if (updateError) {
            console.error('Error marking attendees as vendors:', updateError);
            return { success: false, message: `Failed to mark vendors: ${updateError.message}` };
        }

        await fetchAttendees();
        return { success: true, message: `${attendeeIds.length} attendee(s) marked as vendors.` };
    }, [fetchAttendees]);

    const markAttendeesAsNonVendors = useCallback(async (attendeeIds: string[]) => {
        if (attendeeIds.length === 0) {
            return { success: true, message: 'No attendees selected.' };
        }

        const payload: Database['public']['Tables']['attendees']['Update'] = { is_vendor: false };
        const { error: updateError } = await supabase
            .from('attendees')
            .update(payload)
            .in('id', attendeeIds);

        if (updateError) {
            console.error('Error marking attendees as non-vendors:', updateError);
            return { success: false, message: `Failed to mark as attendees: ${updateError.message}` };
        }

        await fetchAttendees();
        return { success: true, message: `${attendeeIds.length} profile(s) marked as regular attendees.` };
    }, [fetchAttendees]);

    const getVendorsForBooth = useCallback(async (companyName: string): Promise<Attendee[]> => {
        const { data, error: fetchError } = await supabase
            .from('attendees')
            .select('*')
            .eq('organization', companyName)
            .eq('is_vendor', true);

        if (fetchError) {
            console.error('Error fetching vendors for booth:', fetchError);
            return [];
        }

        return (data || []).map(mapAttendeeFromDb);
    }, []);

    // --- Batch Operations ---

    const findOrCreateAttendeesBatch = useCallback(async (attendeesToProcess: { firstName: string, lastName: string, email?: string; organization: string; metadata?: Json | null }[]) => {
        if (!selectedEventId) {
            return { success: false, attendees: [], errors: ['No event selected'] };
        }

        const attendees: Attendee[] = [];
        const errors: string[] = [];

        for (const attendeeInput of attendeesToProcess) {
            const fullName = `${attendeeInput.firstName} ${attendeeInput.lastName}`.trim();
            const email = attendeeInput.email || `${attendeeInput.firstName.toLowerCase()}.${attendeeInput.lastName.toLowerCase()}@noemail.local`;

            // Try to find existing attendee by email
            const { data: existingData } = await supabase
                .from('attendees')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (existingData) {
                // Attendee exists, ensure linked to this event
                const { error: linkError } = await supabase
                    .from('event_attendees')
                    .upsert({ event_id: selectedEventId, attendee_id: existingData.id }, { onConflict: 'event_id,attendee_id' });

                if (!linkError) {
                    attendees.push(mapAttendeeFromDb(existingData));
                } else {
                    errors.push(`Failed to link ${fullName}: ${linkError.message}`);
                }
            } else {
                // Create new attendee
                const { data: newAttendeeData, error: createError } = await supabase
                    .from('attendees')
                    .insert({
                        name: fullName,
                        email,
                        organization: attendeeInput.organization,
                        metadata: attendeeInput.metadata || null
                    })
                    .select()
                    .single();

                if (createError || !newAttendeeData) {
                    errors.push(`Failed to create ${fullName}: ${createError?.message || 'Unknown error'}`);
                    continue;
                }

                // Link to event
                const { error: linkError } = await supabase
                    .from('event_attendees')
                    .insert({ event_id: selectedEventId, attendee_id: newAttendeeData.id });

                if (linkError) {
                    errors.push(`Created ${fullName} but failed to link: ${linkError.message}`);
                    // Cleanup: delete the attendee we just created
                    await supabase.from('attendees').delete().eq('id', newAttendeeData.id);
                } else {
                    attendees.push(mapAttendeeFromDb(newAttendeeData));
                }
            }
        }

        await fetchAttendees();
        return { success: errors.length === 0, attendees, errors };
    }, [selectedEventId, fetchAttendees]);

    // --- Context Value ---

    const value: AttendeeContextType = useMemo(() => ({
        attendees,
        loading,
        error,
        updateAttendee,
        deleteAttendee,
        mergeAttendees,
        checkInAttendee,
        undoCheckIn,
        addWalkInAttendee,
        getAttendeeById,
        searchGlobalAttendees,
        markAttendeesAsVendors,
        markAttendeesAsNonVendors,
        getVendorsForBooth,
        findOrCreateAttendeesBatch,
        fetchAttendees
    }), [
        attendees,
        loading,
        error,
        updateAttendee,
        deleteAttendee,
        mergeAttendees,
        checkInAttendee,
        undoCheckIn,
        addWalkInAttendee,
        getAttendeeById,
        searchGlobalAttendees,
        markAttendeesAsVendors,
        markAttendeesAsNonVendors,
        getVendorsForBooth,
        findOrCreateAttendeesBatch,
        fetchAttendees
    ]);

    return (
        <AttendeeContext.Provider value={value}>
            {children}
        </AttendeeContext.Provider>
    );
};

// --- Hook ---
export const useAttendees = (): AttendeeContextType => {
    const context = useContext(AttendeeContext);
    if (context === undefined) {
        throw new Error('useAttendees must be used within an AttendeeProvider');
    }
    return context;
};
