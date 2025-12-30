import React from 'react';
import { Search, X } from 'lucide-react';

interface MobileSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    sticky?: boolean;
}

const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Search...',
    sticky = true
}) => {
    return (
        <div className={sticky ? 'sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 pb-3 pt-1' : ''}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MobileSearchBar;
