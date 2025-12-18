// src/components/plans/PlanCard.tsx
import React from 'react';
import { CheckCircleIcon } from '../Icons';
import Button from '../ui/Button';
import { getFeatureName } from '../../utils/featureHelpers';
import { Feature } from '../../features';

interface PlanCardProps {
    plan: {
        id: string;
        name: string;
        description: string | null;
    };
    features: Feature[];
    selected: boolean;
    recommended?: boolean;
    onSelect: () => void;
    showFeatureCount?: number;
}

const PlanCard: React.FC<PlanCardProps> = ({
    plan,
    features,
    selected,
    recommended = false,
    onSelect,
    showFeatureCount = 5,
}) => {
    const displayFeatures = features.slice(0, showFeatureCount);
    const remainingCount = features.length - showFeatureCount;

    return (
        <div
            className={`
        relative p-6 rounded-xl border-2 cursor-pointer
        transition-all duration-300 hover-lift
        ${selected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-xl ring-2 ring-primary-200 dark:ring-primary-800'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg bg-white dark:bg-slate-800'
                }
      `}
            onClick={onSelect}
        >
            {/* Recommended Badge */}
            {recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-md">
                        ⭐ Recommended
                    </span>
                </div>
            )}

            {/* Plan Header */}
            <div className="mb-4">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-montserrat">
                    {plan.name}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {plan.description || 'Perfect for your event management needs'}
                </p>
            </div>

            {/* Feature Count Badge */}
            <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <CheckCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {features.length} features included
                    </span>
                </div>
            </div>

            {/* Features List */}
            <div className="space-y-2 mb-6 min-h-[160px]">
                {displayFeatures.map((feature, index) => (
                    <div
                        key={feature}
                        className="flex items-start gap-2 text-sm slide-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <CheckCircleIcon className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-200">
                            {getFeatureName(feature)}
                        </span>
                    </div>
                ))}

                {remainingCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>+ {remainingCount} more feature{remainingCount > 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {/* Select Button */}
            <Button
                variant={selected ? 'primary' : 'neutral'}
                className="w-full transition-smooth"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
            >
                {selected ? (
                    <span className="flex items-center justify-center gap-2">
                        <CheckCircleIcon className="w-4 h-4" />
                        Selected
                    </span>
                ) : (
                    'Select This Plan'
                )}
            </Button>

            {/* Selected Indicator */}
            {selected && (
                <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg scale-in-bounce">
                        <CheckCircleIcon className="w-5 h-5 text-white" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanCard;
