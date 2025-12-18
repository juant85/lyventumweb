// src/contexts/booths/BoothContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Booth } from '../../types';
import { supabase } from '../../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSelectedEvent } from '../SelectedEventContext';
import { mapBoothFromDb } from '../../utils/dataMappers';
import { Database } from '../../database.types';

// Sort helper
const sortBooths = (booths: Booth[]): Booth[] => {
    return [...booths].sort((a, b) => a.physicalId.localeCompare(b.physicalId, undefined, { numeric: true, sensitivity: 'base' }));
};

// --- Context Interface ---
export interface BoothContextType {
    // State
    booths: Booth[];
    loading: boolean;
    error: string | null;

    // CRUD Operations
    addBooth: (physicalId: string, companyName: string) => Promise<{ success: boolean; message: string; newBooth?: Booth }>;
    updateBooth: (updatedBooth: Partial<Booth> & { id: string }) => Promise<{ success: boolean; message: string; updatedBooth?: Booth }>;
    deleteBooth: (boothId: string) => Promise<{ success: boolean; message: string }>;
    addBoothsBatch: (booths: Pick<Booth, 'physicalId' | 'companyName'>[]) => Promise<{ success: boolean; data: Booth[]; errors: { physicalId: string, error: string }[] }>;

    // Access Code Management
    regenerateAllBoothAccessCodes: () => Promise<{ success: boolean; message: string }>;

    // Sponsor Management (NEW)
    updateBoothSponsorStatus: (boothId: string, sponsorData: { isSponsor: boolean; tier?: 'platinum' | 'gold' | 'silver' | null; logoUrl?: string | null; websiteUrl?: string | null; description?: string | null }) => Promise<{ success: boolean; message: string }>;
    getSponsors: (tier?: 'platinum' | 'gold' | 'silver') => Booth[];

    // Utilities
    getBoothById: (boothId: string) => Booth | undefined;
    getBoothName: (boothId: string) => string | undefined;
    activeBoothsForSession: (sessionId: string) => Promise<Booth[]>;

    // Data Management
    fetchBooths: () => Promise<void>;
}

const BoothContext = createContext<BoothContextType | undefined>(undefined);

