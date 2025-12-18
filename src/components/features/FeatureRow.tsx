// src/components/features/FeatureRow.tsx
import React from 'react';
import { Feature } from '../../features';
import { getFeatureName, getFeatureDescription } from '../../utils/featureHelpers';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '../Icons';

interface FeatureRowProps {
    feature: Feature;
    enabled: boolean;
    planName?: string;
    showDescription?: boolean;
}

const FeatureRow: React.FC<FeatureRowProps> = ({
    feature,
    enabled,
    planName,
    showDescription = false
}) => {
    const [showInfo, setShowInfo] = React.useState(false);

    return (
        <div className="flex items-start justify-between py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors">
            <div className="flex items-start gap-2 flex-1">
                {enabled ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                    <XCircleIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${enabled
                                ? 'text-slate-800 dark:text-slate-100'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                            {getFeatureName(feature)}
                        </span>
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            title="More info"
                        >
                            <InformationCircleIcon className="w-4 h-4" />
                        </button>
                    </div>
                    {(showDescription || showInfo) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {getFeatureDescription(feature)}
                        </p>
                    )}
                    {!enabled && planName && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Upgrade to unlock this feature
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeatureRow;
