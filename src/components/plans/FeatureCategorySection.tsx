// src/components/plans/FeatureCategorySection.tsx
import React, { useState, useMemo } from 'react';
import { Feature } from '../../features';
import { FeatureCategory } from '../../utils/featureHelpers';
import FeatureToggleRow from './FeatureToggleRow';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Database } from '../../database.types';

type FeatureRow = Database['public']['Tables']['features']['Row'];

interface FeatureCategorySectionProps {
    category: FeatureCategory;
    enabledFeatures: Set<string>; // Set of UUIDs
    allFeatures: FeatureRow[]; // All features from DB for mapping
    onToggleFeature: (feature: Feature) => void;
    disabled?: boolean;
    searchQuery?: string;
}

const FeatureCategorySection: React.FC<FeatureCategorySectionProps> = ({
    category,
    enabledFeatures,
    allFeatures,
    onToggleFeature,
    disabled = false,
    searchQuery = ''
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Create mapping from Feature enum to UUID
    const featureEnumToId = useMemo(() => {
        const map = new Map<Feature, string>();
        allFeatures.forEach(feature => {
            map.set(feature.key as Feature, feature.id);
        });
        return map;
    }, [allFeatures]);

    // Filter features based on search query
    const filteredFeatures = category.features.filter(feature => {
        if (!searchQuery) return true;
        const featureName = feature.toLowerCase();
        return featureName.includes(searchQuery.toLowerCase());
    });

    // Don't render if no features match search
    if (filteredFeatures.length === 0) return null;

    // Count enabled features by checking their UUIDs
    const enabledCount = filteredFeatures.filter(f => {
        const featureId = featureEnumToId.get(f);
        return featureId && enabledFeatures.has(featureId);
    }).length;

    const totalCount = filteredFeatures.length;
    const allEnabled = enabledCount === totalCount;
    const someEnabled = enabledCount > 0 && enabledCount < totalCount;

    const handleEnableAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;

        filteredFeatures.forEach(feature => {
            const featureId = featureEnumToId.get(feature);
            if (featureId && !enabledFeatures.has(featureId)) {
                onToggleFeature(feature);
            }
        });
    };

    const handleDisableAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;

        filteredFeatures.forEach(feature => {
            const featureId = featureEnumToId.get(feature);
            if (featureId && enabledFeatures.has(featureId)) {
                onToggleFeature(feature);
            }
        });
    };

    return (
        <div className="space-y-2">
            {/* Category Header */}
            <div
                className="flex items-center justify-between py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-3 flex-1">
                    {/* Collapse Icon */}
                    <button className="p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600 rounded transition-colors">
                        {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        )}
                    </button>

                    {/* Category Icon and Name */}
                    <span className="text-xl" role="img" aria-label={category.name}>
                        {category.icon}
                    </span>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        {category.name}
                    </h3>

                    {/* Counter Badge */}
                    <span
                        className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${allEnabled
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : someEnabled
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }
                        `}
                    >
                        {enabledCount}/{totalCount}
                    </span>
                </div>

                {/* Quick Actions */}
                {!disabled && (
                    <div className="flex items-center gap-2">
                        {enabledCount < totalCount && (
                            <button
                                onClick={handleEnableAll}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors px-2 py-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                            >
                                Enable All
                            </button>
                        )}
                        {enabledCount > 0 && (
                            <button
                                onClick={handleDisableAll}
                                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            >
                                Disable All
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Features List */}
            {!isCollapsed && (
                <div className="space-y-1 pl-2">
                    {filteredFeatures.map((feature, index) => {
                        const featureId = featureEnumToId.get(feature);
                        return (
                            <div
                                key={feature}
                                style={{ animationDelay: `${index * 30}ms` }}
                                className="animate-slideIn"
                            >
                                <FeatureToggleRow
                                    feature={feature}
                                    enabled={featureId ? enabledFeatures.has(featureId) : false}
                                    onToggle={onToggleFeature}
                                    disabled={disabled}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FeatureCategorySection;
