import { useCallback, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Database } from '../database.types';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import { useQuery } from '@tanstack/react-query';

// Define known package keys for type safety
export type FeaturePackageKey =
    | 'booth_management_suite'
    | 'session_conference_tools'
    | 'lead_capture_pro'
    | 'analytics_reporting'
    | 'attendee_portal_standard'
    | 'gamification_engagement'
    | 'live_operations'
    | 'communication_tools'
    | 'sponsorship_management';

export const useFeatureAccess = () => {
    const { selectedEventId } = useSelectedEvent();

    // Fetch the list of allowed packages for the current event's plan
    const { data: allowedPackages, isLoading } = useQuery({
        queryKey: ['feature_access', selectedEventId],
        queryFn: async () => {
            if (!selectedEventId) return [];

            // 1. Get Event -> Plan
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('plan_id')
                .eq('id', selectedEventId)
                .single();

            if (eventError || !eventData?.plan_id) return [];

            // 2. Get Plan -> Packages
            // We use the RPC function if available for efficiency, 
            // OR we just query the join tables directly.
            // Let's query tables directly for transparency.

            const { data: packages, error: pkgError } = await supabase
                .from('plan_packages')
                .select(`
                    package_id,
                    feature_packages (
                        key
                    )
                `)
                .eq('plan_id', eventData.plan_id);

            if (pkgError) return [];

            // Flatten to array of keys
            const keys: FeaturePackageKey[] = [];
            for (const p of packages) {
                const fp = p.feature_packages;
                if (fp && typeof fp === 'object' && 'key' in fp) {
                    keys.push((fp as { key: string }).key as FeaturePackageKey);
                }
            }
            return keys;
        },
        enabled: !!selectedEventId,
        staleTime: 1000 * 60 * 5 // Cache for 5 minutes
    });

    const hasPackage = useCallback((packageKey: FeaturePackageKey) => {
        if (!allowedPackages) return false;
        return allowedPackages.includes(packageKey);
    }, [allowedPackages]);

    return {
        hasPackage,
        allowedPackages,
        isLoading
    };
};
