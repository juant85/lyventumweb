// src/pages/admin/ReportsPage.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useEventTypeConfig } from '../../contexts/EventTypeConfigContext'; // NEW
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Select from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';
import { generateEventSummaryPDF, generateBoothReportPDF, generateTemplateBasedPDF } from '../../utils/pdfGenerator';
import { toast } from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { svgToPng } from '../../utils/chartToImage';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import TemplateSelector from '../../components/reports/TemplateSelector';
import TemplatePreview from '../../components/reports/TemplatePreview';
import { getTemplateById } from '../../utils/reportTemplates';
import { useIsMobile } from '../../hooks/useIsMobile';


const ReportsPage: React.FC = () => {
    const { sessions, scans, allConfiguredBooths: booths, attendees, loadingData, dataError, getBoothById } = useEventData();
    const { currentEvent, selectedEventId } = useSelectedEvent();
    const { config, isTradeShow } = useEventTypeConfig(); // NEW
    const { t } = useLanguage();
    const isMobile = useIsMobile();

    const [selectedBoothId, setSelectedBoothId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<null | 'summary' | 'booth' | 'summary-charts' | 'booth-csv' | 'trade-show-csv'>(null);
    const [showChartsForPdf, setShowChartsForPdf] = useState(false);

    const chartContainerRef = useRef<HTMLDivElement>(null);

    // Template system state
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
    const [showPreview, setShowPreview] = useState(false);

    const attendanceOverTimeData = useMemo(() => {
        if (!scans || scans.length === 0) return [];
        const data: { [hour: string]: number } = {};
        const todayScans = scans.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());
        todayScans.forEach(scan => {
            const hourString = `${String(new Date(scan.timestamp).getHours()).padStart(2, '0')}:00`;
            data[hourString] = (data[hourString] || 0) + 1;
        });
        return Object.entries(data).sort((a, b) => a[0].localeCompare(b[0])).map(([name, Attendance]) => ({ name, Attendance }));
    }, [scans]);

    const popularBoothsData = useMemo(() => {
        if (!scans || scans.length === 0) return [];
        const boothCounts: { [boothId: string]: number } = {};
        scans.forEach(scan => {
            const boothId = scan.boothId || 'unknown';
            boothCounts[boothId] = (boothCounts[boothId] || 0) + 1;
        });
        return Object.entries(boothCounts)
            .map(([boothId, count]) => ({ name: getBoothById(boothId)?.companyName || `Booth ${boothId.slice(-4)}`, Traffic: count }))
            .sort((a, b) => b.Traffic - a.Traffic).slice(0, 5);
    }, [scans, getBoothById]);

    const sessionParticipationData = useMemo(() => {
        if (!sessions || sessions.length === 0 || !scans) return [];
        return sessions.map(session => ({
            name: session.name,
            value: new Set(scans.filter(s => s.sessionId === session.id).map(s => s.attendeeId)).size,
        })).filter(s => s.value > 0);
    }, [scans, sessions]);

    const PIE_COLORS = ['#3b82f6', '#22c55e', '#f43f5e', '#f97316', '#8b5cf6', '#14b8a6'];

    useEffect(() => {
        if (!showChartsForPdf) return;

        const generateImagesAndPdf = async () => {
            if (!chartContainerRef.current || !currentEvent) return;

            try {
                const svgs = {
                    attendanceTrend: chartContainerRef.current.querySelector<SVGSVGElement>('#pdf-attendance-chart svg'),
                    boothTraffic: chartContainerRef.current.querySelector<SVGSVGElement>('#pdf-booth-chart svg'),
                    sessionParticipation: chartContainerRef.current.querySelector<SVGSVGElement>('#pdf-session-chart svg'),
                };

                const imagePromises = [
                    svgs.attendanceTrend ? svgToPng(svgs.attendanceTrend, 800, 300) : Promise.resolve(undefined),
                    svgs.boothTraffic ? svgToPng(svgs.boothTraffic, 800, 300) : Promise.resolve(undefined),
                    svgs.sessionParticipation ? svgToPng(svgs.sessionParticipation, 800, 300) : Promise.resolve(undefined),
                ];

                const [attendanceTrend, boothTraffic, sessionParticipation] = await Promise.all(imagePromises);

                // Await the async PDF generation
                await generateEventSummaryPDF(currentEvent, booths, sessions, scans, getBoothById, { attendanceTrend, boothTraffic, sessionParticipation });

            } catch (error) {
                console.error("Failed to generate summary PDF with charts:", error);
                toast.error("An error occurred while generating the PDF with charts. See console for details.");
            } finally {
                setShowChartsForPdf(false);
                setIsGenerating(null);
            }
        };

        const timer = setTimeout(generateImagesAndPdf, 500);
        return () => clearTimeout(timer);

    }, [showChartsForPdf, currentEvent, booths, sessions, scans, getBoothById]);

    const handleGenerateSummaryWithCharts = async () => {
        if (!currentEvent) return;
        setIsGenerating('summary-charts');
        setShowChartsForPdf(true); // Triggers the useEffect
    };

    const handleGenerateBoothReport = async () => {
        if (!currentEvent || !selectedBoothId) return;
        const targetBooth = booths.find(b => b.id === selectedBoothId);
        if (!targetBooth) { toast.error("Selected booth not found."); return; }

        setIsGenerating('booth');
        try {
            // Await the async PDF generation
            await generateBoothReportPDF(currentEvent, targetBooth, scans, attendees);
        } catch (error: any) {
            console.error("Failed to generate booth PDF:", error);
            toast.error(`An error occurred while generating the PDF: ${error.message}`);
        } finally {
            setIsGenerating(null);
        }
    };

    const handleExportBoothLeads = async () => {
        if (!currentEvent || !selectedBoothId) return;
        const targetBooth = booths.find(b => b.id === selectedBoothId);
        if (!targetBooth) { toast.error("Selected booth not found."); return; }

        setIsGenerating('booth-csv');
        const toastId = toast.loading('Exporting leads...');

        try {
            const scansForBooth = scans.filter(s => s.boothId === selectedBoothId);
            const uniqueVisitorIds = [...new Set(scansForBooth.map(s => s.attendeeId))];

            const visitors = uniqueVisitorIds.map(id => {
                const attendeeDetails = attendees.find(a => a.id === id);
                const firstVisit = scansForBooth.find(s => s.attendeeId === id);
                return { ...attendeeDetails, timestamp: firstVisit ? new Date(firstVisit.timestamp).toLocaleString() : 'N/A' };
            }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const headers = ["ID", "Name", "Email", "Organization", "Position", "Phone", "Notes", "FirstVisitTimestamp", "ScanStatus", "ExpectedBooth"];
            const escapeCsv = (val: string | undefined | null) => val ? `"${String(val).replace(/"/g, '""')}"` : '';

            const csvRows = [
                headers.join(','),
                ...visitors.map(v => {
                    const firstScan = scansForBooth.find(s => s.attendeeId === v.id);
                    const scanStatus = firstScan?.scanStatus || 'N/A';
                    const expectedBoothId = firstScan?.expectedBoothId;
                    const expectedBoothName = expectedBoothId ? getBoothById(expectedBoothId)?.companyName || 'Unknown' : '-';

                    return [
                        escapeCsv(v.id), escapeCsv(v.name), escapeCsv(v.email), escapeCsv(v.organization),
                        escapeCsv(v.position), escapeCsv(v.phone), escapeCsv(v.notes), escapeCsv(v.timestamp),
                        escapeCsv(scanStatus), escapeCsv(expectedBoothName)
                    ].join(',');
                })
            ];

            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `LyVenTum_Leads_${targetBooth.companyName.replace(/\s/g, '_')}.csv`;
            link.click();
            toast.success("Leads exported successfully!", { id: toastId });
        } catch (error: any) {
            console.error("Failed to export leads CSV:", error);
            toast.error(`Failed to export leads: ${error.message}`);
        } finally {
            setIsGenerating(null);
        }
    };

    // NEW: Trade Show Lead Export
    const handleExportTradeShowLeads = async () => {
        if (!currentEvent) return;

        setIsGenerating('trade-show-csv');
        const toastId = toast.loading('Exporting trade show leads...');

        try {
            // Get all scans for current event
            const allScans = scans;

            // Group by attendee to find unique leads
            const uniqueAttendeeIds = [...new Set(allScans.map(s => s.attendeeId))];

            const leads = uniqueAttendeeIds.map(id => {
                const attendeeScans = allScans.filter(s => s.attendeeId === id);
                const attendeeDetails = attendees.find(a => a.id === id);
                const firstScan = attendeeScans.sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                )[0];

                return {
                    id,
                    name: attendeeDetails?.name || firstScan?.attendeeName || 'Unknown',
                    email: attendeeDetails?.email || 'N/A',
                    organization: attendeeDetails?.organization || 'N/A',
                    firstContact: firstScan?.timestamp || '',
                    totalScans: attendeeScans.length,
                    isReturn: attendeeScans.length > 1 ? 'Yes' : 'No'
                };
            }).sort((a, b) => new Date(b.firstContact).getTime() - new Date(a.firstContact).getTime());

            // Generate CSV
            const headers = ["ID", "Name", "Email", "Organization", "First Contact", "Total Scans", "Return Visitor"];
            const escapeCsv = (val: string | undefined | null) => val ? `"${String(val).replace(/"/g, '""')}"` : '';

            const csvRows = [
                headers.join(','),
                ...leads.map(lead => [
                    escapeCsv(lead.id),
                    escapeCsv(lead.name),
                    escapeCsv(lead.email),
                    escapeCsv(lead.organization),
                    escapeCsv(new Date(lead.firstContact).toLocaleString()),
                    lead.totalScans.toString(),
                    lead.isReturn
                ].join(','))
            ];

            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `LyVenTum_TradeShow_Leads_${currentEvent.name.replace(/\s/g, '_')}.csv`;
            link.click();

            toast.success(`${leads.length} leads exported successfully!`, { id: toastId });
        } catch (error: any) {
            console.error("Failed to export trade show leads:", error);
            toast.error(`Failed to export: ${error.message}`);
        } finally {
            setIsGenerating(null);
        }
    };

    const boothOptions = booths.map(booth => ({
        value: booth.id,
        label: `${booth.companyName} (${booth.physicalId})`
    }));

    if (!selectedEventId) {
        return <Alert type="info" message={t(localeKeys.noEventSelected)} />;
    }
    if (loadingData) {
        return <Alert type="info" message={t(localeKeys.loading)} />;
    }

    if (dataError || (!scans.length && !sessions.length && !loadingData)) {

        return (
            <div className="space-y-6">
                <div className="px-5">
                    <h1 className="text-3xl font-bold flex items-center font-montserrat text-slate-800 dark:text-slate-100">
                        <Icon name="reports" className="w-8 h-8 mr-3 text-primary-600" />
                        {t(localeKeys.reportsTitle)}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Generate professional reports and export data for stakeholders
                    </p>
                </div>
                <Card title={t(localeKeys.reportsUnavailable)}>
                    <p className="text-slate-500 dark:text-slate-300">
                        {dataError ? `An error occurred: ${dataError}` : "There is no data for the selected event to generate reports."}
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <>
            {/* Off-screen container for rendering charts for PDF generation */}
            {showChartsForPdf && (
                <div ref={chartContainerRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', backgroundColor: 'white', padding: '10px' }}>
                    {attendanceOverTimeData.length > 0 && <div id="pdf-attendance-chart" style={{ width: 800, height: 300 }}><ResponsiveContainer><LineChart data={attendanceOverTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="Attendance" stroke={PIE_COLORS[0]} /></LineChart></ResponsiveContainer></div>}
                    {popularBoothsData.length > 0 && <div id="pdf-booth-chart" style={{ width: 800, height: 300 }}><ResponsiveContainer><BarChart data={popularBoothsData} layout="vertical" margin={{ top: 20, right: 30, left: 120, bottom: 5 }}><CartesianGrid /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={120} interval={0} /><Tooltip /><Bar dataKey="Traffic" fill={PIE_COLORS[1]} /></BarChart></ResponsiveContainer></div>}
                    {sessionParticipationData.length > 0 && <div id="pdf-session-chart" style={{ width: 800, height: 300 }}><ResponsiveContainer><PieChart><Pie data={sessionParticipationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{sessionParticipationData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>}
                </div>
            )}

            <div className={`space-y-8 ${isMobile ? 'pb-28' : ''}`}>
                <div className="px-5">
                    <h1 className="text-3xl font-bold flex items-center font-montserrat text-slate-800 dark:text-slate-100">
                        <Icon name="reports" className="w-8 h-8 mr-3 text-primary-600" />
                        {t(localeKeys.reportsTitle)}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Generate professional reports and export data for stakeholders
                    </p>
                </div>

                {/* NEW: Template-Based Workflow */}
                {!showPreview && !selectedTemplateId && (
                    <div className="mb-8">
                        <TemplateSelector
                            selectedTemplateId={selectedTemplateId}
                            onSelectTemplate={(templateId) => {
                                setSelectedTemplateId(templateId);
                                setShowPreview(true);
                            }}
                        />
                    </div>
                )}

                {showPreview && selectedTemplateId && getTemplateById(selectedTemplateId) && (
                    <div className="mb-8">
                        <TemplatePreview
                            template={getTemplateById(selectedTemplateId)!}
                            onEdit={() => {
                                setShowPreview(false);
                                setSelectedTemplateId(undefined);
                            }}
                            onGenerate={async () => {
                                if (!currentEvent) {
                                    toast.error('No event selected');
                                    return;
                                }

                                setIsGenerating('summary-charts');
                                try {
                                    // Generate charts first
                                    setShowChartsForPdf(true);

                                    // Wait a bit for charts to render
                                    await new Promise(resolve => setTimeout(resolve, 500));

                                    // Get chart images
                                    const svgs = {
                                        attendanceTrend: chartContainerRef.current?.querySelector<SVGSVGElement>('#pdf-attendance-chart svg'),
                                        boothTraffic: chartContainerRef.current?.querySelector<SVGSVGElement>('#pdf-booth-chart svg'),
                                        sessionParticipation: chartContainerRef.current?.querySelector<SVGSVGElement>('#pdf-session-chart svg'),
                                    };

                                    const imagePromises = [
                                        svgs.attendanceTrend ? svgToPng(svgs.attendanceTrend, 800, 300) : Promise.resolve(undefined),
                                        svgs.boothTraffic ? svgToPng(svgs.boothTraffic, 800, 300) : Promise.resolve(undefined),
                                        svgs.sessionParticipation ? svgToPng(svgs.sessionParticipation, 800, 300) : Promise.resolve(undefined),
                                    ];

                                    const [attendanceTrend, boothTraffic, sessionParticipation] = await Promise.all(imagePromises);

                                    // Generate template-based PDF
                                    await generateTemplateBasedPDF(
                                        selectedTemplateId,
                                        currentEvent,
                                        booths,
                                        sessions,
                                        scans,
                                        attendees,
                                        getBoothById,
                                        { attendanceTrend, boothTraffic, sessionParticipation }
                                    );

                                    toast.success(`${getTemplateById(selectedTemplateId)?.name} generated successfully!`);
                                    setShowChartsForPdf(false);
                                } catch (error) {
                                    toast.error('Failed to generate report');
                                    console.error(error);
                                    setShowChartsForPdf(false);
                                } finally {
                                    setIsGenerating(null);
                                }
                            }}
                            isGenerating={isGenerating === 'summary-charts'}
                        />
                    </div>
                )}

                {/* Original/Legacy Options */}
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-8`}>
                    <Card title={t(localeKeys.eventSummaryReport)}>
                        <p className="text-sm text-slate-600 mb-4">
                            {t(localeKeys.eventSummaryDesc)}
                        </p>
                        <Button
                            onClick={handleGenerateSummaryWithCharts}
                            disabled={!!isGenerating || scans.length === 0}
                            leftIcon={<Icon name="chartPie" className="w-5 h-5" />}
                            variant="primary"
                        >
                            {isGenerating === 'summary-charts' ? t(localeKeys.renderingCharts) : t(localeKeys.downloadFullReport)}
                        </Button>
                        {scans.length === 0 && <p className="text-xs text-slate-500 mt-2">{t(localeKeys.noScanData)}</p>}
                    </Card>

                    <Card title={t(localeKeys.boothSpecificReport)}>
                        <p className="text-sm text-slate-600 mb-4">
                            {t(localeKeys.boothSpecificDesc)}
                        </p>
                        <div className="space-y-4">
                            <Select
                                label={t(localeKeys.selectABooth)}
                                id="booth-report-select"
                                options={[{ value: '', label: t(localeKeys.selectABooth) }, ...boothOptions]}
                                value={selectedBoothId}
                                onChange={(e) => setSelectedBoothId(e.target.value)}
                                disabled={!!isGenerating || booths.length === 0}
                                wrapperClassName="!mb-0"
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={handleGenerateBoothReport}
                                    disabled={!!isGenerating || !selectedBoothId}
                                >
                                    {isGenerating === 'booth' ? 'Generating PDF...' : t(localeKeys.downloadBoothPdf)}
                                </Button>
                                <Button
                                    onClick={handleExportBoothLeads}
                                    disabled={!!isGenerating || !selectedBoothId}
                                    variant="secondary"
                                    leftIcon={<Icon name="download" className="w-5 h-5" />}
                                >
                                    {isGenerating === 'booth-csv' ? 'Exporting...' : t(localeKeys.exportLeadsToCsv)}
                                </Button>
                            </div>
                        </div>
                        {booths.length === 0 && <p className="text-xs text-slate-500 mt-2">No booths configured for this event.</p>}

                        {/* Scan Details Table */}
                        {selectedBoothId && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">
                                    Scans for {getBoothById(selectedBoothId)?.companyName || 'Selected Booth'}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                        <thead className="bg-slate-50 dark:bg-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendee</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organization</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expected Booth</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                            {scans.filter(s => s.boothId === selectedBoothId).map(scan => {
                                                const attendee = attendees.find(a => a.id === scan.attendeeId);
                                                const expectedBooth = scan.expectedBoothId ? getBoothById(scan.expectedBoothId) : null;

                                                return (
                                                    <tr key={scan.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                                            {new Date(scan.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                {attendee?.name || scan.attendeeName || 'Unknown'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                                            {attendee?.organization || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {scan.scanStatus === 'EXPECTED' && (
                                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                    ✅ Expected
                                                                </span>
                                                            )}
                                                            {scan.scanStatus === 'WALK_IN' && (
                                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                                    🚶 Walk-in
                                                                </span>
                                                            )}
                                                            {scan.scanStatus === 'WRONG_BOOTH' && (
                                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                                                    ⚠️ Wrong Booth
                                                                </span>
                                                            )}
                                                            {scan.scanStatus === 'OUT_OF_SCHEDULE' && (
                                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                    ⏰ Out of Schedule
                                                                </span>
                                                            )}
                                                            {!scan.scanStatus && (
                                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                                    Regular
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                                            {expectedBooth ? (
                                                                <span className="font-medium">{expectedBooth.companyName}</span>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-slate-500">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                            {scan.notes || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* NEW: Trade Show Lead Export */}
                    {isTradeShow && (
                        <Card title="📊 Trade Show Lead Export">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Export complete list of captured leads with timestamps and engagement metrics.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                                <p className="text-xs text-slate-700 dark:text-slate-300">
                                    <strong>Export includes:</strong> Unique leads, email, organization, first contact timestamp, total scans, and return visitor indicator.
                                </p>
                            </div>
                            <Button
                                onClick={handleExportTradeShowLeads}
                                disabled={isGenerating === 'trade-show-csv'}
                                variant="primary"
                                leftIcon={<Icon name="download" className="w-5 h-5" />}
                            >
                                {isGenerating === 'trade-show-csv' ? 'Exporting...' : 'Export Lead List (CSV)'}
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
};

export default ReportsPage;