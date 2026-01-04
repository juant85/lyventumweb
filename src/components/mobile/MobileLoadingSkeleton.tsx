import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

/**
 * Shimmer effect skeleton element
 */
const Shimmer: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
    </div>
);

/**
 * Card skeleton variant
 */
export const SkeletonCard: React.FC<{ index?: number }> = ({ index = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-mobile-md border border-slate-100 dark:border-slate-700"
    >
        <div className="flex items-start gap-3">
            <Shimmer className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <Shimmer className="h-4 rounded-lg w-3/4" />
                <Shimmer className="h-3 rounded-lg w-full" />
                <Shimmer className="h-3 rounded-lg w-5/6" />
            </div>
        </div>
    </motion.div>
);

/**
 * Stats row skeleton
 */
export const SkeletonStats: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 gap-3"
    >
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <Shimmer className="h-8 w-12 rounded-lg mb-2" />
                <Shimmer className="h-3 w-20 rounded" />
            </div>
        ))}
    </motion.div>
);

/**
 * List item skeleton
 */
export const SkeletonListItem: React.FC<{ index?: number }> = ({ index = 0 }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
    >
        <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Shimmer className="h-4 rounded w-2/3" />
            <Shimmer className="h-3 rounded w-1/2" />
        </div>
        <Shimmer className="w-8 h-8 rounded-lg flex-shrink-0" />
    </motion.div>
);

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
                    <Shimmer className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Shimmer className="h-5 rounded-lg w-3/4" />
                        <Shimmer className="h-3 rounded w-1/2" />
                    </div>
                </div>
            </div>

            {/* Content Skeletons */}
            <div className="p-4 space-y-4">
                {/* Stats skeleton */}
                <SkeletonStats />

                {/* Card Skeletons */}
                {[0, 1, 2].map((i) => (
                    <SkeletonCard key={i} index={i} />
                ))}
            </div>

            {/* Subtle pulse indicator */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="w-2 h-2 rounded-full bg-primary-500"
                />
            </div>
        </div>
    );
};

export default MobileLoadingSkeleton;

