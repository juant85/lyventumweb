// src/hooks/useFeatureFlag.ts
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { Feature } from '../features';

export const useFeatureFlag = (feature: Feature): { isEnabled: boolean; isLoading: boolean } => {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  
  return {
    isEnabled: isFeatureEnabled(feature),
    isLoading,
  };
};
