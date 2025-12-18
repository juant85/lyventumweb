// src/components/features/FeatureCategoryCard.tsx
import React from 'react';
import { Feature } from '../../features';
import { FeatureCategory } from '../../utils/featureHelpers';
import FeatureRow from './FeatureRow';
import Card from '../ui/Card';

interface FeatureCategoryCardProps {
    category: FeatureCategory;
    isFeatureEnabled: (feature: Feature) => boolean;
    planName?: string;
}

const FeatureCategoryCard: React.FC<FeatureCategoryCardProps> = ({
    category,
    isFeatureEnabled,
    planName
}) => {
    const enabledCount = category.features.filter(f => isFeatureEnabled(f)).length;
    const totalCount = category.features.length;

    return (
        <Card
            title={category.name}
            bodyClassName="!p-2"
            className="hover-lift transition-smooth"
        >
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <p className="text-xs text-slate-500">
                            {enabledCount} of {totalCount} active
                        </p>
                    </div>
                </div>
            </div>
            <div className="space-y-1 p-2">
                {category.features.map(feature => (
                    <FeatureRow
                        key={feature}
                        feature={feature}
                        enabled={isFeatureEnabled(feature)}
                        planName={planName}
                    />
                ))}
            </div>
        </Card>
    );
};

export default FeatureCategoryCard;
