// src/components/plans/FeatureToggleRow.tsx
import React, { useState } from 'react';
import { Feature } from '../../features';
import { getFeatureName, getFeatureDescription } from '../../utils/featureHelpers';
import { CheckCircle, Circle, Info } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';

interface FeatureToggleRowProps {
    feature: Feature;
    enabled: boolean;
    onToggle: (feature: Feature) => void;
    disabled?: boolean;
}

const FeatureToggleRow: React.FC<FeatureToggleRowProps> = ({
    feature,
    enabled,
    onToggle,
    disabled = false
}) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div
            className={`
                group relative flex items-center justify-between gap-3 
                py-3 px-4 rounded-lg
                transition-all duration-200 ease-out
                ${enabled
                    ? 'bg-gradient-to-r from-green-50 to-transparent hover:from-green-100 dark:from-green-950/30 dark:hover:from-green-900/40'
                    : 'bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-800/30 dark:hover:bg-slate-800/50'
                }
                ${!disabled && 'hover:translate-x-1 cursor-pointer'}
                ${disabled && 'opacity-50 cursor-not-allowed'}
            `}
            onClick={() => !disabled && onToggle(feature)}
        >
            {/* Left side: Icon + Text */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {enabled ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                </div>

                {/* Feature Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`
                            text-sm font-medium transition-colors
                            ${enabled
                                ? 'text-slate-800 dark:text-slate-100'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                        `}>
                            {getFeatureName(feature)}
                        </span>

                        {/* Info Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInfo(!showInfo);
                            }}
                            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="More info"
                        >
                            <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        </button>
                    </div>

                    {/* Description (shown on hover or when info clicked) */}
                    <div
                        className={`
                            overflow-hidden transition-all duration-200
                            ${showInfo ? 'max-h-20 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                        `}
                    >
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {getFeatureDescription(feature)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side: Toggle */}
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <ToggleSwitch
                    id={`feature-${feature}`}
                    checked={enabled}
                    onChange={() => onToggle(feature)}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};

export default FeatureToggleRow;
