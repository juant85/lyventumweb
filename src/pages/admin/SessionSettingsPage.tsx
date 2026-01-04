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
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
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
import { MobileCard, SpeedDialFAB, MobileEmptyState } from '../../components/mobile';
import SwipeableCard from '../../components/ui/SwipeableCard';
import SessionConfigEditor from '../../components/admin/SessionConfigEditor';
import { useSessionConfig } from '../../hooks/useSessionConfig';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';


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
// MobileCard import removed (using top-level import)
// import { ArrowLeftIcon } from '../../components/Icons'; // Ensure this is imported

const SessionSettingsPage: React.FC = () => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Capture /sessions/:id
    const routeLocation = useLocation(); // Measure path to check for /new or /sessions
    const [mobileViewMode, setMobileViewMode] = useState<'list' | 'detail' | 'form'>('list');

    const { sessions, allConfiguredBooths, addSession, updateSession, deleteSession, attendees, getSessionRegistrationsForSession, getSessionRegistrationsForAttendee, updateSessionBoothAssignments, loadingData, addSessionRegistration, deleteSessionRegistration } = useEventData();
    const { selectedEventId, currentEvent } = useSelectedEvent();
    const { config, eventType } = useEventTypeConfig();

    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [sessionName, setSessionName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [sessionType, setSessionType] = useState<Session['sessionType']>('meeting');
    const [location, setLocation] = useState(''); // Session location
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

    // --- Session Config System ---
    const sessionToEdit = useMemo(() => sessions.find(s => s.id === selectedSessionId), [sessions, selectedSessionId]);
    const { config: sessionConfig, updateConfig: updateSessionConfig, resetConfig: resetSessionConfig, isValid: isSessionConfigValid } = useSessionConfig(isCreatingNew ? null : sessionToEdit);
    const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

    // Feature Gating - Check if event's plan allows session config
    const { hasPackage, isLoading: isLoadingFeatures } = useFeatureAccess();
    // TODO: Feature gating query returns empty packages, needs DB investigation
    // const canConfigureSessions = hasPackage('session_conference_tools');
    const canConfigureSessions = true; // Temporarily enabled for all users

    const handleDeleteSession = async (id: string) => {
        if (window.confirm('Delete this session? This cannot be undone.')) {
            try {
                await deleteSession(id);
                toast.success('Session deleted');
                if (isMobile) {
                    setMobileViewMode('list');
                }
            } catch (error: any) {
                console.error('Delete failed', error);
                toast.error('Failed to delete session');
            }
        }
    };

    // Deep Linking Effect
    useEffect(() => {
        if (!isMobile) return;

        if (routeLocation.pathname === '/sessions/new') {
            setIsCreatingNew(true);
            setSelectedSessionId('');
            setMobileViewMode('form');
            // Reset form logic will be handled by resetting state directly here or in a function
            setSessionName('');
            setStartTime('');
            setEndTime('');
            setSessionType('meeting');
            setLocation('');
            setDescription('');
            setSpeaker('');
            setMaxCapacity('');
        } else if (id && routeLocation.pathname.includes('/sessions/')) {
            const s = sessions.find(sess => sess.id === id);
            if (s) {
                setSelectedSessionId(id);
                setIsCreatingNew(false);
                setMobileViewMode('detail');
            } else if (!loadingData && sessions.length > 0) {
                toast.error('Session not found', { id: 'session-404' });
                // navigate(AppRoute.SessionSettings); // navigate is not defined in this scope yet? It is from hook
            }
        } else {
        }
    }, [routeLocation.pathname, id, isMobile, sessions, loadingData]);

    // Derive selectedSession from selectedSessionId
    const selectedSession = sessions.find(s => s.id === selectedSessionId) || null;

    useEffect(() => {
        if (selectedSessionId) {
            setLoadingRegs(true);
            getSessionRegistrationsForSession(selectedSessionId)
                .then(res => { if (res.success) setRegistrations(res.data) })
                .finally(() => setLoadingRegs(false));
        } else {
            setRegistrations([]);
        }
    }, [selectedSessionId, getSessionRegistrationsForSession]);

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

    const handleShiftDates = async (newStartDate: string) => {
        if (!sessions.length || !newStartDate) return;
        const sorted = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        if (sorted.length === 0) return;

        const firstSession = sorted[0];
        const oldStart = new Date(firstSession.startTime);
        const newStart = new Date(newStartDate);

        // Calculate difference in milliseconds, ignoring time of day shift if strictly just shifting days
        // But simply taking diff is safer to preserve relative time
        const diff = newStart.getTime() - oldStart.getTime();

        try {
            await Promise.all(sessions.map(s => {
                const newS = new Date(new Date(s.startTime).getTime() + diff).toISOString();
                const newE = new Date(new Date(s.endTime).getTime() + diff).toISOString();
                return updateSession({ ...s, startTime: newS, endTime: newE });
            }));
            toast.success('All sessions shifted successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to shift dates');
        }
    };

    const handleSaveAssignments = async (boothId: string, attendeeIds: string[]) => {
        try {
            if (!selectedSessionId) return;
            await updateSessionBoothAssignments(selectedSessionId, boothId, attendeeIds);
            toast.success('Assignments updated');
            // Refresh registrations
            const res = await getSessionRegistrationsForSession(selectedSessionId);
            if (res.success) setRegistrations(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to update assignments');
        }
    };

    const handleBulkRegistration = async (toAdd: string[], toRemove: string[]) => {
        if (!selectedSessionId) return;
        try {
            const promises = [];
            for (const aid of toAdd) {
                promises.push(addSessionRegistration({ sessionId: selectedSessionId, attendeeId: aid, status: 'Registered' }));
            }
            for (const aid of toRemove) {
                const reg = registrations.find(r => r.attendeeId === aid);
                if (reg) {
                    promises.push(deleteSessionRegistration(reg.id));
                }
            }
            await Promise.all(promises);

            toast.success(`Updated: +${toAdd.length}, -${toRemove.length}`);
            const res = await getSessionRegistrationsForSession(selectedSessionId);
            if (res.success) setRegistrations(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Some operations failed');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        if (!selectedEventId) {
            setFeedback({ type: 'error', message: 'No event selected' });
            setIsSubmitting(false);
            return;
        }

        try {
            const startStr = new Date(startTime).toISOString();
            const endStr = new Date(endTime).toISOString();
            const details = {
                sessionType,
                location,
                description,
                speaker,
                maxCapacity: maxCapacity ? parseInt(String(maxCapacity)) : null,
                config: sessionConfig as any // Add config
            };

            if (isCreatingNew) {
                await addSession(sessionName, startStr, endStr, details);
                toast.success('Session created');
                if (isMobile) {
                    setMobileViewMode('list');
                    resetFormToDefaults();
                } else {
                    resetFormToDefaults();
                }
            } else {
                const sessionToUpdate = sessions.find(s => s.id === selectedSessionId);
                if (sessionToUpdate) {
                    await updateSession({
                        ...sessionToUpdate,
                        name: sessionName,
                        startTime: startStr,
                        endTime: endStr,
                        ...details
                    });
                    toast.success('Session updated');
                    if (isMobile) {
                        setMobileViewMode('detail');
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
            setFeedback({ type: 'error', message: 'Failed to save session' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSessionSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'new') {
            setIsCreatingNew(true);
            setSelectedSessionId('');
            resetFormToDefaults();
        } else {
            setIsCreatingNew(false);
            setSelectedSessionId(val);
        }
    };

    const sessionOptions = useMemo(() => {
        const opts = sessions
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map(s => ({ value: s.id, label: `${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${s.name}` }));

        return [{ value: 'new', label: '+ Create New Session' }, ...opts];
    }, [sessions]);


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
        resetSessionConfig(); // Reset config
    };

    const handleMobileBack = () => {
        if (mobileViewMode === 'form' && !isCreatingNew) {
            setMobileViewMode('detail'); // Go back to detail if editing
        } else {
            setMobileViewMode('list');
            setSelectedSessionId('');
            resetFormToDefaults();
            setIsCreatingNew(true);
        }
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

    const handleMobileDetail = (sessionId: string) => {
        const s = sessions.find(session => session.id === sessionId);
        if (s) {
            setSelectedSessionId(sessionId);
            setMobileViewMode('detail');
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

    // ... handleSubmit ...

    if (isMobile) {
        return (
            <div className="pb-20">
                <ShiftDatesModal
                    isOpen={isShiftModalOpen}
                    onClose={() => setIsShiftModalOpen(false)}
                    sessions={sessions}
                    onConfirm={handleShiftDates}
                />
                {/* ... Modals (Assignments, etc) ... */}
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

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm flex items-center justify-between safe-area-top">
                    {mobileViewMode !== 'list' ? (
                        <div className="flex items-center w-full">
                            <button onClick={handleMobileBack} className="p-2 mr-2 -ml-2 text-slate-600 dark:text-slate-300">
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <h1 className="text-lg font-bold truncate">
                                {mobileViewMode === 'form'
                                    ? (isCreatingNew ? 'New Session' : 'Edit Session')
                                    : 'Session Details'
                                }
                            </h1>
                            {mobileViewMode === 'detail' && (
                                <button
                                    onClick={() => handleMobileEdit(selectedSessionId)}
                                    className="ml-auto p-2 text-primary-600 dark:text-primary-400 font-semibold text-sm"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <h1 className="text-xl font-bold flex items-center"><CogIcon className="w-6 h-6 mr-2 text-primary-600" /> Program</h1>
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
                                className="w-full max-w-sm mx-auto py-3 shadow-lg"
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
                                        <div key={s.id} onClick={() => handleMobileDetail(s.id)}> {/* Changed to Detail */}
                                            <SwipeableCard
                                                leftAction={{
                                                    icon: <Icon name="edit" className="w-5 h-5" />,
                                                    color: 'blue',
                                                    label: 'Edit',
                                                    onTrigger: () => handleMobileEdit(s.id)
                                                }}
                                                rightAction={{
                                                    icon: <Icon name="trash" className="w-5 h-5" />,
                                                    color: 'red',
                                                    label: 'Delete',
                                                    onTrigger: () => handleDeleteSession(s.id)
                                                }}
                                            >
                                                <MobileCard
                                                    title={s.name}
                                                    subtitle={`${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${s.location || 'No Location'}`}
                                                    icon={<Icon name="clock" className="w-5 h-5 text-primary-600" />}
                                                    badge={
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.sessionType === 'break' ? 'bg-amber-100 text-amber-800' :
                                                            s.sessionType === 'networking' ? 'bg-green-100 text-green-800' :
                                                                'bg-brandBlue/10 text-brandBlue'
                                                            }`}>
                                                            {s.sessionType === 'meeting' ? 'Meeting' : s.sessionType === 'presentation' ? 'Talk' : s.sessionType === 'networking' ? 'Networking' : 'Break'}
                                                        </span>
                                                    }
                                                    actions={
                                                        <div className="flex justify-between w-full text-xs text-slate-500">
                                                            <span>{new Date(s.startTime).toLocaleDateString()}</span>
                                                        </div>
                                                    }
                                                />
                                            </SwipeableCard>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {mobileViewMode === 'detail' && selectedSession && (
                        <div className="space-y-6">
                            <Card className="!p-0 overflow-hidden">
                                <div className="bg-slate-100 dark:bg-slate-800 p-6 flex flex-col items-center text-center border-b border-slate-200 dark:border-slate-700">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                        <Icon name={selectedSession.sessionType === 'presentation' ? 'microphone' : selectedSession.sessionType === 'networking' ? 'users' : 'clock'} className="w-8 h-8 text-primary-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedSession.name}</h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedSession.sessionType === 'break' ? 'bg-amber-100 text-amber-800' :
                                        selectedSession.sessionType === 'networking' ? 'bg-green-100 text-green-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {selectedSession.sessionType?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <Icon name="clock" className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="font-semibold text-sm">Time</p>
                                            <p className="text-sm">{new Date(selectedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            <p className="text-xs text-slate-400">{new Date(selectedSession.startTime).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {selectedSession.location && (
                                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                            <Icon name="mapPin" className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="font-semibold text-sm">Location</p>
                                                <p className="text-sm">{selectedSession.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedSession.speaker && (
                                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                            <Icon name="user" className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="font-semibold text-sm">Speaker</p>
                                                <p className="text-sm">{selectedSession.speaker}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedSession.description && (
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                            <p className="text-sm text-slate-500 italic">"{selectedSession.description}"</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="secondary" onClick={() => setIsAvailableAttendeesModalOpen(true)} className="justify-center py-3">
                                    <Icon name="userPlus" className="w-4 h-4 mr-2" />
                                    Add Attendees
                                </Button>
                                <Button variant="secondary" onClick={() => setIsBulkRegModalOpen(true)} className="justify-center py-3">
                                    <Icon name="users" className="w-4 h-4 mr-2" />
                                    Bulk Manage
                                </Button>
                            </div>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                            {/* Advanced Configuration - Mobile */}
                            <div className="border-t border-slate-200 dark:border-slate-700 my-4 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        Advanced Configuration
                                        {!canConfigureSessions && !isLoadingFeatures && (
                                            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 font-normal border border-slate-200">
                                                Premium
                                            </span>
                                        )}
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="neutral"
                                        size="sm"
                                        onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                                        disabled={!canConfigureSessions && !isLoadingFeatures}
                                    >
                                        {showAdvancedConfig ? 'Hide' : 'Configure'}
                                    </Button>
                                </div>

                                {!canConfigureSessions && !isLoadingFeatures && (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center mb-3">
                                        <p className="text-xs text-slate-600">Upgrade to Professional plan for advanced scanning rules.</p>
                                    </div>
                                )}

                                {showAdvancedConfig && (
                                    <div className="animate-fadeIn bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                                        <SessionConfigEditor
                                            config={sessionConfig}
                                            onChange={updateSessionConfig}
                                            disabled={isSubmitting || loadingData}
                                        />
                                        {!isSessionConfigValid && (
                                            <p className="text-xs text-red-500 mt-2">
                                                * Please fix configuration errors before saving.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Spacer for fixed bottom button */}
                            <div className="h-24"></div>

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
            <div className="space-y-8 pb-40">
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

                                {/* Advanced Configuration */}
                                <div className="border-t border-slate-200 dark:border-slate-700 my-6 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            Advanced Configuration
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="neutral"
                                            size="sm"
                                            onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                                            title="Configure advanced scanning rules"
                                        >
                                            {showAdvancedConfig ? 'Hide Settings' : 'Configure Scanning Rules'}
                                        </Button>
                                    </div>

                                    {showAdvancedConfig && (
                                        <div className="animate-fadeIn bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <SessionConfigEditor
                                                config={sessionConfig}
                                                onChange={updateSessionConfig}
                                                disabled={isSubmitting || loadingData}
                                            />
                                            {!isSessionConfigValid && (
                                                <p className="text-sm text-red-500 mt-2">
                                                    * Please fix configuration errors before saving.
                                                </p>
                                            )}
                                        </div>
                                    )}
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