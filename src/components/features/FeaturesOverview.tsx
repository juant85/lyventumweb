// src/components/features/FeaturesOverview.tsx
import React from 'react';
import { featureCategories } from '../../utils/featureHelpers';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import FeatureCategoryCard from './FeatureCategoryCard';
import { ArrowPathIcon } from '../Icons';
import Alert from '../ui/Alert';
import EmptyState from '../ui/EmptyState';
import { PackageIcon } from 'lucide-react';

const FeaturesOverview: React.FC = () => {
    const { isFeatureEnabled, isLoading, error } = useFeatureFlags();
    const { currentEvent } = useSelectedEvent();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-primary-500" />
                <span className="ml-2 text-slate-600 dark:text-slate-300">
                    Loading features...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert type="error" message={`Failed to load features: ${error}`} />
        );
    }

    if (!currentEvent) {
        return (
            <EmptyState
                icon={PackageIcon}
                title="No Event Selected"
                description="Select an event from the dropdown above to view its available features and capabilities."
            />
        );
    }

    // Check if event has no plan
    const hasNoPlan = !currentEvent.planName;
    const allFeaturesDisabled = Object.values(featureCategories)
        .flatMap(cat => cat.features)
        .every(feature => !isFeatureEnabled(feature));


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Your Features
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Plan: <strong>{currentEvent.planName || 'No Plan'}</strong>
                    </p>
                </div>
            </div>

            {hasNoPlan || allFeaturesDisabled ? (
                <EmptyState
                    icon={PackageIcon}
                    title="No Features Available"
                    description="This event doesn't have a plan assigned yet. Assign a subscription plan to unlock features like analytics, reports, and advanced tools."
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.values(featureCategories).map(category => (
                        <FeatureCategoryCard
                            key={category.name}
                            category={category}
                            isFeatureEnabled={isFeatureEnabled}
                            planName="Premium"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeaturesOverview;
