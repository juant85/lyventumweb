// src/pages/AttendeeLocatorPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../contexts/EventDataContext';
import { SessionRegistration } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { MagnifyingGlassIcon, ArrowPathIcon, UserIcon, BuildingStorefrontIcon, LinkedinIcon } from '../components/Icons';
import { toast } from 'react-hot-toast';

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
    } = useEventData();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortedMissingAttendees, setSortedMissingAttendees] = useState<SortedMissingAttendee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const operationalDetails = useMemo(() => getOperationalSessionDetails(), [getOperationalSessionDetails]);
    const liveSession = useMemo(() => operationalDetails.session, [operationalDetails]);

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

    const renderContent = () => {
        if (loadingData || isLoading) {
            return (
                <div className="text-center py-10">
                    <ArrowPathIcon className="w-8 h-8 mx-auto text-primary-500 animate-spin" />
                    <p className="mt-2 text-slate-500">Loading live session data...</p>
                </div>
            );
        }

        if (!liveSession) {
            return (
                <Alert type="info" message="No session is currently active. The locator will activate when a session begins." />
            );
        }

        if (filteredMissingAttendees.length === 0) {
            return (
                <Alert type="success" message={searchTerm ? "No matching attendees found." : "All expected attendees for the current session have checked in!"} />
            );
        }

        return (
            <div className="space-y-3">
                {filteredMissingAttendees.map(attendee => (
                    <div key={attendee.id} className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-200 shadow-sm hover:shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start min-w-0 flex-1">
                                <UserIcon className="w-10 h-10 text-slate-500 mr-4 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{attendee.attendeeName}</p>
                                        {attendee.attendeeLinkedinUrl && (
                                            <a href={attendee.attendeeLinkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="View LinkedIn Profile">
                                                <LinkedinIcon className="w-4 h-4 flex-shrink-0" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        <BuildingStorefrontIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                        <span>Expected at: <span className="font-medium">{attendee.boothName || 'N/A'}</span></span>
                                    </div>
                                    <div className="mt-2.5">
                                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                            <span>Booth Fulfillment</span>
                                            <span>{attendee.boothPresentCount} / {attendee.boothExpectedCount} Filled</span>
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
                            <Button size="sm" onClick={() => handleNavigateToProfile(attendee.attendeeId)} className="flex-shrink-0">
                                Profile
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat">
                <MagnifyingGlassIcon className="w-8 h-8 mr-3 text-primary-600" />
                Attendee Locator
            </h1>

            <p className="text-slate-600 dark:text-slate-300">
                This page shows a prioritized, live list of attendees who are expected at a booth but have not yet checked in. Attendees for the emptiest booths are shown first.
            </p>

            <Card>
                <div className="md:flex justify-between items-center gap-4 mb-4">
                    <Input
                        id="locator-search"
                        placeholder="Search by name or booth..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loadingData || isLoading || !liveSession}
                        wrapperClassName="!mb-0 flex-grow"
                    />
                    {liveSession && (
                        <div className="text-center md:text-right bg-green-100 dark:bg-green-900/50 p-2 rounded-lg mt-3 md:mt-0 flex-shrink-0">
                            <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">Live Session</p>
                            <p className="text-sm font-semibold text-green-800 dark:text-green-200">{liveSession.name}</p>
                        </div>
                    )}
                </div>
                {renderContent()}
            </Card>
        </div>
    );
};

export default AttendeeLocatorPage;