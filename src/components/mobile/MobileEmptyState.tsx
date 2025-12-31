import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MobileEmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

const MobileEmptyState: React.FC<MobileEmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            {/* Icon with gradient background */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-secondary-500/30 dark:from-primary-400/40 dark:to-secondary-400/40 blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-primary-500/10 to-secondary-500/10 dark:from-primary-400/30 dark:to-secondary-400/30 p-6 rounded-3xl border border-primary-200 dark:border-primary-700 shadow-lg dark:shadow-primary-900/20 flex items-center justify-center">
                    {icon}
                </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                {description}
            </p>

            {/* Actions */}
            {(actionLabel || secondaryActionLabel) && (
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                            {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            onClick={onSecondaryAction}
                            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            {secondaryActionLabel}
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default MobileEmptyState;
