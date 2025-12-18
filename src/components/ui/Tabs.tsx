import React, { ReactNode, useState } from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: ReactNode;
    content: ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    defaultTabId?: string;
    className?: string;
}

export default function Tabs({ tabs, defaultTabId, className = '' }: TabsProps) {
    const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

    const activeTab = tabs.find(tab => tab.id === activeTabId);

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = activeTabId === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${isActive
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                    }
                    `}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {tab.icon && (
                                    <span className={`mr-2.5 ${isActive ? 'text-primary-500 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'}`}>
                                        {tab.icon}
                                    </span>
                                )}
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-6">
                {activeTab?.content}
            </div>
        </div>
    );
}
