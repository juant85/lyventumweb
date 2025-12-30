import React, { useState } from 'react';
import { useEventData } from '../../../contexts/EventDataContext';
import { Attendee } from '../../../types';
import Input from '../../ui/Input';
import MobileCard from '../MobileCard';
import { UserIcon, UserPlusIcon, MagnifyingGlassIcon } from '../../Icons';
import MobileEmptyState from '../MobileEmptyState';
import SkeletonCard from '../SkeletonCard';
import { useLanguage } from '../../../contexts/LanguageContext';
import Button from '../../ui/Button';

interface MobileAttendeeListProps {
    onAddClick: () => void;
    onEditClick?: (attendee: Attendee) => void;
}

const MobileAttendeeList: React.FC<MobileAttendeeListProps> = ({ onAddClick, onEditClick }) => {
    const { attendees, loadingData } = useEventData();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAttendees = attendees.filter(attendee => {
        const searchLower = searchTerm.toLowerCase();
        return (
            attendee.name.toLowerCase().includes(searchLower) ||
            attendee.organization.toLowerCase().includes(searchLower) ||
            (attendee.email && attendee.email.toLowerCase().includes(searchLower))
        );
    });

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

            {/* List */}
            <div className="space-y-3 px-1">
                {loadingData ? (
                    <SkeletonCard count={5} />
                ) : filteredAttendees.length > 0 ? (
                    filteredAttendees.map(attendee => (
                        <MobileCard
                            key={attendee.id}
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
                    ))
                ) : (
                    <MobileEmptyState
                        icon={<UserIcon className="w-12 h-12 text-slate-300" />}
                        title={searchTerm ? "No matches found" : "No attendees yet"}
                        description={searchTerm ? "Try adjusting your search terms" : "Start by adding your first attendee"}
                        action={searchTerm ? undefined : {
                            label: "Add Attendee",
                            onClick: onAddClick
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default MobileAttendeeList;
