import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '../Icons';

interface PullToRefreshIndicatorProps {
    isPulling: boolean;
    isRefreshing: boolean;
    pullDistance: number;
    progress: number;
    threshold?: number;
}

const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
    isPulling,
    isRefreshing,
    pullDistance,
    progress,
    threshold = 80
}) => {
    const showIndicator = isPulling || isRefreshing;
    const isReady = progress >= 100;

    return (
        <AnimatePresence>
            {showIndicator && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
                    style={{ top: `${Math.min(pullDistance + 64, 120)}px` }}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                        {isRefreshing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Refreshing...
                                </span>
                            </>
                        ) : (
                            <>
                                <motion.div
                                    animate={{
                                        rotate: isReady ? 180 : 0,
                                        scale: isReady ? 1.1 : 1
                                    }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                    className={`${isReady
                                        ? 'text-green-500'
                                        : 'text-slate-400 dark:text-slate-500'
                                        }`}
                                >
                                    <ChevronDownIcon className="w-5 h-5" />
                                </motion.div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {isReady ? 'Release to refresh' : 'Pull to refresh'}
                                </span>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PullToRefreshIndicator;
