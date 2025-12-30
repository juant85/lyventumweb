// src/components/mobile/dashboard/OrganizerMobileDashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../../../contexts/EventDataContext';
import { MobileCard, SpeedDialFAB, MobileEmptyState } from '../index';
import SwipeableCarousel from '../../ui/SwipeableCarousel';
import QuickStatCard from '../../dashboard/QuickStatCard';
import { Calendar } from 'lucide-react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import LiveIndicator from '../LiveIndicator';

const OrganizerMobileDashboard: React.FC = () => {
    const { scans, sessions, booths, attendees, operationalDetails } = useEventData();
    const navigate = useNavigate();

    // Get live session from operationalDetails
    const liveSession = operationalDetails.session;

    // Auto-refresh every 10 seconds
    const { lastUpdated, isRefreshing, manualRefresh } = useAutoRefresh({
        intervalMs: 10000,
        enabled: true,
        onlyWhenActive: true
    });

    const allSessions = sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const upcomingSessions = allSessions
        .filter(s => new Date(s.startTime) > new Date())
        .slice(0, 5);

    const overallStats = {
        totalScans: scans.length,
        uniqueAttendees: new Set(scans.map(s => s.attendeeId)).size,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => {
            const now = new Date();
            return now >= new Date(s.startTime) && now <= new Date(s.endTime);
        }).length,
        checkedIn: attendees.filter(a => !!a.checkInTime).length,
        expected: attendees.filter(a => !a.checkInTime).length,
        activeBooths: booths.length
    };

    // Top booths by visitor count
    const topBooths = booths
        .map(booth => ({
            ...booth,
            visitors: new Set(scans.filter(s => s.boothId === booth.id).map(s => s.attendeeId)).size
        }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 3);

    const isSessionLive = (session: typeof sessions[0]) => {
        const now = new Date();
        return now >= new Date(session.startTime) && now <= new Date(session.endTime);
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Live Indicator */}
            <div className="px-4 pt-2">
                <LiveIndicator
                    lastUpdated={lastUpdated}
                    isRefreshing={isRefreshing}
                    onRefresh={manualRefresh}
                />
            </div>

            {/* Stats Carousel */}
            <div>
                <h2 className="text-lg font-bold mb-3 px-4 text-slate-900 dark:text-white">Quick Stats</h2>
                <SwipeableCarousel>
                    <QuickStatCard
                        label="Total Scans"
                        value={overallStats.totalScans}
                        icon="users"
                        color="blue"
                    />
                    <QuickStatCard
                        label="Unique Attendees"
                        value={overallStats.uniqueAttendees}
                        icon="users"
                        color="green"
                    />
                    <QuickStatCard
                        label="Total Sessions"
                        value={overallStats.totalSessions}
                        icon="calendar"
                        color="purple"
                    />
                    <QuickStatCard
                        label="Checked In"
                        value={overallStats.checkedIn}
                        icon="checkCircle"
                        color="green"
                    />
                    <QuickStatCard
                        label="Expected"
                        value={overallStats.expected}
                        icon="clock"
                        color="amber"
                    />
                    <QuickStatCard
                        label="Active Booths"
                        value={overallStats.activeBooths}
                        icon="store"
                        color="pink"
                    />
                </SwipeableCarousel>
            </div>

            {/* Top Booths */}
            <div className="px-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Booths</h2>
                    <button
                        onClick={() => navigate('/booth-setup')}
                        className="text-sm text-primary-600 dark:text-primary-400 font-semibold"
                    >
                        View All →
                    </button>
                </div>
                <div className="space-y-3">
                    {topBooths.length > 0 ? (
                        topBooths.map(booth => (
                            <MobileCard
                                key={booth.id}
                                title={booth.companyName}
                                subtitle={`Physical ID: ${booth.physicalId}`}
                                icon={<div className="w-5 h-5 text-pink-500">🏢</div>}
                                badge={
                                    <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-bold">
                                        {booth.visitors} visitors
                                    </span>
                                }
                                onClick={() => navigate('/booth-setup')}
                            />
                        ))
                    ) : (
                        <MobileEmptyState
                            icon={<div className="text-4xl">🏢</div>}
                            title="No Booths Yet"
                            description="Add booths to track engagement"
                            action={{
                                label: "Add Booth",
                                onClick: () => navigate('/booth-setup')
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="px-4">
                <h2 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Upcoming Sessions</h2>
                <div className="space-y-3">
                    {upcomingSessions.length > 0 ? (
                        upcomingSessions.map(session => (
                            <MobileCard
                                key={session.id}
                                title={session.name}
                                subtitle={formatDateTime(session.startTime)}
                                icon={<Calendar className="w-5 h-5 text-primary-600" />}
                                badge={
                                    isSessionLive(session) ? (
                                        <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                            LIVE
                                        </span>
                                    ) : null
                                }
                                onClick={() => navigate(`/sessions/${session.id}`)}
                            />
                        ))
                    ) : (
                        <MobileEmptyState
                            icon={<Calendar className="w-8 h-8" />}
                            title="No Upcoming Sessions"
                            description="Create your first session to get started with your event"
                            action={{
                                label: 'Create Session',
                                onClick: () => navigate('/sessions/new')
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Speed Dial for Quick Actions */}
            <SpeedDialFAB
                actions={[
                    {
                        icon: 'qrCode',
                        label: 'Scan QR',
                        onClick: () => navigate('/admin/scan'),
                        color: 'bg-primary-600'
                    },
                    {
                        icon: 'checkCircle',
                        label: 'Check-In Desk',
                        onClick: () => navigate('/check-in-desk'),
                        color: 'bg-green-600'
                    },
                    {
                        icon: 'userPlus',
                        label: 'Add Walk-In',
                        onClick: () => navigate('/attendees/add'),
                        color: 'bg-blue-600'
                    },
                    {
                        icon: 'calendar',
                        label: 'New Session',
                        onClick: () => navigate('/sessions/new'),
                        color: 'bg-purple-600'
                    },
                    {
                        icon: 'store',
                        label: 'Booth Stats',
                        onClick: () => navigate('/booth-setup'),
                        color: 'bg-pink-600'
                    }
                ]}
            />
        </div>
    );
};

export default OrganizerMobileDashboard;
