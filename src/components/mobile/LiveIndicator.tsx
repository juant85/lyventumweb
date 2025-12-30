import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface LiveIndicatorProps {
    lastUpdated: Date;
    isRefreshing: boolean;
    onRefresh?: () => void;
}

const LiveIndicator: React.FC<LiveIndicatorProps> = ({ lastUpdated, isRefreshing, onRefresh }) => {
    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 10) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {/* Live Pulse */}
            <div className="flex items-center gap-1.5">
                <motion.div
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <span className="font-medium text-green-600 dark:text-green-400">LIVE</span>
            </div>

            {/* Separator */}
            <span className="text-slate-300 dark:text-slate-600">•</span>

            {/* Last Updated */}
            <span>
                {isRefreshing ? 'Updating...' : `Updated ${getTimeAgo(lastUpdated)}`}
            </span>

            {/* Manual Refresh Button */}
            {onRefresh && (
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="ml-1 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
                    aria-label="Refresh data"
                >
                    <Icon
                        name="refresh"
                        className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                </button>
            )}
        </div>
    );
};

export default LiveIndicator;
