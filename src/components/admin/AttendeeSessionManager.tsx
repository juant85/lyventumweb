// src/components/admin/AttendeeSessionManager.tsx
import React, { useState, useMemo } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { useAttendeeSessionActions } from '../../hooks/useAttendeeSessionActions';
import Button from '../ui/Button';
import { TrashIcon, PlusCircleIcon } from '../Icons';
import { Attendee, SessionRegistration } from '../../types';
import { toast } from 'react-hot-toast';

interface AttendeeSessionManagerProps {
    attendee: Attendee;
    eventId: string;
    currentMeetings: SessionRegistration[];
    onMeetingsChanged: () => void;
}

export default function AttendeeSessionManager({
    attendee,
    eventId,
    currentMeetings,
    onMeetingsChanged,
}: AttendeeSessionManagerProps) {
    const { sessions, allConfiguredBooths, getBoothName } = useEventData();
    const { addMeeting, removeMeeting, isAdding, isRemoving } = useAttendeeSessionActions();

    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [selectedBoothId, setSelectedBoothId] = useState<string>('');

    // Filter sessions to show only future ones
    const availableSessions = useMemo(() => {
        const now = new Date();
        return sessions.filter(session => {
            const sessionStart = new Date(session.startTime);
            return sessionStart > now;
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [sessions]);

    // Get booths for selected session
    const availableBooths = useMemo(() => {
        if (!selectedSessionId) return [];

        const selected = sessions.find(s => s.id === selectedSessionId);
        if (!selected || !selected.boothSettings) return [];

        return selected.boothSettings.map(bs => {
            const booth = allConfiguredBooths.find(b => b.id === bs.boothId);
            return {
                id: bs.boothId,
                name: booth?.companyName || 'Unknown Booth',
                capacity: bs.capacity,
            };
        });
    }, [selectedSessionId, sessions, allConfiguredBooths]);

    const handleAddMeeting = async () => {
        if (!selectedSessionId) {
            toast.error('Please select a session');
            return;
        }

        const session = sessions.find(s => s.id === selectedSessionId);

        // Validation only for meetings
        if (session?.sessionType === 'meeting' && !selectedBoothId) {
            toast.error('Please select a booth for this meeting');
            return;
        }

        const result = await addMeeting({
            attendeeId: attendee.id,
            sessionId: selectedSessionId,
            eventId,
            boothId: selectedBoothId, // Can be empty for presentations
            sessionName: session?.name,
        });

        if (result.success) {
            setSelectedSessionId('');
            setSelectedBoothId('');
            onMeetingsChanged();
        }
    };

    const handleRemoveMeeting = async (registration: SessionRegistration) => {
        const sessionName = sessions.find(s => s.id === registration.sessionId)?.name;
        const result = await removeMeeting({
            registrationId: registration.id,
            sessionName,
        });

        if (result.success) {
            onMeetingsChanged();
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Current Meetings ({currentMeetings.length})
                </h3>
                {currentMeetings.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">No meetings scheduled</p>
                ) : (
                    <div className="space-y-2">
                        {currentMeetings.map(meeting => {
                            const session = sessions.find(s => s.id === meeting.sessionId);
                            const boothName = meeting.expectedBoothId ? getBoothName(meeting.expectedBoothId) : 'N/A';

                            return (
                                <div key={meeting.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900 dark:text-white">{session?.name || 'Unknown Session'}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">📅 {session ? formatDateTime(session.startTime) : 'N/A'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500">📍 {boothName}</p>
                                    </div>
                                    <Button variant="accent" size="sm" onClick={() => handleRemoveMeeting(meeting)} disabled={isRemoving} leftIcon={<TrashIcon className="w-4 h-4" />}>Remove</Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Add New Meeting</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Session (Future only)</label>
                        <select value={selectedSessionId} onChange={(e) => { setSelectedSessionId(e.target.value); setSelectedBoothId(''); }} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500" disabled={isAdding}>
                            <option value="">-- Select Session --</option>
                            {availableSessions.map(session => (
                                <option key={session.id} value={session.id}>
                                    {session.sessionType === 'meeting' ? '🤝 ' : session.sessionType === 'presentation' ? '🎤 ' : '📅 '}
                                    {session.name} - {formatDateTime(session.startTime)}
                                </option>
                            ))}
                        </select>
                        {availableSessions.length === 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No future sessions available</p>
                        )}
                    </div>

                    {selectedSessionId && sessions.find(s => s.id === selectedSessionId)?.sessionType === 'meeting' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Booth</label>
                            <select value={selectedBoothId} onChange={(e) => setSelectedBoothId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500" disabled={isAdding}>
                                <option value="">-- Select Booth --</option>
                                {availableBooths.map(booth => (
                                    <option key={booth.id} value={booth.id}>{booth.name} (Capacity: {booth.capacity})</option>
                                ))}
                            </select>
                            {availableBooths.length === 0 && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No booths configured for this session</p>
                            )}
                        </div>
                    )}

                    {selectedSessionId && sessions.find(s => s.id === selectedSessionId)?.sessionType !== 'meeting' && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-800">
                            This session does not require a booth assignment.
                        </div>
                    )}

                    <Button variant="primary" onClick={handleAddMeeting} disabled={!selectedSessionId || (sessions.find(s => s.id === selectedSessionId)?.sessionType === 'meeting' && !selectedBoothId) || isAdding} leftIcon={<PlusCircleIcon className="w-5 h-5" />} className="w-full">
                        {isAdding ? 'Adding...' : 'Add Registration'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
