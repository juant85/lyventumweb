import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventData } from '../../contexts/EventDataContext';
import { Attendee } from '../../types';
import { UserIcon, MagnifyingGlassIcon, XMarkIcon, CheckCircleIcon, ClockIcon } from '../Icons';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

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
