// src/components/ui/EmptyState.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './Button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                className="mb-4 p-6 rounded-full bg-slate-800/40 border border-slate-700/50"
            >
                <Icon className="w-12 h-12 text-slate-400" />
            </motion.div>

            <h3 className="text-2xl font-bold text-slate-200 mb-2 font-montserrat">
                {title}
            </h3>

            <p className="text-slate-400 max-w-md mb-6 leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary" size="md">
                    {actionLabel}
                </Button>
            )}
        </motion.div>
    );
};

export default EmptyState;
