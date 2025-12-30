import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { Session, Booth, Attendee, SessionRegistration } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { DateTimeInput } from '../../components/ui/DateTimeInput';
import DateTimePicker from '../../components/ui/DateTimePicker'; // NEW
import { CogIcon, PlusCircleIcon, PencilSquareIcon, UsersGroupIcon, ArrowLeftIcon } from '../../components/Icons';
import { Icon } from '../../components/ui/Icon'; // Ensure Icon is imported
import { Link } from 'react-router-dom';
import { AppRoute } from '../../types';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useEventTypeConfig } from '../../contexts/EventTypeConfigContext'; // NEW
import { toast } from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Checkbox from '../../components/ui/Checkbox';
import Textarea from '../../components/ui/Textarea';
import { useBoothCapacity } from '../../hooks/useBoothCapacity';
import AvailableAttendeesModal from '../../components/admin/AvailableAttendeesModal';
import BulkRegistrationModal from '../../components/admin/BulkRegistrationModal';
import { PresentationChartLineIcon, BuildingStorefrontIcon, MapIcon, UsersGroupIcon as IconUsersGroup } from '../../components/Icons';


const formatDateForInput = (dateValue: string | Date): string => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
};

const AssignmentsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    session: Session;
    booth: Booth;
    allAttendees: Attendee[];
    sessionRegistrations: SessionRegistration[];
    onSave: (boothId: string, attendeeIds: string[]) => Promise<any>;
}> = ({ isOpen, onClose, session, booth, allAttendees, sessionRegistrations, onSave }) => {

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const assignedIds = sessionRegistrations
                .filter(r => r.expectedBoothId === booth.id)
                .map(r => r.attendeeId);
            setSelectedIds(new Set(assignedIds));
        }
    }, [isOpen, sessionRegistrations, booth.id]);

    const attendeesAssignedToOtherBooths = useMemo(() => {
        const assignments = new Map<string, string>(); // attendeeId -> boothId
        sessionRegistrations.forEach(r => {
            if (r.expectedBoothId && r.expectedBoothId !== booth.id) {
                assignments.set(r.attendeeId, r.expectedBoothId);
            }
        });
        return assignments;
    }, [sessionRegistrations, booth.id]);

    const handleSelect = (attendeeId: string, isSelected: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (isSelected) newSet.add(attendeeId);
            else newSet.delete(attendeeId);
            return newSet;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(booth.id, Array.from(selectedIds));
        setIsSaving(false);
        onClose();
    };

    const filteredAttendees = useMemo(() => {
        if (!searchTerm) return allAttendees;
        const lowercasedFilter = searchTerm.toLowerCase();
        return allAttendees.filter(a =>
            a.name.toLowerCase().includes(lowercasedFilter) ||
            (a.organization || '').toLowerCase().includes(lowercasedFilter)
        );
    }, [allAttendees, searchTerm]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Assign Attendees for ${booth.companyName}`} size="xl">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Select attendees to assign them to <strong>{booth.companyName}</strong> for the session: <strong>{session.name}</strong>. Attendees assigned to other booths in this session are disabled.
                </p>
                <Input placeholder="Search attendees by name or organization..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <div className="max-h-96 overflow-y-auto space-y-2 p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                    {filteredAttendees.map(attendee => {
                        const otherBoothId = attendeesAssignedToOtherBooths.get(attendee.id);
                        const isDisabled = !!otherBoothId;
                        return (
                            <div key={attendee.id} className={`p-2 rounded-md transition-colors ${isDisabled ? 'bg-slate-200 dark:bg-slate-700 opacity-60' : 'bg-white dark:bg-slate-800'}`}>
                                <Checkbox
                                    id={`assign-${attendee.id}`}
                                    label={`${attendee.name} (${attendee.organization || 'N/A'})`}
                                    checked={selectedIds.has(attendee.id)}
                                    onChange={e => handleSelect(attendee.id, e.target.checked)}
                                    disabled={isDisabled}
                                    title={isDisabled ? 'Assigned to another booth in this session' : ''}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="neutral" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="button" variant="primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : `Save Assignments (${selectedIds.size})`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};


const ShiftDatesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    sessions: Session[];
    onConfirm: (newStartDate: string) => Promise<void>;
}> = ({ isOpen, onClose, sessions, onConfirm }) => {
    const [targetDate, setTargetDate] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && sessions.length > 0) {
            // Default to today
            setTargetDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, sessions]);

    const handleConfirm = async () => {
        if (!targetDate) return;
        setIsProcessing(true);
        await onConfirm(targetDate);
        setIsProcessing(false);
        onClose();
    };

    if (!isOpen) return null;

    const sortedSessions = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const earliestSession = sortedSessions[0];
    const currentStartDate = earliestSession ? new Date(earliestSession.startTime).toLocaleDateString() : 'N/A';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Shift All Session Dates" size="md">
            <div className="space-y-4">
                <Alert type="info" message="This will move ALL sessions to a new date range, keeping their relative times and days intact." />

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Schedule Starts On:</p>
                    <p className="text-lg text-slate-900 dark:text-slate-100">{currentStartDate}</p>
                </div>

                <div>
                    <DateTimePicker
                        label="New Start Date (for the first session)"
                        value={targetDate ? new Date(targetDate) : null}
                        onChange={(date) => setTargetDate(date ? date.toISOString().split('T')[0] : '')}
                        placeholderText="Select new start date"
                        minDate={new Date()}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="neutral" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirm} disabled={isProcessing}>
                        {isProcessing ? 'Shifting...' : 'Shift All Sessions'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// ... imports
import { useIsMobile } from '../../hooks/useIsMobile';
// The following import is already present above, no need to duplicate.
// import { ArrowLeftIcon } from '../../components/Icons'; // Ensure this is imported

const SessionSettingsPage: React.FC = () => {
    const isMobile = useIsMobile();
    const [mobileViewMode, setMobileViewMode] = useState<'list' | 'form'>('list');

    const { sessions, allConfiguredBooths, addSession, updateSession, attendees, getSessionRegistrationsForSession, getSessionRegistrationsForAttendee, updateSessionBoothAssignments, loadingData, addSessionRegistration, deleteSessionRegistration } = useEventData();
    const { selectedEventId, currentEvent } = useSelectedEvent();
    const { config, eventType } = useEventTypeConfig();

    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [sessionName, setSessionName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [sessionType, setSessionType] = useState<Session['sessionType']>('meeting');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [speaker, setSpeaker] = useState('');
    const [maxCapacity, setMaxCapacity] = useState('');

    const [isCreatingNew, setIsCreatingNew] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [registrations, setRegistrations] = useState<SessionRegistration[]>([]);
    const [managingBooth, setManagingBooth] = useState<Booth | null>(null);
    const [loadingRegs, setLoadingRegs] = useState(false);

    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isAvailableAttendeesModalOpen, setIsAvailableAttendeesModalOpen] = useState(false);
    const [isBulkRegModalOpen, setIsBulkRegModalOpen] = useState(false);

    const { getCapacity, loading: loadingCapacities } = useBoothCapacity(selectedSessionId);

    const selectedSession = useMemo(() => sessions.find(s => s.id === selectedSessionId), [sessions, selectedSessionId]);

    // Mobile specific effect
    useEffect(() => {
        if (isMobile && selectedSessionId && !isCreatingNew) {
            setMobileViewMode('form');
        }
    }, [isMobile, selectedSessionId, isCreatingNew]);

    useEffect(() => {
        if (selectedSessionId) {
            setLoadingRegs(true);
            getSessionRegistrationsForSession(selectedSessionId)
                .then(res => { if (res.success) setRegistrations(res.data) })
                .finally(() => setLoadingRegs(false));
        } else {
            setRegistrations([]);
        }
    }, [selectedSessionId, getSessionRegistrationsForSession, sessions]);

    /*
    const eventDays = useMemo(() => {
        if (!currentEvent?.startDate) return [];
        const days = [];
        const start = new Date(currentEvent.startDate);
        const end = currentEvent.endDate ? new Date(currentEvent.endDate) : new Date(new Date(start).setDate(start.getDate() + 2));

        let currentDate = new Date(start.setUTCHours(0, 0, 0, 0));
        const finalDate = new Date(end.setUTCHours(0, 0, 0, 0));

        let dayCount = 1;
        while (currentDate <= finalDate && dayCount <= 10) { // Safety cap
            days.push({ dayNumber: dayCount, date: new Date(currentDate) });
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            dayCount++;
        }
        return days;
    }, [currentEvent]);
    */

    /*
    const applyDateToSession = (dateToApply: Date) => {
        const apply = (timeString: string) => {
            const d = new Date(timeString);
            const hours = d.getHours();
            const minutes = d.getMinutes();
            const newDate = new Date(dateToApply);
            newDate.setHours(hours, minutes);
            return formatDateForInput(newDate);
        };
        setStartTime(apply(startTime));
        setEndTime(apply(endTime));
        toast.success(`Date applied: ${dateToApply.toLocaleDateString()}`);
    };
    */

    const resetFormToDefaults = () => {
        setSessionName('');
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        setStartTime(formatDateForInput(now));
        setEndTime(formatDateForInput(twoHoursLater));
        setSessionType('meeting');
        setLocation('');
        setDescription('');
        setSpeaker('');
        setMaxCapacity('');
    };

    const handleMobileBack = () => {
        setMobileViewMode('list');
        setSelectedSessionId('');
        resetFormToDefaults();
        setIsCreatingNew(true);
    };

    const handleMobileCreate = () => {
        setIsCreatingNew(true);
        resetFormToDefaults();
        setMobileViewMode('form');
    };

    const handleMobileEdit = (sessionId: string) => {
        const s = sessions.find(session => session.id === sessionId);
        if (s) {
            setSelectedSessionId(sessionId);
            setIsCreatingNew(false);
            setMobileViewMode('form');
        }
    };

    useEffect(() => {
        if (isCreatingNew) {
            resetFormToDefaults();
        } else {
            const session = sessions.find(s => s.id === selectedSessionId);
            if (session) {
                setSessionName(session.name);
                setStartTime(formatDateForInput(session.startTime));
                setEndTime(formatDateForInput(session.endTime));
                setSessionType(session.sessionType || 'meeting');
                setLocation(session.location || '');
                setDescription(session.description || '');
                setSpeaker(session.speaker || '');
                setMaxCapacity(session.maxCapacity ? session.maxCapacity.toString() : '');
            }
        }
    }, [selectedSessionId, isCreatingNew, sessions]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (!sessionName.trim() || !startTime || !endTime) {
            setFeedback({ type: 'error', message: 'Session Name, Start, and End Times are required.' });
            return;
        }

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (endDate <= startDate) {
            setFeedback({ type: 'error', message: 'End time must be after start time.' });
            return;
        }

        const details = {
            sessionType,
            location: location || null,
            description: description || null,
            speaker: speaker || null,
            maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : null
        };

        setIsSubmitting(true);
        try {
            if (isCreatingNew) {
                await addSession(
                    sessionName,
                    startDate.toISOString(),
                    endDate.toISOString(),
                    details
                );
                resetFormToDefaults();
                setFeedback({ type: 'success', message: 'Session created successfully.' });
                if (isMobile) setMobileViewMode('list');
            } else {
                const sessionToUpdate = sessions.find(s => s.id === selectedSessionId);
                if (!sessionToUpdate) {
                    setFeedback({ type: 'error', message: 'Session not found for update.' });
                    setIsSubmitting(false);
                    return;
                }
                const updatedSessionData = {
                    ...sessionToUpdate,
                    name: sessionName,
                    startTime: startDate.toISOString(),
                    endTime: endDate.toISOString(),
                    ...details
                };
                await updateSession(updatedSessionData);
                setFeedback({ type: 'success', message: 'Session updated successfully.' });
                if (isMobile) setMobileViewMode('list');
            }
        } catch (err) {
            console.error(err);
            setFeedback({ type: 'error', message: 'Failed to save session.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkRegistration = async (toAdd: string[], toRemove: string[]) => {
        if (!selectedSessionId) return;

        const currentSession = sessions.find(s => s.id === selectedSessionId);
        if (!currentSession) {
            toast.error('Session not found');
            return;
        }

        // Check for time conflicts
        const conflicts: { attendeeId: string; attendeeName: string; conflictingSessionName: string }[] = [];

        for (const attendeeId of toAdd) {
            const attendeeRegsResult = await getSessionRegistrationsForAttendee(attendeeId);
            if (!attendeeRegsResult.success) continue;

            for (const reg of attendeeRegsResult.data) {
                const otherSession = sessions.find(s => s.id === reg.sessionId);
                if (!otherSession || otherSession.id === selectedSessionId) continue;

                const currentStart = new Date(currentSession.startTime);
                const currentEnd = new Date(currentSession.endTime);
                const otherStart = new Date(otherSession.startTime);
                const otherEnd = new Date(otherSession.endTime);

                const hasOverlap = currentStart < otherEnd && currentEnd > otherStart;

                if (hasOverlap) {
                    const attendee = attendees.find(a => a.id === attendeeId);
                    conflicts.push({
                        attendeeId,
                        attendeeName: attendee?.name || 'Unknown',
                        conflictingSessionName: otherSession.name
                    });
                    break;
                }
            }
        }

        if (conflicts.length > 0) {
            const conflictList = conflicts
                .map(c => `• ${c.attendeeName} (ya registrado en "${c.conflictingSessionName}")`)
                .join('\n');

            const confirmed = window.confirm(
                `⚠️ CONFLICTOS DE HORARIO DETECTADOS\n\n` +
                `Los siguientes asistentes ya tienen otra sesión en este horario:\n\n${conflictList}\n\n` +
                `¿Deseas continuar de todos modos? Esto creará registros duplicados.`
            );

            if (!confirmed) {
                toast.error('Registro cancelado por conflictos de horario', { id: 'bulk-reg-conflict' });
                return;
            }
        }

        const toastId = toast.loading(`Processing registrations...`);
        let successCount = 0;
        let failCount = 0;

        for (const attendeeId of toAdd) {
            if (registrations.some(r => r.attendeeId === attendeeId)) continue;
            const res = await addSessionRegistration({
                sessionId: selectedSessionId,
                attendeeId: attendeeId,
                expectedBoothId: null,
                status: 'Registered'
            });
            if (res.success) successCount++;
            else failCount++;
        }

        for (const attendeeId of toRemove) {
            const reg = registrations.find(r => r.attendeeId === attendeeId);
            if (reg) {
                const res = await deleteSessionRegistration(reg.id);
                if (res.success) successCount++;
                else failCount++;
            }
        }

        toast.success(`Processed: ${successCount} success, ${failCount} failed`, { id: toastId });

        setLoadingRegs(true);
        getSessionRegistrationsForSession(selectedSessionId)
            .then(res => { if (res.success) setRegistrations(res.data) })
            .finally(() => setLoadingRegs(false));
    };

    const sessionOptions = [{ value: '', label: '✨ Create New Session' }].concat(
        sessions.map(s => ({ value: s.id, label: s.name }))
    );

    const handleSessionSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setSelectedSessionId(newId);
        setIsCreatingNew(newId === '');
        setFeedback(null);
    };

    const handleSaveAssignments = async (boothId: string, attendeeIds: string[]) => {
        const toastId = toast.loading('Saving assignments...');
        const result = await updateSessionBoothAssignments(selectedSessionId, boothId, attendeeIds);
        if (result.success) {
            toast.success(result.message, { id: toastId });
            if (selectedSessionId) {
                setLoadingRegs(true);
                getSessionRegistrationsForSession(selectedSessionId)
                    .then(res => { if (res.success) setRegistrations(res.data); })
                    .finally(() => setLoadingRegs(false));
            }
        } else {
            toast.error(result.message, { id: toastId });
        }
    }

    const handleShiftDates = async (newStartDateStr: string) => {
        if (sessions.length === 0) return;

        const sortedSessions = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const earliestSession = sortedSessions[0];
        const oldStart = new Date(earliestSession.startTime);
        const targetDate = new Date(newStartDateStr);

        const oldStartMidnight = new Date(oldStart);
        oldStartMidnight.setHours(0, 0, 0, 0);

        const newStartMidnight = new Date(targetDate);
        newStartMidnight.setHours(0, 0, 0, 0);
        newStartMidnight.setMinutes(newStartMidnight.getMinutes() + newStartMidnight.getTimezoneOffset());

        const diffTime = newStartMidnight.getTime() - oldStartMidnight.getTime();
        const toastId = toast.loading(`Shifting ${sessions.length} sessions...`);
        let successCount = 0;
        let failCount = 0;

        for (const session of sessions) {
            const sStart = new Date(session.startTime);
            const sEnd = new Date(session.endTime);
            const newStart = new Date(sStart.getTime() + diffTime);
            const newEnd = new Date(sEnd.getTime() + diffTime);
            const result = await updateSession({
                ...session,
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString()
            });
            if (result.success) successCount++;
            else failCount++;
        }
        toast.success(`Shifted ${successCount} sessions.`, { id: toastId });
    };

    if (!selectedEventId && !loadingData) {
        return <Alert type="warning" message="No event selected. Please select an event from the header dropdown to manage sessions." />
    }

    if (isMobile) {
        return (
            <div className="pb-20">
                <ShiftDatesModal
                    isOpen={isShiftModalOpen}
                    onClose={() => setIsShiftModalOpen(false)}
                    sessions={sessions}
                    onConfirm={handleShiftDates}
                />
                {managingBooth && selectedSession && (
                    <AssignmentsModal
                        isOpen={!!managingBooth}
                        onClose={() => setManagingBooth(null)}
                        session={selectedSession}
                        booth={managingBooth}
                        allAttendees={attendees}
                        sessionRegistrations={registrations}
                        onSave={handleSaveAssignments}
                    />
                )}
                {selectedSession && (
                    <AvailableAttendeesModal
                        isOpen={isAvailableAttendeesModalOpen}
                        onClose={() => {
                            setIsAvailableAttendeesModalOpen(false);
                            if (selectedSessionId) {
                                setLoadingRegs(true);
                                getSessionRegistrationsForSession(selectedSessionId)
                                    .then(res => { if (res.success) setRegistrations(res.data); })
                                    .finally(() => setLoadingRegs(false));
                            }
                        }}
                        session={selectedSession}
                        allBooths={allConfiguredBooths}
                    />
                )}
                {selectedSession && (
                    <BulkRegistrationModal
                        isOpen={isBulkRegModalOpen}
                        onClose={() => setIsBulkRegModalOpen(false)}
                        sessionName={selectedSession.name}
                        eventId={selectedEventId || ''}
                        allAttendees={attendees}
                        currentlyRegisteredIds={new Set(registrations.map(r => r.attendeeId))}
                        onSave={handleBulkRegistration}
                    />
                )}

                <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm flex items-center justify-between">
                    {mobileViewMode === 'form' ? (
                        <div className="flex items-center w-full">
                            <button onClick={handleMobileBack} className="p-2 mr-2 -ml-2 text-slate-600 dark:text-slate-300">
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <h1 className="text-lg font-bold truncate">{isCreatingNew ? 'New Session' : 'Edit Session'}</h1>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <h1 className="text-xl font-bold flex items-center"><CogIcon className="w-6 h-6 mr-2 text-primary-600" /> Sessions</h1>
                            {sessions.length > 0 && (
                                <button onClick={() => setIsShiftModalOpen(true)} className="text-primary-600 font-medium text-sm">
                                    Shift Dates
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4">
                    {feedback && <Alert type={feedback.type} message={feedback.message} className="mb-4" />}

                    {mobileViewMode === 'list' && (
                        <div className="space-y-4">
                            <Button
                                variant="primary"
                                className="w-full py-3 shadow-lg"
                                onClick={handleMobileCreate}
                                leftIcon={<PlusCircleIcon className="w-5 h-5" />}
                            >
                                Create New Session
                            </Button>

                            {loadingData ? (<p className="text-center py-4 text-slate-500">Loading sessions...</p>) : sessions.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <p className="text-slate-500">No sessions yet.</p>
                                    <p className="text-sm text-slate-400 mt-1">Tap above to create one.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map(s => (
                                        <div
                                            key={s.id}
                                            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                                            onClick={() => handleMobileEdit(s.id)}
                                        >
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-slate-200">{s.name}</h3>
                                                <div className="text-sm text-slate-500 mt-1 flex flex-col gap-0.5">
                                                    <span className="flex items-center gap-1.5"><Icon name="clock" className="w-3 h-3" /> {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {s.location && <span className="flex items-center gap-1.5"><MapIcon className="w-3 h-3" /> {s.location}</span>}
                                                </div>
                                            </div>
                                            <div className="text-slate-400">
                                                <Icon name="chevronRight" className="w-5 h-5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {mobileViewMode === 'form' && (
                        <form onSubmit={(e) => {
                            handleSubmit(e).then(() => {
                                window.scrollTo(0, 0);
                            });
                        }} className="space-y-6 pb-10">
                            <Input
                                label="Session Name"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                placeholder="e.g., Keynote"
                                disabled={isSubmitting || loadingData}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <DateTimeInput
                                    label="Start"
                                    value={startTime ? new Date(startTime) : null}
                                    onChange={(date) => {
                                        const newStartTime = date ? date.toISOString().slice(0, 16) : '';
                                        setStartTime(newStartTime);
                                        if (date) {
                                            const currentEndDate = endTime ? new Date(endTime) : null;
                                            const recommendedEndDate = new Date(date.getTime() + 30 * 60 * 1000);
                                            if (!currentEndDate || currentEndDate < date) {
                                                setEndTime(recommendedEndDate.toISOString().slice(0, 16));
                                            }
                                        }
                                    }}
                                    disabled={isSubmitting || loadingData}
                                />
                                <DateTimeInput
                                    label="End"
                                    value={endTime ? new Date(endTime) : null}
                                    onChange={(date) => setEndTime(date ? date.toISOString().slice(0, 16) : '')}
                                    minDate={startTime ? new Date(startTime) : undefined}
                                    disabled={isSubmitting || loadingData}
                                />
                            </div>

                            <Select
                                label="Type"
                                value={sessionType}
                                onChange={(e) => setSessionType(e.target.value as any)}
                                options={[
                                    { value: 'meeting', label: '🤝 Vendor Meeting' },
                                    { value: 'presentation', label: '🎤 Presentation' },
                                    { value: 'networking', label: '🥂 Networking' },
                                    { value: 'break', label: '☕ Break' },
                                ]}
                            />

                            {sessionType !== 'break' && (
                                <>
                                    <Input
                                        label="Location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        icon={<MapIcon className="w-4 h-4 text-slate-400" />}
                                    />
                                    <Input
                                        label="Speaker"
                                        value={speaker}
                                        onChange={(e) => setSpeaker(e.target.value)}
                                        icon={<UsersGroupIcon className="w-4 h-4 text-slate-400" />}
                                    />
                                    <Textarea
                                        label="Description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </>
                            )}

                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full py-4 text-lg shadow-xl"
                                    disabled={isSubmitting || loadingData}
                                >
                                    {isSubmitting ? 'Saving...' : (isCreatingNew ? 'Create Session' : 'Save Changes')}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <ShiftDatesModal
                isOpen={isShiftModalOpen}
                onClose={() => setIsShiftModalOpen(false)}
                sessions={sessions}
                onConfirm={handleShiftDates}
            />
            {/* ... rest of desktop render */}
            {managingBooth && selectedSession && (
                <AssignmentsModal
                    isOpen={!!managingBooth}
                    onClose={() => setManagingBooth(null)}
                    session={selectedSession}
                    booth={managingBooth}
                    allAttendees={attendees}
                    sessionRegistrations={registrations}
                    onSave={handleSaveAssignments}
                />
            )}
            {selectedSession && (
                <AvailableAttendeesModal
                    isOpen={isAvailableAttendeesModalOpen}
                    onClose={() => {
                        setIsAvailableAttendeesModalOpen(false);
                        // Refresh registrations after closing in case assignments were made
                        if (selectedSessionId) {
                            setLoadingRegs(true);
                            getSessionRegistrationsForSession(selectedSessionId)
                                .then(res => { if (res.success) setRegistrations(res.data); })
                                .finally(() => setLoadingRegs(false));
                        }
                    }}
                    session={selectedSession}
                    allBooths={allConfiguredBooths}
                />
            )}
            {selectedSession && (
                <BulkRegistrationModal
                    isOpen={isBulkRegModalOpen}
                    onClose={() => setIsBulkRegModalOpen(false)}
                    sessionName={selectedSession.name}
                    eventId={selectedEventId || ''}
                    allAttendees={attendees}
                    currentlyRegisteredIds={new Set(registrations.map(r => r.attendeeId))}
                    onSave={handleBulkRegistration}
                />
            )}
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold flex items-center"><CogIcon className="w-8 h-8 mr-3 text-primary-600" /> Session Settings</h1>
                    {sessions.length > 0 && (
                        <Button variant="neutral" onClick={() => setIsShiftModalOpen(true)}>
                            Shift All Dates
                        </Button>
                    )}
                </div>

                {feedback && <Alert type={feedback.type} message={feedback.message} className="my-4" />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1 space-y-6">
                        <Card title="Current Sessions">
                            {loadingData ? (<p className="text-slate-500">Loading sessions...</p>) : sessions.length === 0 ? (
                                <p className="text-slate-500 text-sm">No sessions created yet for this event.</p>
                            ) : (
                                <ul className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {sessions.map(s => (
                                        <li key={s.id} className={`p-3 rounded-lg transition-colors ${selectedSessionId === s.id && !isCreatingNew ? 'bg-primary-50 dark:bg-primary-900/40 border border-primary-300 dark:border-primary-500/50' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleString()}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={selectedSessionId === s.id && !isCreatingNew ? 'primary' : 'neutral'}
                                                    onClick={() => { setSelectedSessionId(s.id); setIsCreatingNew(false); }}
                                                    className="flex-shrink-0"
                                                    leftIcon={<PencilSquareIcon className="w-4 h-4" />}
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card title={isCreatingNew ? "Create New Session" : `Editing: ${sessions.find(s => s.id === selectedSessionId)?.name || ''}`}>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Select
                                    label="Action"
                                    id="session-select-settings"
                                    value={selectedSessionId}
                                    onChange={handleSessionSelectionChange}
                                    options={sessionOptions}
                                    disabled={isSubmitting || loadingData}
                                />
                                <Input
                                    label="Session Name"
                                    id="session-name"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    placeholder="e.g., Morning Vendor Meeting"
                                    disabled={isSubmitting || loadingData}
                                />

                                <div className="border-t border-slate-200 dark:border-slate-700 my-4 pt-4">
                                    <Select
                                        label="Session Type"
                                        id="session-type"
                                        value={sessionType}
                                        onChange={(e) => setSessionType(e.target.value as any)}
                                        options={[
                                            { value: 'meeting', label: '🤝 Vendor Meeting (Speed Dating)' },
                                            { value: 'presentation', label: '🎤 Presentation / Talk' },
                                            { value: 'networking', label: '🥂 Networking' },
                                            { value: 'break', label: '☕ Break' },
                                        ]}
                                        disabled={isSubmitting || loadingData}
                                    />

                                    {sessionType !== 'meeting' && sessionType !== 'break' && (
                                        <div className="space-y-4 mt-4 animate-fadeIn">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Location / Room"
                                                    placeholder="e.g. Auditorium A"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    icon={<MapIcon className="w-4 h-4 text-slate-400" />}
                                                />
                                                <Input
                                                    label="Speaker(s)"
                                                    placeholder="e.g. Dr. Jane One"
                                                    value={speaker}
                                                    onChange={(e) => setSpeaker(e.target.value)}
                                                    icon={<UsersGroupIcon className="w-4 h-4 text-slate-400" />}
                                                />
                                            </div>
                                            <Input
                                                label="Room Capacity (Max Attendees)"
                                                type="number"
                                                placeholder="Leave empty for unlimited"
                                                value={maxCapacity}
                                                onChange={(e) => setMaxCapacity(e.target.value)}
                                            />
                                            <Textarea
                                                label="Description"
                                                placeholder="What is this session about?"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    {sessionType === 'break' && (
                                        <div className="mt-4">
                                            <Textarea
                                                label="Break Details"
                                                placeholder="Description (e.g. Coffee and pastries served in the lobby)"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Date & Time Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <DateTimeInput
                                        label="Start Date & Time"
                                        value={startTime ? new Date(startTime) : null}
                                        onChange={(date) => {
                                            const newStartTime = date ? date.toISOString().slice(0, 16) : '';
                                            setStartTime(newStartTime);

                                            // Smart Logic: Auto-set End Time to Start + 30 mins
                                            if (date) {
                                                const currentEndDate = endTime ? new Date(endTime) : null;
                                                // Default duration: 30 minutes
                                                const recommendedEndDate = new Date(date.getTime() + 30 * 60 * 1000);

                                                // Update if no end time set OR if end time is before start time (invalid)
                                                if (!currentEndDate || currentEndDate < date) {
                                                    setEndTime(recommendedEndDate.toISOString().slice(0, 16));
                                                }
                                            }
                                        }}
                                        placeholderText="Select start date and time"
                                        disabled={isSubmitting || loadingData}
                                        required
                                    />
                                    <DateTimeInput
                                        label="End Date & Time"
                                        value={endTime ? new Date(endTime) : null}
                                        onChange={(date) => setEndTime(date ? date.toISOString().slice(0, 16) : '')}
                                        placeholderText="Select end date and time"
                                        minDate={startTime ? new Date(startTime) : undefined}
                                        disabled={isSubmitting || loadingData}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <Button
                                        type="submit"
                                        leftIcon={isCreatingNew ? <PlusCircleIcon className="w-5 h-5" /> : <PencilSquareIcon className="w-5 h-5" />}
                                        disabled={isSubmitting || loadingData}
                                    >
                                        {isSubmitting ? (isCreatingNew ? 'Creating...' : 'Saving...') : (isCreatingNew ? 'Create Session' : 'Save Session Details')}
                                    </Button>
                                </div>
                            </form>

                            {/* Booth Assignments Section - Only for event types that support it */}
                            {!isCreatingNew && config.enableBoothAssignments && (
                                <Card title="Booth Assignments for this Session" className="bg-slate-50 dark:bg-slate-900/50 shadow-inner mt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Manage which attendees are assigned to each booth for this session
                                        </p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setIsAvailableAttendeesModalOpen(true)}
                                            disabled={loadingData}
                                        >
                                            📋 View Available Attendees
                                        </Button>
                                    </div>
                                    {loadingData ? (<p className="text-slate-500">Loading booths...</p>) : allConfiguredBooths.length === 0 ? (
                                        <Alert type="warning" message={<>No booths are configured. Please <Link to={AppRoute.BoothSetup} className="font-bold underline">set up booths</Link> before assigning attendees.</>} />
                                    ) : (
                                        <div className="space-y-4 max-h-80 overflow-y-auto p-1">
                                            {(loadingRegs || loadingCapacities) ? <p className="text-slate-500 p-2">Loading assignments...</p> : allConfiguredBooths.map(booth => {
                                                // FIXED: Use getCapacity hook to exclude vendors (same as DataVisualizationPage)
                                                const assignedCount = getCapacity(booth.id);
                                                return (
                                                    <div key={booth.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <div className="flex-grow">
                                                            <p className="font-semibold text-slate-700 dark:text-slate-200">{booth.companyName}</p>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">{assignedCount} attendee(s) assigned</p>
                                                        </div>
                                                        <Button size="sm" variant="neutral" leftIcon={<UsersGroupIcon className="w-4 h-4" />} onClick={() => setManagingBooth(booth)}>
                                                            Manage
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* NEW: Simplified message for event types without booth assignments */}
                            {!isCreatingNew && !config.enableBoothAssignments && (
                                <Card title={eventType === 'conference' ? '🎤 Conference Session' : '🏢 Open Event'} className="bg-blue-50 dark:bg-blue-900/20 shadow-inner mt-6">
                                    <div className="p-4">
                                        {eventType === 'conference' ? (
                                            <>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                                                    This is a conference-style session. Booth assignments are not required.
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    💡 Attendees can register and scan their attendance. Walk-ins are automatically accepted.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                                                    Open event mode - all scans are welcome without pre-registration.
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    💡 Perfect for trade shows and open lead capture events.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {!isCreatingNew && sessionType !== 'meeting' && (
                                <Card title="Attendees" className="bg-slate-50 dark:bg-slate-900/50 shadow-inner mt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {registrations.length} attendees registered for this session
                                        </p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setIsBulkRegModalOpen(true)}
                                            disabled={loadingData || loadingRegs}
                                            leftIcon={<UsersGroupIcon className="w-4 h-4" />}
                                        >
                                            Manage Registrations
                                        </Button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {registrations.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic p-2">No attendees registered yet.</p>
                                        ) : (
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500">
                                                    <tr>
                                                        <th className="px-3 py-2">Name</th>
                                                        <th className="px-3 py-2">Organization</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                    {registrations.map(reg => {
                                                        const attendee = attendees.find(a => a.id === reg.attendeeId);
                                                        if (!attendee) return null;
                                                        return (
                                                            <tr key={reg.id}>
                                                                <td className="px-3 py-2">{attendee.name}</td>
                                                                <td className="px-3 py-2 text-slate-500">{attendee.organization}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </Card>
                    </div>
                </div>
            </div >
        </>
    );
};

export default SessionSettingsPage;