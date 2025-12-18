// src/contexts/FeatureFlagContext.tsx
import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { Feature } from '../features';
import { useSelectedEvent } from './SelectedEventContext';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useSimulation } from './SimulationContext';

export interface FeatureFlagContextType {
  isFeatureEnabled: (feature: Feature) => boolean;
  isLoading: boolean;
  error: string | null;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedEventId, isInitializing: isEventInitializing } = useSelectedEvent();
  const { currentUser } = useAuth();
  const { simulatedPlanId } = useSimulation();

  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      // If event context is still initializing, keep loading state true
      if (isEventInitializing) {
        return;
      }

      setError(null);

      // Superadmins automatically get all features enabled, UNLESS they are simulating.
      if (currentUser?.role === 'superadmin' && !simulatedPlanId) {
        setEnabledFeatures(new Set(Object.values(Feature) as string[]));
        setIsLoading(false);
        return;
      }

      if (!selectedEventId && !simulatedPlanId) {
        setEnabledFeatures(new Set());
        setIsLoading(false);
        return;
      }

      let planIdToFetch: string | null = null;

      // Prioritize simulated plan
      if (simulatedPlanId) {
        planIdToFetch = simulatedPlanId;
      } else if (selectedEventId) {
        // Fetch the plan for the selected event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('plan_id')
          .eq('id', selectedEventId)
          .single();

        if (eventError) {
          setError(eventError.message);
          setEnabledFeatures(new Set());
          setIsLoading(false);
          return;
        }
        planIdToFetch = eventData?.plan_id || null;
      }

      if (!planIdToFetch) {
        // No plan for event and not simulating, so no features enabled.
        setEnabledFeatures(new Set());
        setIsLoading(false);
        return;
      }

      const { data: featuresData, error: featuresError } = await (supabase
        .from('plan_features') as any)
        .select('features(key)')
        .eq('plan_id', planIdToFetch);

      if (featuresError) {
        setError(featuresError.message);
        setEnabledFeatures(new Set());
        setIsLoading(false);
        return;
      }

      const featureKeys = new Set<string>(
        (featuresData || []).map((item: any) => (item.features as any)?.key).filter((key: any): key is string => !!key)
      );
      setEnabledFeatures(featureKeys);
      setIsLoading(false);
    };

    fetchFeatures();
  }, [selectedEventId, currentUser, simulatedPlanId]);

  const isFeatureEnabled: (feature: Feature) => boolean = useCallback(
    (feature: Feature) => {
      return enabledFeatures.has(feature);
    },
    [enabledFeatures]
  );

  const value = useMemo(() => ({
    isFeatureEnabled,
    isLoading,
    error,
  }), [isFeatureEnabled, isLoading, error]);

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
};

export const useFeatureFlags = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};