// --- Provider ---
export const BoothProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { selectedEventId, currentEvent } = useSelectedEvent();

    const [booths, setBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const realtimeChannelRef = React.useRef<RealtimeChannel | null>(null);

    // Fetch booths from database
    const fetchBooths = useCallback(async () => {
        if (!selectedEventId) {
            setBooths([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: boothsData, error: boothsError } = await supabase
                .from('booths')
                .select('*')
                .eq('event_id', selectedEventId);

            if (boothsError) {
                console.error('[BoothContext] Error fetching booths:', boothsError);
                throw new Error(`Booths: ${boothsError.message}`);
            }

            console.log(`[BoothContext] ✓ Fetched ${boothsData?.length || 0} booths for event ${selectedEventId}`);
            setBooths(sortBooths((boothsData ?? []).map(mapBoothFromDb)));
        } catch (err: any) {
            console.error('[BoothContext] Error fetching booths:', err);
            setError(err.message || 'Failed to load booths.');
        } finally {
            setLoading(false);
        }
    }, [selectedEventId]);

    // Initial fetch when selectedEventId changes
    useEffect(() => {
        fetchBooths();
    }, [selectedEventId]); // Only depend on selectedEventId

    // Realtime subscription (separate from initial fetch)
    useEffect(() => {
        if (!selectedEventId) return;

        const channel = supabase
            .channel(`booths-changes-${selectedEventId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'booths',
                filter: `event_id=eq.${selectedEventId}`
            }, () => {
                console.log('[BoothContext] Realtime update detected, refetching booths');
                fetchBooths();
            })
            .subscribe();

        realtimeChannelRef.current = channel;

        return () => {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
                realtimeChannelRef.current = null;
            }
        };
    }, [selectedEventId, fetchBooths]);

    // --- CRUD Operations ---

    const addBooth = useCallback(async (physicalId: string, companyName: string) => {
        if (!selectedEventId || !currentEvent) {
            return { success: false, message: 'No event selected.' };
        }

        console.log('🔵 [BoothContext.addBooth] Starting...');

        const nextBoothNumber = booths.length + 1;
        const eventCompanyPrefix = (currentEvent.companyName || currentEvent.name).replace(/\s+/g, '').toUpperCase();
        const eventYear = new Date().getFullYear();
        const accessCode = `${eventCompanyPrefix}${eventYear}${nextBoothNumber}`;

        const payload: Database['public']['Tables']['booths']['Insert'] = {
            physical_id: physicalId,
            company_name: companyName,
            event_id: selectedEventId,
            access_code: accessCode
        };

        const { data, error: insertError } = await supabase
            .from('booths')
            .insert(payload)
            .select()
            .single();

        if (insertError || !data) {
            if (insertError?.code === '23505') {
                return { success: false, message: `Booth with Physical ID '${physicalId}' or Access Code '${accessCode}' already exists for this event.` };
            }
            return { success: false, message: `Failed to add booth: ${insertError?.message}` };
        }

        const newBooth = mapBoothFromDb(data);
        console.log('✅ [BoothContext.addBooth] Booth created:', newBooth.id);

        // NEW: Auto-link to all existing sessions with default capacity 0
        try {
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('sessions')
                .select('id')
                .eq('event_id', selectedEventId);

            if (!sessionsError && sessionsData && sessionsData.length > 0) {
                console.log('🔵 [BoothContext.addBooth] Auto-linking to', sessionsData.length, 'session(s)...');

                const capacitiesToInsert = sessionsData.map(session => ({
                    session_id: session.id,
                    booth_id: newBooth.id,
                    capacity: 3 // Default capacity - reasonable default for meetings
                }));

                const { error: capacityError } = await supabase
                    .from('session_booth_capacities')
                    .insert(capacitiesToInsert);

                if (capacityError) {
                    console.error('❌ [BoothContext.addBooth] Failed to auto-link:', capacityError);
                } else {
                    console.log('✅ [BoothContext.addBooth] Auto-linked successfully to', sessionsData.length, 'session(s)');
                }
            } else {
                console.warn('⚠️ [BoothContext.addBooth] No sessions found to link booth to');
            }
        } catch (linkError) {
            console.error('❌ [BoothContext.addBooth] Exception during auto-link:', linkError);
            // Don't fail the whole operation
        }

        await fetchBooths(); // Refetch to sync state
        console.log('✅ [BoothContext.addBooth] Complete');

        return { success: true, message: 'Booth added successfully.', newBooth };
    }, [selectedEventId, currentEvent, booths.length, fetchBooths]);

    const updateBooth = useCallback(async (updatedBooth: Partial<Booth> & { id: string }) => {
        const payload: Database['public']['Tables']['booths']['Update'] = {
            physical_id: updatedBooth.physicalId,
            company_name: updatedBooth.companyName,
            email: updatedBooth.email,
            phone: updatedBooth.phone,
            notes: updatedBooth.notes,
            access_code: updatedBooth.accessCode,
            // Sponsor fields (NEW)
            company_id: updatedBooth.companyId,
            is_sponsor: updatedBooth.isSponsor,
            sponsorship_tier: updatedBooth.sponsorshipTier,
            sponsor_logo_url: updatedBooth.sponsorLogoUrl,
            sponsor_website_url: updatedBooth.sponsorWebsiteUrl,
            sponsor_description: updatedBooth.sponsorDescription,
        };

        const { data, error: updateError } = await supabase
            .from('booths')
            .update(payload)
            .eq('id', updatedBooth.id)
            .select()
            .single();

        if (updateError || !data) {
            return { success: false, message: `Failed to update booth: ${updateError?.message}` };
        }

        const changedBooth = mapBoothFromDb(data);
        await fetchBooths();

        return { success: true, message: 'Booth updated successfully.', updatedBooth: changedBooth };
    }, [fetchBooths]);

    const deleteBooth = useCallback(async (boothId: string) => {
        const { error: deleteError } = await supabase
            .from('booths')
            .delete()
            .eq('id', boothId);

        if (deleteError) {
            return { success: false, message: `Failed to delete booth: ${deleteError.message}` };
        }

        await fetchBooths();
        return { success: true, message: 'Booth deleted successfully.' };
    }, [fetchBooths]);

    const addBoothsBatch = useCallback(async (boothsData: Pick<Booth, 'physicalId' | 'companyName'>[]) => {
        if (!selectedEventId || !currentEvent) {
            return { success: false, data: [], errors: [{ physicalId: 'N/A', error: 'No event selected or event details missing.' }] };
        }

        // Fetch existing booths to check for duplicates
        const { data: existingBoothsData, error: fetchError } = await supabase
            .from('booths')
            .select('id, physical_id, access_code')
            .eq('event_id', selectedEventId);

        if (fetchError) {
            const errorList = boothsData.map(b => ({ physicalId: b.physicalId, error: `Failed to fetch existing booths: ${fetchError.message}` }));
            return { success: false, data: [], errors: errorList };
        }

        const existingBooths = existingBoothsData || [];
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

        const { data, error: upsertError } = await supabase
            .from('booths')
            .upsert(boothsToUpsert)
            .select();

        if (upsertError) {
            const errorList = boothsData.map(b => ({ physicalId: b.physicalId, error: upsertError.message }));
            return { success: false, data: [], errors: errorList };
        }

        const createdBooths = (data || []).map(b => mapBoothFromDb(b));
        await fetchBooths();

        return { success: true, data: createdBooths, errors: [] };
    }, [selectedEventId, currentEvent, fetchBooths]);

    // --- Access Code Management ---

    const regenerateAllBoothAccessCodes = useCallback(async () => {
        if (!selectedEventId || !currentEvent) {
            return { success: false, message: 'No event selected.' };
        }

        if (booths.length === 0) {
            return { success: true, message: 'No booths to update.' };
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

        const { error: upsertError } = await supabase
            .from('booths')
            .upsert(updates);

        if (upsertError) {
            console.error('Failed to regenerate booth codes:', upsertError);
            return { success: false, message: `Failed to update codes: ${upsertError.message}` };
        }

        await fetchBooths();
        return { success: true, message: 'All booth access codes have been regenerated.' };
    }, [selectedEventId, currentEvent, booths, fetchBooths]);

    // --- Sponsor Management (NEW) ---

    const updateBoothSponsorStatus = useCallback(async (
        boothId: string,
        sponsorData: {
            isSponsor: boolean;
            tier?: 'platinum' | 'gold' | 'silver' | null;
            logoUrl?: string | null;
            websiteUrl?: string | null;
            description?: string | null;
        }
    ) => {
        // Validate platinum tier (only one allowed per event)
        if (sponsorData.isSponsor && sponsorData.tier === 'platinum') {
            const existingPlatinum = booths.find(b =>
                b.id !== boothId &&
                b.isSponsor &&
                b.sponsorshipTier === 'platinum'
            );

            if (existingPlatinum) {
                return {
                    success: false,
                    message: `Only one Platinum sponsor allowed per event. Current platinum sponsor: ${existingPlatinum.companyName}`
                };
            }
        }

        const payload: Database['public']['Tables']['booths']['Update'] = {
            is_sponsor: sponsorData.isSponsor,
            sponsorship_tier: sponsorData.isSponsor ? sponsorData.tier : null,
            sponsor_logo_url: sponsorData.logoUrl,
            sponsor_website_url: sponsorData.websiteUrl,
            sponsor_description: sponsorData.description,
        };

        const { error: updateError } = await supabase
            .from('booths')
            .update(payload)
            .eq('id', boothId);

        if (updateError) {
            return { success: false, message: `Failed to update sponsor status: ${updateError.message}` };
        }

        await fetchBooths();
        return { success: true, message: 'Sponsor status updated successfully.' };
    }, [booths, fetchBooths]);

    const getSponsorsFn = useCallback((tier?: 'platinum' | 'gold' | 'silver'): Booth[] => {
        return booths.filter(booth => {
            if (!booth.isSponsor) return false;
            if (tier && booth.sponsorshipTier !== tier) return false;
            return true;
        });
    }, [booths]);

    // --- Utilities ---

    const getBoothById = useCallback((boothId: string): Booth | undefined => {
        return booths.find(b => b.id === boothId);
    }, [booths]);

    const getBoothName = useCallback((boothId: string): string | undefined => {
        return getBoothById(boothId)?.companyName;
    }, [getBoothById]);

    const activeBoothsForSession = useCallback(async (sessionId: string): Promise<Booth[]> => {
        const { data } = await supabase
            .from('session_registrations')
            .select('expected_booth_id')
            .eq('session_id', sessionId)
            .not('expected_booth_id', 'is', null);

        const boothIds = new Set((data || []).map(r => r.expected_booth_id as string));
        return booths.filter(b => boothIds.has(b.id));
    }, [booths]);

    // --- Context Value ---

    const value: BoothContextType = useMemo(() => ({
        booths,
        loading,
        error,
        addBooth,
        updateBooth,
        deleteBooth,
        addBoothsBatch,
        regenerateAllBoothAccessCodes,
        updateBoothSponsorStatus,
        getSponsors: getSponsorsFn,
        getBoothById,
        getBoothName,
        activeBoothsForSession,
        fetchBooths
    }), [
        booths,
        loading,
        error,
        addBooth,
        updateBooth,
        deleteBooth,
        addBoothsBatch,
        regenerateAllBoothAccessCodes,
        updateBoothSponsorStatus,
        getSponsorsFn,
        getBoothById,
        getBoothName,
        activeBoothsForSession,
        fetchBooths
    ]);

    return (
        <BoothContext.Provider value={value}>
            {children}
        </BoothContext.Provider>
    );
};

// --- Hook ---
export const useBooths = (): BoothContextType => {
    const context = useContext(BoothContext);
    if (context === undefined) {
        throw new Error('useBooths must be used within a BoothProvider');
    }
    return context;
};
