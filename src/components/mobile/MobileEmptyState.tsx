import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { haptics } from '../../utils/haptics';

interface MobileEmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    /** Optional illustration/emoji to display */
    illustration?: string;
}

/**
 * Premium Empty State Component
 * Features: floating animation, pulse effect, haptic feedback
 */
const MobileEmptyState: React.FC<MobileEmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    illustration
}) => {
    const handlePrimaryAction = () => {
        haptics.medium();
        onAction?.();
    };

    const handleSecondaryAction = () => {
        haptics.light();
        onSecondaryAction?.();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            {/* Floating illustration/emoji (optional) */}
            {illustration && (
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="text-6xl mb-4"
                >
                    {illustration}
                </motion.div>
            )}

            {/* Icon with gradient background and subtle pulse */}
            <motion.div
                className="relative mb-6"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-secondary-500/30 dark:from-primary-400/40 dark:to-secondary-400/40 blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-primary-500/10 to-secondary-500/10 dark:from-primary-400/30 dark:to-secondary-400/30 p-6 rounded-3xl border border-primary-200 dark:border-primary-700 shadow-lg dark:shadow-primary-900/20 flex items-center justify-center backdrop-blur-sm">
                    {icon}
                </div>
            </motion.div>

            {/* Title with staggered animation */}
            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-slate-900 dark:text-white mb-2"
            >
                {title}
            </motion.h3>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm leading-relaxed"
            >
                {description}
            </motion.p>

            {/* Actions with enhanced buttons */}
            {(actionLabel || secondaryActionLabel) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
                >
                    {actionLabel && onAction && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePrimaryAction}
                            className="flex-1 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200"
                        >
                            {actionLabel}
                        </motion.button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSecondaryAction}
                            className="flex-1 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                        >
                            {secondaryActionLabel}
                        </motion.button>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};

export default MobileEmptyState;

