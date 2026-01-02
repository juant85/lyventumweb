import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useEventData } from '../../../contexts/EventDataContext';
import { Attendee } from '../../../types';
import Input from '../../ui/Input';
import MobileCard from '../MobileCard';
import SwipeableListItem from '../SwipeableListItem';
import { UserIcon, UserPlusIcon, MagnifyingGlassIcon } from '../../Icons';
import MobileEmptyState from '../MobileEmptyState';
import ListSkeleton from '../ListSkeleton';
import { useLanguage } from '../../../contexts/LanguageContext';
import Button from '../../ui/Button';
import { staggerContainer, staggerItem } from '../../../utils/animations';

interface MobileAttendeeListProps {
    onAddClick: () => void;
    onEditClick?: (attendee: Attendee) => void;
    onDeleteClick?: (attendee: Attendee) => void;
}

const MobileAttendeeList: React.FC<MobileAttendeeListProps> = ({ onAddClick, onEditClick, onDeleteClick }) => {
    const { attendees, loadingData } = useEventData();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'checkedIn' | 'expected'>('all');

    const filteredAttendees = attendees
        .filter(attendee => {
            // Filter by tab
            if (filterTab === 'checkedIn' && !attendee.checkInTime) return false;
            if (filterTab === 'expected' && attendee.checkInTime) return false;

            // Filter by search
            const searchLower = searchTerm.toLowerCase();
            return (
                attendee.name.toLowerCase().includes(searchLower) ||
                attendee.organization.toLowerCase().includes(searchLower) ||
                (attendee.email && attendee.email.toLowerCase().includes(searchLower))
            );
        });

    const stats = {
        all: attendees.length,
        checkedIn: attendees.filter(a => !!a.checkInTime).length,
        expected: attendees.filter(a => !a.checkInTime).length
    };

    return (
        <div className="space-y-4 pb-20">
            {/* Header & Search */}
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 pt-2 pb-2 z-10 px-1">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <UserIcon className="w-6 h-6 text-primary-600" />
                            Attendees
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {attendees.length} Total • {filteredAttendees.length} Shown
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={onAddClick}
                        className="shadow-md shadow-primary-500/20"
                        leftIcon={<UserPlusIcon className="w-4 h-4" />}
                        aria-label="Add new attendee"
                    >
                        Add
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => setFilterTab('all')}
                        className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${filterTab === 'all'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        All ({stats.all})
                    </button>
                    <button
                        onClick={() => setFilterTab('checkedIn')}
                        className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${filterTab === 'checkedIn'
                            ? 'bg-green-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        ✓ In ({stats.checkedIn})
                    </button>
                    <button
                        onClick={() => setFilterTab('expected')}
                        className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${filterTab === 'expected'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        ⏳ Wait ({stats.expected})
                    </button>
                </div>

                <div className="relative">
                    <Input
                        placeholder="Search by name, org, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-base shadow-sm"
                        wrapperClassName="!mb-0"
                        aria-label="Search attendees"
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            <motion.div
                className="space-y-3 px-1"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {loadingData ? (
                    <ListSkeleton count={5} type="card" />
                ) : filteredAttendees.length > 0 ? (
                    filteredAttendees.map((attendee, index) => (
                        <motion.div
                            key={attendee.id}
                            variants={staggerItem}
                        >
                            <SwipeableListItem
                                onEdit={onEditClick ? () => onEditClick(attendee) : undefined}
                                onDelete={onDeleteClick ? () => onDeleteClick(attendee) : undefined}
                            >
                                <MobileCard
                                    title={attendee.name}
                                    subtitle={attendee.organization}
                                    icon={<UserIcon className="w-5 h-5 text-slate-500" />}
                                    badge={attendee.checkInTime ? (
                                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                            Checked In
                                        </span>
                                    ) : undefined}
                                    onClick={() => onEditClick && onEditClick(attendee)}
                                    actions={
                                        <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                                            {attendee.email && <span>{attendee.email}</span>}
                                            {attendee.position && (
                                                <>
                                                    <span>•</span>
                                                    <span>{attendee.position}</span>
                                                </>
                                            )}
                                        </div>
                                    }
                                />
                            </SwipeableListItem>
                        </motion.div>
                    ))
                ) : (
                    <MobileEmptyState
                        icon={<UserIcon className="w-12 h-12 text-primary-600" />}
                        title={searchTerm ? "No matches found" : "No attendees yet"}
                        description={searchTerm ? "Try adjusting your search terms" : "Start by adding your first attendee"}
                        actionLabel={searchTerm ? undefined : "Add Attendee"}
                        onAction={searchTerm ? undefined : onAddClick}
                    />
                )}
        </motion.div>
        </div >
    );
};

export default MobileAttendeeList;
