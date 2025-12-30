import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, IconName } from '../ui/Icon';

export interface SpeedDialAction {
    icon: IconName;
    label: string;
    onClick: () => void;
    color?: string; // Changed to accept any color class
}

interface SpeedDialFABProps {
    actions: SpeedDialAction[];
}

const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);

    const colorMap = {
        primary: 'from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800',
        secondary: 'from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800',
        success: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
    };

    const handleActionClick = (action: SpeedDialAction) => {
        action.onClick();
        setIsOpen(false);
    };

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Speed Dial Actions */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-40 right-4 z-50 flex flex-col gap-3 items-end"
                    >
                        {actions.map((action, index) => (
                            <motion.button
                                key={action.label}
                                initial={{ scale: 0, x: 20 }}
                                animate={{ scale: 1, x: 0 }}
                                exit={{ scale: 0, x: 20 }}
                                transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                                onClick={() => handleActionClick(action)}
                                className="flex items-center gap-3 group"
                            >
                                {/* Label */}
                                <span className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold whitespace-nowrap group-hover:shadow-xl transition-shadow">
                                    {action.label}
                                </span>

                                {/* Action Button */}
                                <div className={`w-12 h-12 rounded-full ${action.color || 'bg-gradient-to-br from-primary-600 to-primary-700'} text-white shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all`}>
                                    <Icon name={action.icon} className="w-6 h-6" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center`}
                aria-label="Quick Actions"
            >
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <Icon name="plus" className="w-6 h-6" />
                </motion.div>
            </motion.button>
        </>
    );
};

export default SpeedDialFAB;
