// src/pages/admin/AttendeeLocatorPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../../contexts/EventDataContext';
import { SessionRegistration } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { MagnifyingGlassIcon, ArrowPathIcon, UserIcon, BuildingStorefrontIcon, LinkedinIcon, ArrowUpTrayIcon } from '../../components/Icons';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface SortedMissingAttendee extends SessionRegistration {
    boothName?: string;
    boothFulfillmentRatio: number;
    boothPresentCount: number;
    boothExpectedCount: number;
    attendeeLinkedinUrl?: string | null;
}

const AttendeeLocatorPage: React.FC = () => {
    const {
        getOperationalSessionDetails,
        getSessionRegistrationsForSession,
        loadingData,
        scans, // Needed to trigger re-renders on status changes
        attendees,
        fetchData,
    } = useEventData();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortedMissingAttendees, setSortedMissingAttendees] = useState<SortedMissingAttendee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const operationalDetails = useMemo(() => getOperationalSessionDetails(), [getOperationalSessionDetails]);
    const liveSession = useMemo(() => operationalDetails.session, [operationalDetails]);

    // Auto-refresh for real-time missing attendee updates
    const { lastUpdated, isRefreshing, manualRefresh } = useAutoRefresh({
        intervalMs: 10000,
        enabled: true,
        onlyWhenActive: true
    });

    useEffect(() => {
        if (liveSession?.id) {
            setIsLoading(true);
            getSessionRegistrationsForSession(liveSession.id)
                .then(result => {
                    if (result.success) {
                        const allRegistrations = result.data;

                        // 1. Calculate Booth Fulfillment Statistics
                        const boothStats = new Map<string, { expected: number; present: number }>();
                        allRegistrations.forEach(reg => {
                            if (reg.expectedBoothId) {
                                if (!boothStats.has(reg.expectedBoothId)) {
                                    boothStats.set(reg.expectedBoothId, { expected: 0, present: 0 });
                                }
                                const stats = boothStats.get(reg.expectedBoothId)!;
                                stats.expected++;
                                if (reg.status === 'Attended') {
                                    stats.present++;
                                }
                            }
                        });

                        // 2. Filter for missing attendees and enrich with stats
                        const missingWithStats = allRegistrations
                            .filter(reg => reg.status === 'Registered' && reg.expectedBoothId)
                            .map((reg): SortedMissingAttendee => {
                                const stats = boothStats.get(reg.expectedBoothId!) || { expected: 1, present: 0 };
                                const attendeeProfile = attendees.find(a => a.id === reg.attendeeId);
                                return {
                                    ...reg,
                                    boothFulfillmentRatio: stats.expected > 0 ? stats.present / stats.expected : 0,
                                    boothPresentCount: stats.present,
                                    boothExpectedCount: stats.expected,
                                    attendeeLinkedinUrl: attendeeProfile?.linkedin_url
                                };
                            });

                        // 3. Sort the enriched list with prioritization logic
                        missingWithStats.sort((a, b) => {
                            // Rule 1: Fulfillment Ratio (ascending - least full first)
                            if (a.boothFulfillmentRatio !== b.boothFulfillmentRatio) {
                                return a.boothFulfillmentRatio - b.boothFulfillmentRatio;
                            }
                            // Rule 2: Absolute number of people missing (descending - most missing first)
                            const missingA = a.boothExpectedCount - a.boothPresentCount;
                            const missingB = b.boothExpectedCount - b.boothPresentCount;
                            if (missingA !== missingB) {
                                return missingB - missingA;
                            }
                            // Rule 3: Alphabetical by name for consistency
                            return (a.attendeeName || '').localeCompare(b.attendeeName || '');
                        });

                        setSortedMissingAttendees(missingWithStats);
                    } else {
                        toast.error(`Could not load attendees for the live session: ${result.message}`);
                        setSortedMissingAttendees([]);
                    }
                })
                .finally(() => setIsLoading(false));
        } else {
            setSortedMissingAttendees([]);
            setIsLoading(false);
        }
    }, [liveSession, getSessionRegistrationsForSession, scans, attendees]);

    const filteredMissingAttendees = useMemo(() => {
        if (!searchTerm) return sortedMissingAttendees;
        const lowercasedFilter = searchTerm.toLowerCase();
        return sortedMissingAttendees.filter(attendee =>
            attendee.attendeeName?.toLowerCase().includes(lowercasedFilter) ||
            attendee.boothName?.toLowerCase().includes(lowercasedFilter)
        );
    }, [sortedMissingAttendees, searchTerm]);

    const handleNavigateToProfile = (attendeeId: string) => {
        navigate(`/attendee-profiles/${attendeeId}`);
    };

    const handleExportCSV = () => {
        if (filteredMissingAttendees.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const headers = ["Nombre", "Booth Esperado", "Fulfillment %", "Presentes/Esperados", "LinkedIn"];
        const rows = filteredMissingAttendees.map(a => [
            a.attendeeName || 'N/A',
            a.boothName || 'N/A',
            `${(a.boothFulfillmentRatio * 100).toFixed(0)}%`,
            `${a.boothPresentCount}/${a.boothExpectedCount}`,
            a.attendeeLinkedinUrl || ''
        ]);

        const csvContent = [headers, ...rows].map(row =>
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `faltantes_${liveSession?.name || 'session'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(`Exportados ${filteredMissingAttendees.length} registros`);
    };

    const renderContent = () => {
        if (loadingData || isLoading) {
            return (
                <div className="text-center py-10">
                    <ArrowPathIcon className="w-8 h-8 mx-auto text-primary-500 animate-spin" />
                    <p className="mt-2 text-slate-500">{t(localeKeys.loading)}</p>
                </div>
            );
        }

        if (!liveSession) {
            return (
                <Alert type="info" message={t(localeKeys.locatorNoSession)} />
            );
        }

        if (filteredMissingAttendees.length === 0) {
            return (
                <Alert type="success" message={searchTerm ? t(localeKeys.locatorNoMatch) : t(localeKeys.locatorAllCheckedIn)} />
            );
        }

        return (
            <div className="space-y-3">
                {filteredMissingAttendees.map(attendee => (
                    <Card key={attendee.id} bodyClassName="!p-3 sm:!p-4" className="shadow-md">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-start min-w-0 flex-1 w-full sm:w-auto">
                                <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500 mr-3 sm:mr-4 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">{attendee.attendeeName}</p>
                                        {attendee.attendeeLinkedinUrl && (
                                            <a href={attendee.attendeeLinkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="View LinkedIn Profile">
                                                <LinkedinIcon className="w-4 h-4 flex-shrink-0" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        <BuildingStorefrontIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" />
                                        <span>{t(localeKeys.expectedAt)}: <span className="font-medium">{attendee.boothName || 'N/A'}</span></span>
                                    </div>
                                    <div className="mt-2.5">
                                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                            <span>{t(localeKeys.boothFulfillment)}</span>
                                            <span>{attendee.boothPresentCount} / {attendee.boothExpectedCount} {t(localeKeys.filled)}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${attendee.boothFulfillmentRatio * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => handleNavigateToProfile(attendee.attendeeId)} className="flex-shrink-0 w-full sm:w-auto">
                                {t(localeKeys.profile)}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat">
                    <MagnifyingGlassIcon className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-primary-600" />
                    {t(localeKeys.attendeeLocatorTitle)}
                </h1>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                {t(localeKeys.locatorDescription)}
            </p>

            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
                    <Input
                        id="locator-search"
                        placeholder={t(localeKeys.locatorSearchPlaceholder)}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loadingData || isLoading || !liveSession}
                        wrapperClassName="!mb-0 flex-grow w-full"
                    />
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 items-stretch sm:items-center w-full sm:w-auto">
                        {liveSession && filteredMissingAttendees.length > 0 && (
                            <Button
                                size="sm"
                                variant="neutral"
                                onClick={handleExportCSV}
                                leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />}
                                className="flex-shrink-0 w-full sm:w-auto"
                            >
                                Export CSV
                            </Button>
                        )}
                        {liveSession && (
                            <div className="text-center sm:text-right bg-green-100 dark:bg-green-900/50 p-2 rounded-lg flex-shrink-0">
                                <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">{t(localeKeys.sessionInProgress)}</p>
                                <p className="text-sm font-semibold text-green-800 dark:text-green-200">{liveSession.name}</p>
                            </div>
                        )}
                    </div>
                </div>
                {renderContent()}
            </Card>
        </div>
    );
};

export default AttendeeLocatorPage;