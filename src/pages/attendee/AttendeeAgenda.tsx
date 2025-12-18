import React, { useState, useEffect } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import { ArrowPathIcon, BuildingStorefrontIcon, PresentationChartLineIcon, PrinterIcon } from '../../components/Icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { saveRegistrationsToCache, getRegistrationsFromCache } from '../../utils/offlineStorage';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { SkeletonList } from '../../components/ui/Skeleton';
import PageTransition from '../../components/transitions/PageTransition';
import ExportCalendarButton from '../../components/calendar/ExportCalendarButton';
import AddToCalendarDropdown from '../../components/calendar/AddToCalendarDropdown';
import FeatureGuard from '../../components/FeatureGuard';
import { Feature } from '../../features';

type AgendaItem = {
    id: string;
    sessionName: string;
    sessionStartTime: string;
    sessionType?: string; // 'meeting' | 'presentation' | 'networking' | 'break'
    location?: string; // For presentations
    speaker?: string; // For presentations
    description?: string; // For presentations
    boothName?: string; // For meetings
    boothDetails?: { physicalId: string };
    status: string;
};

export default function AttendeeAgenda() {
    const { getSessionRegistrationsForAttendee } = useEventData();
    const { currentEvent } = useSelectedEvent();
    const [agenda, setAgenda] = useState<AgendaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attendeeData, setAttendeeData] = useState<any>(null);
    const { isOnline } = useOnlineStatus();
    const [isFromCache, setIsFromCache] = useState(false);

    useEffect(() => {
        const loadAgenda = async () => {
            try {
                // Get attendee from localStorage
                const attendeeLogin = localStorage.getItem('attendee_login');
                if (!attendeeLogin) {
                    setError('No attendee session found');
                    setIsLoading(false);
                    return;
                }

                const data = JSON.parse(attendeeLogin);
                setAttendeeData({
                    id: data.attendeeId,
                    name: data.attendeeName,
                    email: data.attendeeEmail,
                });

                console.log('[AttendeeAgenda] Loading agenda for attendee:', data.attendeeId);

                // Try to load from cache first if offline
                if (!isOnline) {
                    console.log('[AttendeeAgenda] Offline - loading from cache');
                    const cachedData = await getRegistrationsFromCache(data.attendeeId);

                    if (cachedData && cachedData.length > 0) {
                        const sortedAgenda = cachedData.sort((a, b) =>
                            new Date(a.sessionStartTime || '').getTime() - new Date(b.sessionStartTime || '').getTime()
                        );
                        setAgenda(sortedAgenda as any);
                        setIsFromCache(true);
                        console.log('[AttendeeAgenda] Loaded from cache:', sortedAgenda.length);
                        setIsLoading(false);
                        return;
                    } else {
                        setError('No cached data available. Please connect to the internet.');
                        setIsLoading(false);
                        return;
                    }
                }

                // Load session registrations from API
                const result = await getSessionRegistrationsForAttendee(data.attendeeId);

                if (result.success) {
                    const sortedAgenda = (result.data as AgendaItem[]).sort((a, b) =>
                        new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime()
                    );
                    setAgenda(sortedAgenda);
                    setIsFromCache(false);
                    console.log('[AttendeeAgenda] Loaded sessions:', sortedAgenda.length);

                    // Cache the data for offline use
                    try {
                        await saveRegistrationsToCache(sortedAgenda);
                        console.log('[AttendeeAgenda] Cached agenda data');
                    } catch (cacheError) {
                        console.warn('[AttendeeAgenda] Failed to cache data:', cacheError);
                    }
                } else {
                    setError(result.message || 'Failed to load agenda');
                }
            } catch (e: any) {
                console.error('[AttendeeAgenda] Error:', e);

                // Try to load from cache on error
                if (attendeeData?.id) {
                    console.log('[AttendeeAgenda] Error occurred - trying cache');
                    const cachedData = await getRegistrationsFromCache(attendeeData.id);

                    if (cachedData && cachedData.length > 0) {
                        const sortedAgenda = cachedData.sort((a, b) =>
                            new Date(a.sessionStartTime || '').getTime() - new Date(b.sessionStartTime || '').getTime()
                        );
                        setAgenda(sortedAgenda as any);
                        setIsFromCache(true);
                        setError('Showing cached data (offline)');
                    } else {
                        setError(e.message || 'An error occurred');
                    }
                } else {
                    setError(e.message || 'An error occurred');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadAgenda();
    }, [getSessionRegistrationsForAttendee]);

    const generatePdf = async () => {
        if (!attendeeData || !currentEvent) {
            toast.error('Required data is not available.');
            return;
        }

        const toastId = toast.loading('Generating your agenda PDF...');
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'in',
                format: 'letter'
            });

            const PRIMARY_COLOR = '#2563EB';
            const TEXT_COLOR_DARK = '#0F172A';
            const TEXT_COLOR_MEDIUM = '#475569';
            const TEXT_COLOR_WHITE = '#FFFFFF';
            const FONT_SANS = 'helvetica';

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 0.5;

            // Title
            doc.setFontSize(28);
            doc.setFont(FONT_SANS, 'bold');
            doc.setTextColor(TEXT_COLOR_DARK);
            doc.text('Your Personalized Agenda', pageWidth / 2, 0.75, { align: 'center' });

            let lastFinalY = 1.2;

            if (agenda.length > 0) {
                // Group by date
                const groupedAgenda = agenda.reduce((acc, item) => {
                    const itemDate = new Date(item.sessionStartTime);
                    const dateKey = `${itemDate.getUTCFullYear()}-${itemDate.getUTCMonth()}-${itemDate.getUTCDate()}`;
                    if (!acc.has(dateKey)) {
                        acc.set(dateKey, { date: itemDate, items: [] });
                    }
                    acc.get(dateKey)!.items.push(item);
                    return acc;
                }, new Map<string, { date: Date; items: AgendaItem[] }>());

                let dayCounter = 1;
                for (const [_, group] of groupedAgenda.entries()) {
                    const dayHeaderText = `Day ${dayCounter} - ${group.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}`;
                    doc.setFontSize(14);
                    doc.setFont(FONT_SANS, 'bold');
                    doc.setTextColor(PRIMARY_COLOR);
                    doc.text(dayHeaderText, margin, lastFinalY + 0.2);
                    lastFinalY += 0.4;

                    const body = group.items.map(item => {
                        const timeText = new Date(item.sessionStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                        // Conditionally show vendor/location OR presentation details
                        const sessionType = item.sessionType || 'meeting';
                        if (sessionType === 'presentation') {
                            const speakerText = item.speaker || 'TBA';
                            const locationText = item.location || 'TBA';
                            return [timeText, speakerText, locationText];
                        } else {
                            const vendorText = item.boothName || 'N/A';
                            const locationText = item.boothDetails?.physicalId || 'N/A';
                            return [timeText, vendorText, locationText];
                        }
                    });

                    // Dynamic headers based on session type
                    const hasPresentation = group.items.some(i => (i.sessionType || 'meeting') === 'presentation');
                    const hasMeeting = group.items.some(i => (i.sessionType || 'meeting') === 'meeting');

                    let headers: string[];
                    if (hasPresentation && !hasMeeting) {
                        headers = ['Time', 'Speaker', 'Location'];
                    } else if (!hasPresentation && hasMeeting) {
                        headers = ['Time', 'Meeting with (Vendor)', 'Location (Booth ID)'];
                    } else {
                        // Mixed - use generic headers
                        headers = ['Time', 'Details', 'Location'];
                    }

                    autoTable(doc, {
                        head: [headers],
                        body,
                        startY: lastFinalY,
                        theme: 'grid',
                        margin: { left: margin, right: margin },
                        styles: { font: FONT_SANS, fontSize: 11, cellPadding: 0.2, valign: 'middle' },
                        headStyles: { fillColor: PRIMARY_COLOR, textColor: TEXT_COLOR_WHITE, fontStyle: 'bold', halign: 'center' },
                        alternateRowStyles: { fillColor: [248, 250, 252] },
                        columnStyles: {
                            0: { cellWidth: 1.5, fontStyle: 'bold', halign: 'center' },
                            1: { cellWidth: 'auto' },
                            2: { cellWidth: 2, fontStyle: 'italic', halign: 'center' },
                        },
                    });

                    lastFinalY = (doc as any).lastAutoTable.finalY + 0.4;
                    dayCounter++;
                }
            } else {
                doc.setFontSize(12);
                doc.setFont(FONT_SANS, 'normal');
                doc.setTextColor(TEXT_COLOR_MEDIUM);
                doc.text('No sessions scheduled yet.', pageWidth / 2, lastFinalY, { align: 'center' });
            }

            const safeFileName = `${attendeeData.name.replace(/[^a-z0-9]/gi, '_')}_Agenda.pdf`;
            doc.save(safeFileName);

            toast.success('PDF generated successfully!', { id: toastId });
        } catch (error: any) {
            console.error('Failed to generate PDF:', error);
            toast.error(`Could not generate PDF: ${error.message || 'Unknown error'}`, { id: toastId });
        }
    };

    // Group agenda by date for display
    const sessionsByDate = agenda.reduce((acc, item) => {
        const date = new Date(item.sessionStartTime).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {} as Record<string, AgendaItem[]>);

    if (isLoading) {
        return (
            <PageTransition>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Your Agenda</h1>
                    </div>
                    <SkeletonList count={5} />
                </div>
            </PageTransition>
        );
    }

    if (error) {
        return <Alert type="error" message={error} />;
    }

    return (
        <PageTransition >
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            My Agenda
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {agenda.length} session{agenda.length !== 1 ? 's' : ''} scheduled
                            {isFromCache && <span className="ml-2 text-amber-600">(Offline)</span>}
                        </p>
                    </div>
                    {agenda.length > 0 && (
                        <div className="flex gap-2">
                            <FeatureGuard featureKey={Feature.CALENDAR_SYNC}>
                                <ExportCalendarButton
                                    attendeeId={attendeeData.id}
                                    eventId={currentEvent?.id || ''}
                                    variant="primary"
                                />
                            </FeatureGuard>
                            <Button onClick={generatePdf} variant="secondary" leftIcon={<PrinterIcon className="w-5 h-5" />}>
                                Download PDF
                            </Button>
                        </div>
                    )}
                </div>

                {agenda.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg">
                        <div className="inline-block p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-4">
                            <PresentationChartLineIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Sessions Scheduled</h3>
                        <p className="text-gray-600 dark:text-gray-400">You haven't registered for any sessions yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(sessionsByDate).map(([date, items]) => (
                            <div key={date}>
                                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    {new Date(date).toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h2>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <Card key={item.id} className="p-4">
                                            <div className="flex items-start space-x-4">
                                                <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${item.status === 'Attended' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                                    <PresentationChartLineIcon className={`h-6 w-6 ${item.status === 'Attended' ? 'text-green-600' : 'text-blue-600'}`} />
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-baseline gap-x-2 flex-wrap">
                                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{item.sessionName}</p>
                                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.status === 'Attended' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{item.status}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                                {new Date(item.sessionStartTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            {item.boothName && (
                                                                <div className="mt-2 flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                                    <BuildingStorefrontIcon className="w-4 h-4 mr-2 text-slate-400" />
                                                                    <span>Location: <strong>{item.boothName} ({item.boothDetails?.physicalId})</strong></span>
                                                                </div>
                                                            )}
                                                            {/* Presentation Details */}
                                                            {item.sessionType === 'presentation' && (
                                                                <>
                                                                    {item.location && (
                                                                        <div className="mt-2 flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                                            <PresentationChartLineIcon className="w-4 h-4 mr-2 text-purple-500" />
                                                                            <span>Sala: <strong>{item.location}</strong></span>
                                                                        </div>
                                                                    )}
                                                                    {item.speaker && (
                                                                        <div className="mt-1 flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                                            <span className="ml-6">Por: <em>{item.speaker}</em></span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                        <FeatureGuard featureKey={Feature.CALENDAR_SYNC}>
                                                            <AddToCalendarDropdown
                                                                session={{
                                                                    id: item.id,
                                                                    name: item.sessionName,
                                                                    startTime: item.sessionStartTime,
                                                                    endTime: item.sessionStartTime,
                                                                    boothName: item.boothName,
                                                                }}
                                                                size="sm"
                                                            />
                                                        </FeatureGuard>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition >
    );
}
