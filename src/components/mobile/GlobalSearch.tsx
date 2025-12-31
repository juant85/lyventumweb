import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventData } from '../../contexts/EventDataContext';
import { Attendee, Booth, Session } from '../../types';
import { UserIcon, MagnifyingGlassIcon, XMarkIcon, CheckCircleIcon, ClockIcon, BuildingStorefrontIcon, CalendarDaysIcon } from '../Icons';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

type EntityType = 'all' | 'attendees' | 'booths' | 'sessions';

interface SearchResult {
    id: string;
    type: 'attendee' | 'booth' | 'session';
    name: string;
    subtitle: string;
    icon: React.ReactNode;
    status?: string;
    data: Attendee | Booth | Session;
}

const RECENT_SEARCHES_KEY = 'lyventum_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
    const { attendees, booths, sessions, scans } = useEventData();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [filter, setFilter] = useState<EntityType>('all');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Load recent searches on mount
    useEffect(() => {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading recent searches:', e);
            }
        }
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (!isOpen) {
                    // Open search (would need parent component to handle)
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Search logic
    useEffect(() => {
        if (!searchTerm.trim()) {
            setResults([]);
            setSelectedIndex(0);
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const allResults: SearchResult[] = [];

        // Search Attendees
        if (filter === 'all' || filter === 'attendees') {
            const attendeeResults = attendees
                .filter(a =>
                    a.name.toLowerCase().includes(searchLower) ||
                    a.organization.toLowerCase().includes(searchLower) ||
                    (a.email && a.email.toLowerCase().includes(searchLower)) ||
                    (a.position && a.position.toLowerCase().includes(searchLower))
                )
                .slice(0, 5)
                .map(a => ({
                    id: a.id,
                    type: 'attendee' as const,
                    name: highlightMatch(a.name, searchTerm),
                    subtitle: highlightMatch(a.organization, searchTerm),
                    icon: <UserIcon className="w-5 h-5" />,
                    status: a.checkInTime ? 'Checked In' : 'Expected',
                    data: a
                }));
            allResults.push(...attendeeResults);
        }

        // Search Booths
        if (filter === 'all' || filter === 'booths') {
            const boothResults = booths
                .filter(b =>
                    b.companyName.toLowerCase().includes(searchLower) ||
                    b.physicalId.toLowerCase().includes(searchLower)
                )
                .slice(0, 5)
                .map(b => ({
                    id: b.id,
                    type: 'booth' as const,
                    name: highlightMatch(b.companyName, searchTerm),
                    subtitle: `Booth ${highlightMatch(b.physicalId, searchTerm)}`,
                    icon: <BuildingStorefrontIcon className="w-5 h-5" />,
                    data: b
                }));
            allResults.push(...boothResults);
        }

        // Search Sessions
        if (filter === 'all' || filter === 'sessions') {
            const sessionResults = sessions
                .filter(s =>
                    s.name.toLowerCase().includes(searchLower)
                )
                .slice(0, 5)
                .map(s => ({
                    id: s.id,
                    type: 'session' as const,
                    name: highlightMatch(s.name, searchTerm),
                    subtitle: new Date(s.startTime).toLocaleDateString(),
                    icon: <CalendarDaysIcon className="w-5 h-5" />,
                    status: 'Scheduled',
                    data: s
                }));
            allResults.push(...sessionResults);
        }

        setResults(allResults.slice(0, 10));
        setSelectedIndex(0);
    }, [searchTerm, attendees, booths, sessions, filter]);

    const highlightMatch = (text: string, query: string): string => {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>');
    };

    const saveRecentSearch = (term: string) => {
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT_SEARCHES);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const handleResultClick = (result: SearchResult) => {
        saveRecentSearch(searchTerm);

        if (result.type === 'attendee') {
            navigate(`/admin/attendees/${result.id}`);
        } else if (result.type === 'booth') {
            navigate(`/admin/booth-setup`); // Or specific booth page
        } else if (result.type === 'session') {
            navigate(`/admin/sessions`); // Or specific session page
        }

        onClose();
        setSearchTerm('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
            setSearchTerm('');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Search Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4 z-50"
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Search Input */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <MagnifyingGlassIcon className="w-6 h-6 text-slate-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search attendees, booths, sessions..."
                                        className="flex-1 bg-transparent text-lg outline-none text-slate-800 dark:text-white placeholder-slate-400"
                                    />
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                {/* Filter Chips */}
                                <div className="flex gap-2">
                                    {(['all', 'attendees', 'booths', 'sessions'] as EntityType[]).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === f
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Searches */}
                            {!searchTerm && recentSearches.length > 0 && (
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">RECENT</span>
                                        <button
                                            onClick={clearRecentSearches}
                                            className="text-xs text-primary-600 hover:text-primary-700"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map((term, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSearchTerm(term)}
                                                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Results */}
                            <div className="max-h-96 overflow-y-auto">
                                {searchTerm && results.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        No results found for "{searchTerm}"
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {results.map((result, index) => (
                                            <button
                                                key={result.id}
                                                onClick={() => handleResultClick(result)}
                                                className={`w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left ${index === selectedIndex ? 'bg-slate-50 dark:bg-slate-700/50' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white flex-shrink-0">
                                                        {result.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3
                                                                className="font-semibold text-slate-800 dark:text-white truncate"
                                                                dangerouslySetInnerHTML={{ __html: result.name }}
                                                            />
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                                {result.type}
                                                            </span>
                                                        </div>
                                                        <p
                                                            className="text-sm text-slate-600 dark:text-slate-400 truncate"
                                                            dangerouslySetInnerHTML={{ __html: result.subtitle }}
                                                        />
                                                    </div>
                                                    {result.status && (
                                                        <span className={`text-xs font-semibold ${result.status === 'Checked In' || result.status === 'Live'
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-amber-600 dark:text-amber-400'
                                                            }`}>
                                                            {result.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400">
                                        <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Start typing to search...</p>
                                        <p className="text-sm mt-1">Use ↑↓ arrows to navigate, Enter to select</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};



const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
    const { attendees, scans } = useEventData();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Attendee[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = attendees
            .filter(attendee =>
                attendee.name.toLowerCase().includes(searchLower) ||
                attendee.organization.toLowerCase().includes(searchLower) ||
                (attendee.email && attendee.email.toLowerCase().includes(searchLower)) ||
                (attendee.position && attendee.position.toLowerCase().includes(searchLower))
            )
            .slice(0, 10); // Limit to top 10 results

        setResults(filtered);
    }, [searchTerm, attendees]);

    const getLastSeen = (attendeeId: string) => {
        const attendeeScans = scans
            .filter(s => s.attendeeId === attendeeId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (attendeeScans.length === 0) return null;

        return {
            location: attendeeScans[0].boothId || attendeeScans[0].sessionId || 'Unknown',
            time: new Date(attendeeScans[0].timestamp)
        };
    };

    const handleAttendeeClick = (attendee: Attendee) => {
        navigate(`/admin/attendees/${attendee.id}`);
        onClose();
        setSearchTerm('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
            setSearchTerm('');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Search Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4 z-50"
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Search Input */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <MagnifyingGlassIcon className="w-6 h-6 text-slate-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search attendees by name, org, email, position..."
                                        className="flex-1 bg-transparent text-lg outline-none text-slate-800 dark:text-white placeholder-slate-400"
                                    />
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="max-h-96 overflow-y-auto">
                                {searchTerm && results.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        No attendees found matching "{searchTerm}"
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {results.map(attendee => {
                                            const lastSeen = getLastSeen(attendee.id);
                                            return (
                                                <button
                                                    key={attendee.id}
                                                    onClick={() => handleAttendeeClick(attendee)}
                                                    className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                                            {attendee.name[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                                                                    {attendee.name}
                                                                </h3>
                                                                {attendee.checkInTime ? (
                                                                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                ) : (
                                                                    <ClockIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                                                {attendee.organization}
                                                                {attendee.position && ` • ${attendee.position}`}
                                                            </p>
                                                            {lastSeen && (
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    Last seen: {lastSeen.time.toLocaleTimeString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {attendee.checkInTime ? (
                                                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                                                Checked In
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                                Expected
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400">
                                        <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Start typing to search attendees...</p>
                                        <p className="text-sm mt-1">Press ESC to close</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default GlobalSearch;
