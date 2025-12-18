import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEventData } from '../../contexts/EventDataContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { Attendee, AppRoute } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { UsersGroupIcon, UserIcon, DocumentDuplicateIcon, ExclamationTriangleIcon, CheckCircleIcon, DocumentArrowDownIcon, DocumentTextIcon, UserPlusIcon, ArrowPathIcon } from '../../components/Icons';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import QRCodeLib from 'qrcode';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { Feature } from '../../features';
import { supabase } from '../../supabaseClient';
import Select from '../../components/ui/Select';
import EmailAnalyticsSummary from '../../components/admin/EmailAnalyticsSummary';
import AvailableAttendeesModal from '../../components/admin/AvailableAttendeesModal';
import { emailTrackingService, EmailTrackingStatus } from '../../services/emailTrackingService';

const DuplicateReviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    duplicates: Attendee[];
    onMerge: (primaryId: string, duplicateIds: string[]) => Promise<void>;
}> = ({ isOpen, onClose, duplicates, onMerge }) => {
    const [selectedPrimary, setSelectedPrimary] = useState<string>('');

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Review Duplicates">
            <div className="space-y-4">
                <Alert type="warning" message="Select the primary record to keep. All other records will be merged into it (scans preserved) and then deleted." />
                <div className="space-y-2">
                    {duplicates.map(d => (
                        <div key={d.id} className={`p-3 border rounded-lg cursor-pointer ${selectedPrimary === d.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`} onClick={() => setSelectedPrimary(d.id)}>
                            <div className="flex items-center gap-2">
                                <input type="radio" checked={selectedPrimary === d.id} readOnly />
                                <div>
                                    <p className="font-semibold">{d.name}</p>
                                    <p className="text-sm text-slate-500">{d.email}</p>
                                    <p className="text-xs text-slate-400">ID: {d.id}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4">
                    <Button variant="neutral" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button
                        variant="primary"
                        disabled={!selectedPrimary}
                        onClick={() => {
                            const others = duplicates.filter(d => d.id !== selectedPrimary).map(d => d.id);
                            onMerge(selectedPrimary, others);
                        }}
                    >
                        Merge & Keep Selected
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const AttendeeProfilesPage: React.FC = () => {
    const navigate = useNavigate();
    const { attendees, loadingData: eventDataLoading, mergeAttendees, sessions, allConfiguredBooths } = useEventData();
    const { selectedEventId } = useSelectedEvent();
    const { isFeatureEnabled } = useFeatureFlags();

    const [searchTerm, setSearchTerm] = useState('');
    const [isGenerating, setIsGenerating] = useState<'pdf' | 'csv' | null>(null);
    const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
    const [reviewingGroup, setReviewingGroup] = useState<Attendee[] | null>(null);

    // Email Tracking State
    const [emailFilter, setEmailFilter] = useState<'all' | 'delivered' | 'opened' | 'failed' | 'no_email'>('all');
    const [emailStatuses, setEmailStatuses] = useState<Map<string, EmailTrackingStatus>>(new Map());

    // Bulk Assign States
    const [isSessionSelectOpen, setIsSessionSelectOpen] = useState(false);
    const [selectedSessionForAssign, setSelectedSessionForAssign] = useState<string>('');

    // Fetch email tracking data
    useEffect(() => {
        const fetchEmailStatuses = async () => {
            if (selectedEventId) {
                const statuses = await emailTrackingService.getBulkTrackingStatus(selectedEventId);
                setEmailStatuses(statuses);
            }
        };
        fetchEmailStatuses();
    }, [selectedEventId]);

    // Derived state for filtering
    const filteredAttendees = useMemo(() => {
        let result = attendees;

        // 1. Text Search
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(lowerSearch) ||
                a.email?.toLowerCase().includes(lowerSearch) ||
                a.organization?.toLowerCase().includes(lowerSearch)
            );
        }

        // 2. Email Status Filter
        if (emailFilter !== 'all') {
            result = result.filter(a => {
                const status = emailStatuses.get(a.id);
                if (emailFilter === 'no_email') return !status;
                if (emailFilter === 'failed') return status?.status === 'failed';
                if (emailFilter === 'opened') return status?.status === 'opened' || status?.status === 'clicked';
                if (emailFilter === 'delivered') return status?.status === 'delivered';
                return true;
            });
        }

        return result;
    }, [attendees, searchTerm, emailFilter, emailStatuses]);

    // Simple duplicate detection by email
    const duplicateGroups = useMemo(() => {
        const emailMap = new Map<string, Attendee[]>();
        attendees.forEach(a => {
            if (a.email) {
                const normalized = a.email.toLowerCase().trim();
                const existing = emailMap.get(normalized) || [];
                emailMap.set(normalized, [...existing, a]);
            }
        });
        return Array.from(emailMap.values()).filter(group => group.length > 1);
    }, [attendees]);

    const handleMerge = async (primaryId: string, duplicateIds: string[]) => {
        const result = await mergeAttendees(primaryId, duplicateIds);
        if (result.success) {
            toast.success("Attendees merged successfully.");
            setReviewingGroup(null);
        } else {
            toast.error(result.message);
        }
    };

    const handleGeneratePdf = async () => {
        setIsGenerating('pdf');
        try {
            const doc = new jsPDF();
            let y = 10;
            const targetAttendees = selectedAttendees.size > 0
                ? attendees.filter(a => selectedAttendees.has(a.id))
                : attendees;

            for (const attendee of targetAttendees) {
                if (y > 250) { doc.addPage(); y = 10; } // Basic pagination
                doc.setFontSize(16);
                doc.text(attendee.name, 10, y);
                doc.setFontSize(10);
                doc.text(attendee.organization || '', 10, y + 5);

                // QR Code placeholder logic
                const canvas = document.createElement('canvas');
                await QRCodeLib.toCanvas(canvas, `ATT:${attendee.id}`, { width: 50 });
                const qrData = canvas.toDataURL('image/jpeg');
                doc.addImage(qrData, 'JPEG', 150, y - 5, 20, 20);

                y += 30;
            }
            doc.save('attendee-badges.pdf');
            toast.success("Badges generated.");
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to generate PDF.");
        } finally {
            setIsGenerating(null);
        }
    };

    const handleExportActivity = () => {
        setIsGenerating('csv');
        const headers = ["ID", "Name", "Email", "Organization", "CheckInTime"];
        const rows = attendees.map(a => [
            a.id,
            a.name,
            a.email || '',
            a.organization || '',
            (a.metadata as any)?.check_in_time || ''
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendee_activity.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsGenerating(null);
    };

    const renderEmailStatusBadge = (attendeeId: string) => {
        const status = emailStatuses.get(attendeeId);
        if (!status) return <span className="text-slate-400 text-xs">-</span>;

        switch (status.status) {
            case 'failed':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title={`Failed: ${status.deliveryError || 'Unknown error'}`}>❌ Failed</span>;
            case 'clicked':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800" title={`Clicked: ${new Date(status.firstClickAt!).toLocaleString()}`}>🖱️ Clicked</span>;
            case 'opened':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title={`Opened: ${new Date(status.openedAt!).toLocaleString()}`}>👀 Opened</span>;
            case 'delivered':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title={`Delivered: ${new Date(status.deliveredAt!).toLocaleString()}`}>✅ Delivered</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800" title={`Sent: ${new Date(status.sentAt!).toLocaleString()}`}>✉️ Sent</span>;
        }
    };

    const renderContent = () => {
        if (eventDataLoading) return <div className="text-center py-10"><ArrowPathIcon className="animate-spin w-8 h-8 mx-auto text-slate-400" /></div>;
        if (filteredAttendees.length === 0) return <div className="text-center py-10 text-slate-500">No attendees found.</div>;

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    checked={filteredAttendees.length > 0 && selectedAttendees.size === filteredAttendees.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedAttendees(new Set(filteredAttendees.map(a => a.id)));
                                        } else {
                                            setSelectedAttendees(new Set());
                                        }
                                    }}
                                />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organization</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-In</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Email</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredAttendees.map((attendee) => {
                            const isSelected = selectedAttendees.has(attendee.id);
                            return (
                                <tr key={attendee.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`} onClick={(e) => {
                                    if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).closest('button') === null) {
                                        navigate(`${AppRoute.AttendeeProfileDetail.replace(':attendeeId', attendee.id)}`);
                                    }
                                }}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                const newSelected = new Set(selectedAttendees);
                                                if (newSelected.has(attendee.id)) newSelected.delete(attendee.id);
                                                else newSelected.add(attendee.id);
                                                setSelectedAttendees(newSelected);
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                                    {attendee.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{attendee.name}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{attendee.email || 'No email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900 dark:text-slate-100">{attendee.position || '-'}</div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">{attendee.phone || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {attendee.organization || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(attendee.metadata as any)?.check_in_time ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Checked In
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {renderEmailStatusBadge(attendee.id)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={AppRoute.AttendeeProfileDetail.replace(':attendeeId', attendee.id)} className="text-primary-600 hover:text-primary-900 mr-4">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredAttendees.length === 0 && (
                    <div className="text-center py-12">
                        <UserIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No attendees found</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your search terms or filters.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <DuplicateReviewModal
                isOpen={!!reviewingGroup}
                onClose={() => setReviewingGroup(null)}
                duplicates={reviewingGroup || []}
                onMerge={async (primary, duplicates) => {
                    if (!selectedEventId) return;
                    await mergeAttendees(primary, duplicates);
                    setReviewingGroup(null);
                    toast.success('Attendees merged successfully');
                }}
            />

            <div className="space-y-6">
                <Modal
                    isOpen={isSessionSelectOpen}
                    onClose={() => setIsSessionSelectOpen(false)}
                    title="Select Session for Assignment"
                    size="md"
                >
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">
                            Choose a session to view available attendees and assign them to booths.
                        </p>
                        <Select
                            id="session-select"
                            label="Target Session"
                            value={selectedSessionForAssign}
                            onChange={(e) => setSelectedSessionForAssign(e.target.value)}
                            options={[
                                { value: '', label: '-- Select Session --' },
                                ...sessions.map(s => ({ value: s.id, label: s.name }))
                            ]}
                        />
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="neutral" onClick={() => setIsSessionSelectOpen(false)}>Cancel</Button>
                            <Button
                                variant="primary"
                                disabled={!selectedSessionForAssign}
                                onClick={() => setIsSessionSelectOpen(false)}
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                </Modal>

                {selectedSessionForAssign && !isSessionSelectOpen && (
                    <AvailableAttendeesModal
                        isOpen={!!selectedSessionForAssign}
                        onClose={() => setSelectedSessionForAssign('')}
                        session={sessions.find(s => s.id === selectedSessionForAssign)!}
                        allBooths={allConfiguredBooths}
                    />
                )}

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat">
                        <UsersGroupIcon className="w-8 h-8 mr-3 text-brandBlue" /> Attendee Profiles
                    </h1>
                    <Link to={AppRoute.AttendeeRegistration}>
                        <Button variant="primary" leftIcon={<UserPlusIcon className="w-5 h-5" />}>
                            New Attendee
                        </Button>
                    </Link>
                </div>

                {selectedEventId && (
                    <EmailAnalyticsSummary eventId={selectedEventId} />
                )}

                {duplicateGroups.length > 0 && (
                    <Card title="Duplicate Records Found" className="border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500/50">
                        <div className="flex items-start">
                            <ExclamationTriangleIcon className="w-10 h-10 text-amber-500 mr-4 flex-shrink-0" />
                            <div>
                                <p className="text-amber-800 dark:text-amber-200 font-semibold">
                                    {duplicateGroups.length} potential duplicate group(s) detected based on matching emails.
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Reviewing and merging these records is recommended.</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            {duplicateGroups.map((group, index) => (
                                <div key={index} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                                    <div className="text-sm text-slate-800 dark:text-slate-200">
                                        <DocumentDuplicateIcon className="w-4 h-4 inline-block mr-2 text-slate-500" />
                                        <strong>{group.length} records:</strong> {group.map(g => g.name).join(', ')}
                                    </div>
                                    <Button size="sm" onClick={() => setReviewingGroup(group)}>Review</Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <Card>
                    <div className="mb-4 md:flex justify-between items-center gap-4">
                        <Input
                            id="attendee-search"
                            label="Search Attendees"
                            placeholder="Search by name, email, organization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={eventDataLoading || attendees.length === 0}
                            wrapperClassName="!mb-0 flex-grow"
                        />
                        <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                            {isFeatureEnabled(Feature.REPORTS) && (
                                <>
                                    <Button
                                        onClick={handleGeneratePdf}
                                        disabled={!!isGenerating}
                                        leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
                                    >
                                        {isGenerating === 'pdf' ? 'Generating...' : `Generate Badges`}
                                    </Button>
                                    <Button
                                        onClick={handleExportActivity}
                                        disabled={!!isGenerating || attendees.length === 0}
                                        variant="secondary"
                                        leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
                                        title="Export detailed activity for all attendees"
                                    >
                                        Export Activity
                                    </Button>
                                    <Button
                                        onClick={() => setIsSessionSelectOpen(true)}
                                        variant="primary"
                                        leftIcon={<ArrowPathIcon className="w-5 h-5" />}
                                        title="Assign available attendees to booths for a specific session"
                                    >
                                        Bulk Assign
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    {renderContent()}
                </Card>
            </div>
        </>
    );
};

export default AttendeeProfilesPage;