// src/components/FeatureGuard.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { useAuth } from '../contexts/AuthContext';
import { Feature } from '../features';
import { getHomePathForRole } from './Layout'; // Import helper from Layout
import { ArrowPathIcon } from './Icons';

interface FeatureGuardProps {
  children: React.ReactNode;
  featureKey: Feature;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({ children, featureKey }) => {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  const { currentUser } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-8">
          <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">Verifying Permissions...</p>
        </div>
      </div>
    );
  }

  if (!isFeatureEnabled(featureKey)) {
    // If the feature is not enabled, redirect the user to their default home page.
    const homePath = currentUser ? getHomePathForRole(currentUser.role) : '/';
    return <Navigate to={homePath} replace />;
  }

  // If the feature is enabled, render the children components.
  return <>{children}</>;
};

export default FeatureGuard;
