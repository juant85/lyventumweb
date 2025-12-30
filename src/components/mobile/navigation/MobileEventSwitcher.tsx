import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { useAuth } from '../../../contexts/AuthContext';
import { XMarkIcon, MagnifyingGlassIcon, PlusCircleIcon, CheckCircleIcon } from '../../Icons';
import { Event } from '../../../types';
import Input from '../../ui/Input';
import haptics from '../../../utils/haptics';

interface MobileEventSwitcherProps {
    isOpen: boolean;
    onClose: () => void;
    onEventSelect: (eventId: string) => void;
    onCreateEvent?: () => void;
}

const MobileEventSwitcher: React.FC<MobileEventSwitcherProps> = ({
    isOpen,
    onClose,
    onEventSelect,
    onCreateEvent
}) => {
    const { availableEvents, selectedEventId } = useSelectedEvent();
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const isSuperAdmin = currentUser?.role === 'superadmin';

    // Filter events based on search
    const filteredEvents = availableEvents.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Categorize events
    const activeEvents = filteredEvents.filter(e => {
        // Simple active logic - can be enhanced with date checks
        return true; // For now, all are active
    });

    const handleEventClick = (eventId: string) => {
        haptics.light();
        onEventSelect(eventId);
        onClose();
    };

    const handleCreateClick = () => {
        haptics.light();
        if (onCreateEvent) {
            onCreateEvent();
        }
        onClose();
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-x-0 bottom-0 z-[101] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {isSuperAdmin ? 'All Events' : 'My Events'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search events..."
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Create Event Button (SuperAdmin only) */}
                        {isSuperAdmin && onCreateEvent && (
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                <button
                                    onClick={handleCreateClick}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                                >
                                    <PlusCircleIcon className="w-5 h-5" />
                                    <span>Create New Event</span>
                                </button>
                            </div>
                        )}

                        {/* Events List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 dark:text-slate-400">
                                        {searchTerm ? 'No events found' : 'No events available'}
                                    </p>
                                </div>
                            ) : (
                                activeEvents.map((event) => {
                                    const isSelected = event.id === selectedEventId;

                                    return (
                                        <button
                                            key={event.id}
                                            onClick={() => handleEventClick(event.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSelected
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            {/* Event Logo/Icon */}
                                            <div className="flex-shrink-0">
                                                {event.eventLogoUrl ? (
                                                    <img
                                                        src={event.eventLogoUrl}
                                                        alt={event.name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                                                        {event.name[0]}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Event Info */}
                                            <div className="flex-1 min-w-0 text-left">
                                                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                                    {event.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                    {event.companyName || 'No organization'}
                                                </p>
                                            </div>

                                            {/* Selected Indicator */}
                                            {isSelected && (
                                                <CheckCircleIcon className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                            )}

                                            {/* Status Badge */}
                                            <span className="flex-shrink-0 px-2 py-1 text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                                                Active
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} available
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileEventSwitcher;
