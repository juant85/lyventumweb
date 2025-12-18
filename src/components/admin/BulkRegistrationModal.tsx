import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Attendee } from '../../types';
import { MagnifyingGlassIcon, FunnelIcon } from '../Icons';
import { useTracks } from '../../features/tracks/hooks/useTracks';
import { useAllAttendeeTracks } from '../../features/tracks/hooks/useAttendeeTracks';

interface BulkRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionName: string;
    eventId: string;
    allAttendees: Attendee[];
    currentlyRegisteredIds: Set<string>;
    onSave: (attendeeIdsToAdd: string[], attendeeIdsToRemove: string[]) => Promise<void>;
}

export const BulkRegistrationModal: React.FC<BulkRegistrationModalProps> = ({
    isOpen,
    onClose,
    sessionName,
    eventId,
    allAttendees,
    currentlyRegisteredIds,
    onSave
}) => {
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrg, setSelectedOrg] = useState<string>('all');
    const [selectedTrackId, setSelectedTrackId] = useState<string>('all');

    // Selection State (for this modal session)
    // We initialize this with the currently registered IDs so the user sees them selected
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentlyRegisteredIds));
    const [isSaving, setIsSaving] = useState(false);

    // Initial load: sync state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(currentlyRegisteredIds));
            setSearchTerm('');
            setSelectedOrg('all');
            setSelectedTrackId('all');
        }
    }, [isOpen, currentlyRegisteredIds]);

    // Data for filters
    const { data: tracks } = useTracks(eventId);
    const { data: attendeeTracks } = useAllAttendeeTracks(eventId);

    const organizations = useMemo(() => {
        const orgs = new Set<string>();
        allAttendees.forEach(a => {
            if (a.organization) orgs.add(a.organization);
        });
        return Array.from(orgs).sort();
    }, [allAttendees]);

    // Filter Logic
    const filteredAttendees = useMemo(() => {
        return allAttendees.filter(attendee => {
            // 1. Text Search (Name or Email)
            const query = searchTerm.toLowerCase();
            const matchesSearch = !query ||
                attendee.name.toLowerCase().includes(query) ||
                attendee.email.toLowerCase().includes(query) ||
                (attendee.organization && attendee.organization.toLowerCase().includes(query));

            if (!matchesSearch) return false;

            // 2. Organization Filter
            if (selectedOrg !== 'all' && attendee.organization !== selectedOrg) {
                return false;
            }

            // 3. Track Filter
            if (selectedTrackId !== 'all') {
                // Find track assignment for this attendee
                // attendeeTracks is array of { attendee_id, track_id }
                const assignment = attendeeTracks?.find(at => at.attendee_id === attendee.id);
                if (!assignment || assignment.track_id !== selectedTrackId) {
                    return false;
                }
            }

            return true;
        });
    }, [allAttendees, searchTerm, selectedOrg, selectedTrackId, attendeeTracks]);

    // Handlers
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSelectAllFiltered = () => {
        const newSet = new Set(selectedIds);
        let allFilteredAreSelected = true;

        // Check if all visible are currently selected
        for (const attendee of filteredAttendees) {
            if (!newSet.has(attendee.id)) {
                allFilteredAreSelected = false;
                break;
            }
        }

        if (allFilteredAreSelected) {
            // Unselect all visible
            filteredAttendees.forEach(a => newSet.delete(a.id));
        } else {
            // Select all visible
            filteredAttendees.forEach(a => newSet.add(a.id));
        }
        setSelectedIds(newSet);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Calculate format changes
            const toAdd: string[] = [];
            const toRemove: string[] = [];

            // If it's in selectedIds but NOT in currentlyRegisteredIds -> ADD
            selectedIds.forEach(id => {
                if (!currentlyRegisteredIds.has(id)) {
                    toAdd.push(id);
                }
            });

            // If it was in currentlyRegisteredIds but NOT in selectedIds -> REMOVE
            currentlyRegisteredIds.forEach(id => {
                if (!selectedIds.has(id)) {
                    toRemove.push(id);
                }
            });

            await onSave(toAdd, toRemove);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Stats
    const selectedCount = selectedIds.size;
    const addedCount = Array.from(selectedIds).filter(id => !currentlyRegisteredIds.has(id)).length;
    const removedCount = Array.from(currentlyRegisteredIds).filter(id => !selectedIds.has(id)).length;

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Registrations: ${sessionName}`} size="xl">
            <div className="flex flex-col h-[70vh]">
                {/* Filters Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-4 space-y-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by name, email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                icon={<MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />}
                            />
                        </div>
                        <div className="w-1/4">
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm"
                                value={selectedOrg}
                                onChange={e => setSelectedOrg(e.target.value)}
                            >
                                <option value="all">All Organizations</option>
                                {organizations.map(org => (
                                    <option key={org} value={org}>{org}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-1/4">
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm"
                                value={selectedTrackId}
                                onChange={e => setSelectedTrackId(e.target.value)}
                            >
                                <option value="all">All Tracks</option>
                                {tracks?.map(track => (
                                    <option key={track.id} value={track.id}>{track.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* List Header & Bulk Action */}
                <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-sm text-slate-500">
                        Showing {filteredAttendees.length} attendees
                    </span>
                    <Button variant="neutral" size="sm" onClick={handleSelectAllFiltered}>
                        Toggle All Visible
                    </Button>
                </div>

                {/* Attendees List */}
                <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800">
                    {filteredAttendees.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No attendees found matching filters.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredAttendees.map(attendee => {
                                const isSelected = selectedIds.has(attendee.id);
                                return (
                                    <div
                                        key={attendee.id}
                                        onClick={() => toggleSelection(attendee.id)}
                                        className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                {attendee.name}
                                            </div>
                                            <div className="text-xs text-slate-500 flex gap-2">
                                                <span>{attendee.organization || 'No Org'}</span>
                                                {attendee.email && <span className="text-slate-400">• {attendee.email}</span>}
                                            </div>
                                        </div>
                                        {/* Optional: Show Track badge if we have the data handy, though we only have IDs here easily */}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer / Summary */}
                <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-sm">
                        <span className="font-bold text-slate-900 dark:text-white">{selectedCount}</span> Selected
                        <span className="text-slate-400 mx-2">|</span>
                        <span className="text-green-600">+{addedCount} Adding</span>
                        <span className="text-slate-400 mx-2">|</span>
                        <span className="text-red-500">-{removedCount} Removing</span>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="neutral" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BulkRegistrationModal;
