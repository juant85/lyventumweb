import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon, IconName } from '../ui/Icon';
import BottomSheet from '../ui/BottomSheet';
import haptics from '../../utils/haptics';

export interface QuickAction {
    icon: IconName;
    label: string;
    description?: string;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
}

interface QuickActionsFABProps {
    actions: QuickAction[];
}

/**
 * Quick Actions FAB with Bottom Sheet
 * Premium WhatsApp-style interaction
 */
const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);

    const iconBgMap = {
        primary: 'bg-primary-100 dark:bg-primary-900/30',
        secondary: 'bg-secondary-100 dark:bg-secondary-900/30',
        success: 'bg-green-100 dark:bg-green-900/30',
        danger: 'bg-red-100 dark:bg-red-900/30',
        warning: 'bg-amber-100 dark:bg-amber-900/30'
    };

    const iconColorMap = {
        primary: 'text-primary-600 dark:text-primary-400',
        secondary: 'text-secondary-600 dark:text-secondary-400',
        success: 'text-green-600 dark:text-green-400',
        danger: 'text-red-600 dark:text-red-400',
        warning: 'text-amber-600 dark:text-amber-400'
    };

    const handleActionClick = (action: QuickAction) => {
        haptics.medium();
        action.onClick();
        setIsOpen(false);
    };

    const handleToggle = () => {
        haptics.selection();
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Main FAB Button */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleToggle}
                className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-2xl flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary-500/50"
                aria-label="Quick Actions"
            >
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="flex items-center justify-center"
                >
                    <Icon name="plus" className="w-6 h-6" />
                </motion.div>
            </motion.button>

            {/* Bottom Sheet with Actions */}
            <BottomSheet
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Quick Actions"
            >
                <div className="space-y-2">
                    {actions.map((action, index) => {
                        const color = action.color || 'primary';
                        return (
                            <motion.button
                                key={action.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleActionClick(action)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${iconBgMap[color]} flex items-center justify-center`}>
                                    <Icon name={action.icon} className={`w-6 h-6 ${iconColorMap[color]}`} />
                                </div>

                                {/* Text */}
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {action.label}
                                    </p>
                                    {action.description && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {action.description}
                                        </p>
                                    )}
                                </div>

                                {/* Arrow */}
                                <Icon name="chevronRight" className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                            </motion.button>
                        );
                    })}
                </div>
            </BottomSheet>
        </>
    );
};

export default QuickActionsFAB;
