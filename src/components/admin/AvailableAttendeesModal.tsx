// src/components/admin/AvailableAttendeesModal.tsx
import React, { useState, useMemo } from 'react';
import { Session, Booth, Attendee } from '../../types';
import { useAvailableAttendees } from '../../hooks/useAvailableAttendees';
import { useEventData } from '../../contexts/EventDataContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';
import { UsersGroupIcon, CheckCircleIcon } from '../Icons';
import Checkbox from '../ui/Checkbox';
import Select from '../ui/Select';

interface AvailableAttendeesModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session;
    allBooths: Booth[];
}

export default function AvailableAttendeesModal({
    isOpen,
    onClose,
    session,
    allBooths
}: AvailableAttendeesModalProps) {
    const { bulkAssignAttendeesToBooth } = useEventData();
    const { availableAttendees, loading, totalAvailable, totalAssigned } = useAvailableAttendees(session.id);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [targetBoothId, setTargetBoothId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [filterBoothId, setFilterBoothId] = useState(''); // For filtering display

    // Filter attendees by search term
    const filteredAttendees = useMemo(() => {
        if (!searchTerm) return availableAttendees;

        const term = searchTerm.toLowerCase();
        return availableAttendees.filter(attendee =>
            attendee.name.toLowerCase().includes(term) ||
            (attendee.organization || '').toLowerCase().includes(term) ||
            (attendee.email || '').toLowerCase().includes(term)
        );
    }, [availableAttendees, searchTerm]);

    const handleSelectAll = () => {
        if (selectedIds.size === filteredAttendees.length) {
            // Deselect all
            setSelectedIds(new Set());
        } else {
            // Select all filtered
            setSelectedIds(new Set(filteredAttendees.map(a => a.id)));
        }
    };

    const handleToggleSelect = (attendeeId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(attendeeId)) {
                newSet.delete(attendeeId);
            } else {
                newSet.add(attendeeId);
            }
            return newSet;
        });
    };

    const handleBulkAssign = async () => {
        if (!targetBoothId) {
            toast.error('Please select a booth');
            return;
        }

        if (selectedIds.size === 0) {
            toast.error('Please select at least one attendee');
            return;
        }

        setIsSaving(true);

        // Create assignments array
        const assignments = Array.from(selectedIds).map(attendeeId => ({
            attendeeId,
            boothId: targetBoothId
        }));

        const result = await bulkAssignAttendeesToBooth(session.id, assignments);

        if (result.success) {
            toast.success(result.message);
            setSelectedIds(new Set());
            setTargetBoothId('');
            setSearchTerm('');
            onClose();
        } else {
            toast.error(result.message);
        }

        setIsSaving(false);
    };

    const boothOptions = [
        { value: '', label: '-- Select Booth --' },
        ...allBooths.map(booth => ({
            value: booth.id,
            label: `${booth.companyName} (${booth.physicalId})`
        }))
    ];

    const filterBoothOptions = [
        { value: '', label: 'All Booths' },
        ...allBooths.map(booth => ({
            value: booth.id,
            label: booth.companyName
        }))
    ];

    const allSelected = filteredAttendees.length > 0 && selectedIds.size === filteredAttendees.length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Available Attendees - ${session.name}`}
            size="xl"
        >
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Available</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalAvailable}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Already Assigned</p>
                        <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{totalAssigned}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Selected</p>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{selectedIds.size}</p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Select attendees who don't have a meeting scheduled for this session and assign them to a booth.
                </p>

                {/* Search */}
                <Input
                    type="text"
                    placeholder="Search by name, organization, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />

                {/* Select All Toggle */}
                {filteredAttendees.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Checkbox
                            id="select-all"
                            label={allSelected ? 'Deselect All' : 'Select All'}
                            checked={allSelected}
                            onChange={handleSelectAll}
                        />
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {filteredAttendees.length} attendee(s) shown
                        </span>
                    </div>
                )}

                {/* List Header - Sticky */}
                <div className="sticky top-0 z-20 flex items-center gap-3 px-3 py-2.5 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-t-lg border-b-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider shadow-sm">
                    <div className="w-6 text-center text-slate-400">#</div>
                    <div className="w-5">
                        {/* Checkbox column spacer */}
                    </div>
                    <div className="flex-1 grid grid-cols-12 gap-4">
                        <div className="col-span-5 flex items-center gap-1">
                            <span>Name</span>
                        </div>
                        <div className="col-span-4">Organization</div>
                        <div className="col-span-3">Email</div>
                    </div>
                </div>

                {/* Attendee List - with sticky header container */}
                <div className="max-h-[420px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-b-lg -mt-px relative scroll-smooth">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 dark:text-slate-400">Loading available attendees...</p>
                        </div>
                    ) : filteredAttendees.length === 0 ? (
                        <div className="text-center py-8">
                            <UsersGroupIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                {searchTerm ? 'No attendees match your search' : 'All attendees are already assigned to this session'}
                            </p>
                            {!searchTerm && (
                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                    Great! Everyone has a meeting scheduled.
                                </p>
                            )}
                        </div>
                    ) : (
                        filteredAttendees.map((attendee, idx) => {
                            const isSelected = selectedIds.has(attendee.id);
                            const rowNumber = idx + 1;
                            return (
                                <div
                                    key={attendee.id}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 cursor-pointer
                                        border-l-4 border-b border-slate-100 dark:border-slate-800/50
                                        transition-all duration-150 ease-out
                                        ${idx % 2 === 0
                                            ? 'bg-white dark:bg-slate-900'
                                            : 'bg-slate-50/50 dark:bg-slate-850/30'
                                        }
                                        ${isSelected
                                            ? 'border-l-primary-500 bg-primary-50/60 dark:bg-primary-900/25 shadow-sm'
                                            : 'border-l-transparent hover:bg-blue-50/50 dark:hover:bg-slate-800/60 hover:border-l-blue-300 dark:hover:border-l-blue-600'
                                        }
                                    `}
                                    onClick={() => handleToggleSelect(attendee.id)}
                                >
                                    {/* Row Number */}
                                    <div className="w-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                                        {rowNumber}
                                    </div>

                                    {/* Checkbox */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            id={`attendee-${attendee.id}`}
                                            label=""
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(attendee.id)}
                                        />
                                    </div>

                                    {/* Data Columns */}
                                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-5 font-medium text-slate-900 dark:text-white truncate flex items-center gap-2">
                                            <span className="truncate">{attendee.name}</span>
                                            {isSelected && (
                                                <CheckCircleIcon className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0 animate-pulse" />
                                            )}
                                        </div>
                                        <div className="col-span-4 text-sm text-slate-600 dark:text-slate-400 truncate">
                                            {attendee.organization || <span className="text-slate-400 italic">—</span>}
                                        </div>
                                        <div className="col-span-3 text-xs text-slate-500 dark:text-slate-500 truncate font-mono">
                                            {attendee.email || ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Assignment Section - Modern Floating Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="sticky bottom-0 z-20 p-4 bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600 rounded-xl shadow-2xl shadow-primary-500/25 border border-primary-400/30 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Selection Count Badge */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <span className="text-2xl font-bold text-white">{selectedIds.size}</span>
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Attendees Selected</p>
                                    <p className="text-white/70 text-xs">Ready to assign to a booth</p>
                                </div>
                            </div>

                            {/* Booth Selector */}
                            <div className="flex-1 min-w-0">
                                <Select
                                    id="target-booth"
                                    value={targetBoothId}
                                    onChange={(e) => setTargetBoothId(e.target.value)}
                                    options={boothOptions}
                                    disabled={isSaving}
                                />
                            </div>

                            {/* Quick Assign Button */}
                            <Button
                                variant="secondary"
                                onClick={handleBulkAssign}
                                disabled={!targetBoothId || isSaving}
                                leftIcon={<UsersGroupIcon className="w-5 h-5" />}
                                className="bg-white hover:bg-white/90 text-primary-700 font-semibold shadow-lg whitespace-nowrap"
                            >
                                {isSaving ? 'Assigning...' : 'Assign Now'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Action Buttons - Simplified when floating bar is showing */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedIds.size > 0
                            ? <span className="text-primary-600 dark:text-primary-400 font-medium">↑ Use the action bar above to assign</span>
                            : 'Select attendees to assign them to a booth'
                        }
                    </div>
                    <Button
                        variant="neutral"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        {selectedIds.size > 0 ? 'Cancel' : 'Close'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
