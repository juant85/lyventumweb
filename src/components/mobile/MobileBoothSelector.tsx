import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Booth } from '../../types';
import Input from '../ui/Input';
import MobileEmptyState from './MobileEmptyState';

interface MobileBoothSelectorProps {
    booths: Booth[];
    onSelect: (boothId: string) => void;
}

const MobileBoothSelector: React.FC<MobileBoothSelectorProps> = ({ booths, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter and sort booths
    const filteredBooths = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        return booths
            .filter(booth =>
                booth.companyName.toLowerCase().includes(query) ||
                booth.physicalId.toLowerCase().includes(query)
            )
            .sort((a, b) => a.physicalId.localeCompare(b.physicalId));
    }, [booths, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 p-4 shadow-sm border-b border-slate-200 dark:border-slate-800">
                <h1 className="text-2xl font-bold text-slate-900 dark:bg-white mb-3">
                    Select Your Booth
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    {booths.length} booth{booths.length !== 1 ? 's' : ''} available
                </p>
                <Input
                    placeholder="🔍 Search by booth or company..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    wrapperClassName="!mb-0"
                />
            </div>

            {/* Scrollable Booth List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-safe">
                {filteredBooths.length === 0 ? (
                    <MobileEmptyState
                        icon={<Icon name="search" className="w-12 h-12" />}
                        title="No booths found"
                        description={searchQuery ? `No matches for "${searchQuery}"` : 'No booths available'}
                    />
                ) : (
                    filteredBooths.map((booth, index) => (
                        <motion.button
                            key={booth.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(booth.id)}
                            className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 min-h-[80px] hover:shadow-md transition-shadow"
                        >
                            {/* Physical ID Badge */}
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                                <Icon name="store" className="w-8 h-8" />
                            </div>

                            {/* Booth Info */}
                            <div className="flex-1 text-left min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                    {booth.companyName}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Booth {booth.physicalId}
                                </p>
                            </div>

                            {/* Arrow */}
                            <Icon name="chevronRight" className="w-6 h-6 text-slate-400 flex-shrink-0" />
                        </motion.button>
                    ))
                )}
            </div>
        </div>
    );
};

export default MobileBoothSelector;
