
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { BoothMetrics } from '../../types';

interface MobileBoothCardProps {
    booth: BoothMetrics;
    rank: number;
    onClick: () => void;
}

const MobileBoothCard: React.FC<MobileBoothCardProps> = ({ booth, rank, onClick }) => {
    // Mock logic for status since it's not in base type yet
    const isActive = booth.totalScans > 0;

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 relative overflow-hidden"
        >
            {/* Rank/Index Indicator */}
            <div className="flex-shrink-0 w-8 text-center">
                <span className={`text-sm font-bold ${rank <= 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                    #{rank}
                </span>
            </div>

            {/* Main Info */}
            <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2">
                        {booth.boothName}
                    </h3>
                    {isActive && (
                        <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                    )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                    {booth.ownerName || 'Unknown Owner'}
                </p>

                {/* Mini Stats Row */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        <Icon name="scan" className="w-3 h-3 text-primary-500" />
                        {booth.uniqueScans}
                    </div>

                    {/* Progress Bar (Visual Flair) */}
                    <div className="flex-grow h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                            style={{ width: `${Math.min((booth.uniqueScans / 100) * 100, 100)}%` }} // Arbitrary 100 goal for visual
                        />
                    </div>
                </div>
            </div>

            {/* Chevron */}
            <div className="flex-shrink-0 text-slate-400">
                <Icon name="chevronDown" className="w-5 h-5 -rotate-90" />
            </div>
        </motion.div>
    );
};

export default MobileBoothCard;
