import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import haptics from '../../utils/haptics';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
    badge?: number;
}

interface MobileTabViewProps {
    tabs: TabItem[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
}

/**
 * Mobile Tab View Component
 * Premium tab navigation with:
 * - Smooth animations
 * - Active indicator
 * - Swipeable content (future enhancement)
 * - Badge support
 */
const MobileTabView: React.FC<MobileTabViewProps> = ({ tabs, defaultTab, onChange }) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const handleTabChange = (tabId: string) => {
        if (tabId !== activeTab) {
            haptics.selection();
            setActiveTab(tabId);
            onChange?.(tabId);
        }
    };

    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabData = tabs.find(tab => tab.id === activeTab);

    return (
        <div className="flex flex-col h-full">
            {/* Tab Headers */}
            <div className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex-1 relative px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {tab.icon}
                                <span>{tab.label}</span>
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full font-bold">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Active Indicator */}
                <motion.div
                    className="absolute bottom-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                    initial={false}
                    animate={{
                        left: `${(activeIndex / tabs.length) * 100}%`,
                        width: `${100 / tabs.length}%`
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full overflow-y-auto"
                    >
                        {activeTabData?.content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MobileTabView;
