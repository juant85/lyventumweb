import React from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '../Icons';

interface FilterChip {
    id: string;
    label: string;
    value: string;
}

interface FilterChipsProps {
    filters: FilterChip[];
    activeFilters: string[];
    onFilterToggle: (value: string) => void;
    onClearAll?: () => void;
    multiSelect?: boolean;
}

const FilterChips: React.FC<FilterChipsProps> = ({
    filters,
    activeFilters,
    onFilterToggle,
    onClearAll,
    multiSelect = false
}) => {
    const handleChipClick = (value: string) => {
        if (multiSelect) {
            onFilterToggle(value);
        } else {
            // Single select - clear others
            onFilterToggle(value);
        }
    };

    const hasActiveFilters = activeFilters.length > 0 && (multiSelect || activeFilters[0] !== 'all');

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Filter Chips */}
            {filters.map((filter) => {
                const isActive = activeFilters.includes(filter.value);

                return (
                    <motion.button
                        key={filter.id}
                        onClick={() => handleChipClick(filter.value)}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
                            transition-all duration-200
                            ${isActive
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }
                        `}
                    >
                        {filter.label}
                        {isActive && filter.value !== 'all' && (
                            <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-white/20 rounded-full">
                                ✓
                            </span>
                        )}
                    </motion.button>
                );
            })}

            {/* Clear All Button */}
            {hasActiveFilters && onClearAll && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={onClearAll}
                    className="flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Clear</span>
                </motion.button>
            )}
        </div>
    );
};

export default FilterChips;
