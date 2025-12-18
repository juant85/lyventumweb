// src/components/Feature.tsx
import React from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { Feature } from '../features';

interface FeatureProps {
  name: Feature;
  children: React.ReactNode;
}

const FeatureComponent: React.FC<FeatureProps> = ({ name, children }) => {
  const { isEnabled, isLoading } = useFeatureFlag(name);

  if (isLoading || !isEnabled) {
    return null;
  }

  return <>{children}</>;
};

export default FeatureComponent;
