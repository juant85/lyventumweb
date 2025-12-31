import React from 'react';
import { motion } from 'framer-motion';

interface ListSkeletonProps {
    count?: number;
    type?: 'card' | 'row';
}

/**
 * Premium skeleton loader for lists
 * Used in AttendeeList, EventsList, SessionsList
 */
const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3, type = 'card' }) => {
    if (type === 'row') {
        return (
            <div className="space-y-2">
                {[...Array(count)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="animate-pulse flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    }

    // Card type (default)
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-mobile-md"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                            <div className="flex gap-2 mt-2">
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default ListSkeleton;
