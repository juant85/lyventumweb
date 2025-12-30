// src/components/mobile/dashboard/OrganizerMobileDashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../../../contexts/EventDataContext';
import { MobileCard, MobileFAB, MobileEmptyState } from '../index';
import SwipeableCarousel from '../../ui/SwipeableCarousel';
import QuickStatCard from '../../dashboard/QuickStatCard';
import { Calendar } from 'lucide-react';

const OrganizerMobileDashboard: React.FC = () => {
    const { scans, sessions } = useEventData();
    const navigate = useNavigate();

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
        }).length
    };

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
                        icon="checkCircle"
                        color="purple"
                    />
                    <QuickStatCard
                        label="Active Now"
                        value={overallStats.activeSessions}
                        icon="store"
                        color="amber"
                    />
                </SwipeableCarousel>
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

            {/* FAB */}
            <MobileFAB
                icon="plus"
                onClick={() => navigate('/sessions/new')}
                label="New Session"
            />
        </div>
    );
};

export default OrganizerMobileDashboard;
