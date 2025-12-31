import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium skeleton loader for mobile page transitions
 * Shows during lazy-loaded page imports
 */
const MobileLoadingSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                    <div className="animate-pulse w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                        <div className="animate-pulse h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="animate-pulse h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                </div>
            </div>

            {/* Content Skeletons */}
            <div className="p-4 space-y-4">
                {/* Card Skeletons */}
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-mobile-md"
                    >
                        <div className="animate-pulse flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pulse Animation Overlay */}
            <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="w-16 h-16 rounded-full bg-primary-500/20"
                />
            </div>
        </div>
    );
};

export default MobileLoadingSkeleton;
