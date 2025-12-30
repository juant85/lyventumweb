```
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import Button from '../ui/Button';

interface MobileEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

const MobileEmptyState: React.FC<MobileEmptyStateProps> = ({
    icon: Icon,
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
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-primary-500/10 to-secondary-500/10 dark:from-primary-500/20 dark:to-secondary-500/20 p-6 rounded-3xl border border-primary-200 dark:border-primary-800">
                    <Icon className="w-12 h-12 text-primary-600 dark:text-primary-400" />
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
                        <Button
                            onClick={onAction}
                            variant="primary"
                            className="flex-1"
                        >
                            {actionLabel}
                        </Button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <Button
                            onClick={onSecondaryAction}
                            variant="secondary"
                            className="flex-1"
                        >
                            {secondaryActionLabel}
                        </Button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default MobileEmptyState;
```
