/**
 * useBoothCapacity Hook
 * 
 * Calculates real-time booth capacity by counting non-vendor registrations.
 * 
 * @description
 * This hook queries the session_registrations table and excludes vendor staff
 * from the capacity count. It's used in DataVisualizationPage to show accurate
 * attendee capacity on booth cards.
 * 
 * @example
 * ```tsx
 * const { getCapacity, loading } = useBoothCapacity(selectedSession?.id);
 * const capacity = getCapacity(boothId); // Returns count of non-vendor attendees
 * ```
 * 
 * @architecture
 * - Queries: session_registrations JOIN attendees
 * - Filters: is_vendor = false
 * - Returns: Map of "sessionId|boothId" -> count
 * 
 * @see /docs/BOOTH_CAPACITY_CALCULATION.md for full technical documentation
 */
// src/hooks/useBoothCapacity.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface BoothCapacityMap {
    [key: string]: number; // key format: "sessionId|boothId"
}

export const useBoothCapacity = (sessionId: string | null) => {
    const [capacityMap, setCapacityMap] = useState<BoothCapacityMap>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            setCapacityMap({});
            setLoading(false);
            return;
        }

        const fetchCapacities = async () => {
            setLoading(true);

            console.log('[useBoothCapacity] Fetching capacities for session:', sessionId);

            // Query: Count registrations per booth for this session,
            // EXCLUDING vendors (is_vendor = false)
            const { data, error } = await supabase
                .from('session_registrations')
                .select('expected_booth_id, attendees!inner(is_vendor)')
                .eq('session_id', sessionId)
                .eq('attendees.is_vendor', false)
                .not('expected_booth_id', 'is', null);

            if (error) {
                console.error('[useBoothCapacity] Error fetching capacities:', error);
                setLoading(false);
                return;
            }

            console.log('[useBoothCapacity] Query returned', data?.length || 0, 'registrations');

            // Count registrations per booth
            const counts: BoothCapacityMap = {};
            (data || []).forEach((reg: any) => {
                const boothId = reg.expected_booth_id;
                if (boothId) {
                    const key = `${sessionId}|${boothId}`;
                    counts[key] = (counts[key] || 0) + 1;
                }
            });

            console.log('[useBoothCapacity] Calculated capacities:', counts);
            setCapacityMap(counts);
            setLoading(false);
        };

        fetchCapacities();
    }, [sessionId]);

    const getCapacity = (boothId: string): number => {
        if (!sessionId) return 0;
        const key = `${sessionId}|${boothId}`;
        return capacityMap[key] || 0;
    };

    return { getCapacity, loading, capacityMap };
};
