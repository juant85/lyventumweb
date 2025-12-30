import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../../../contexts/EventDataContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { MobileCard, SpeedDialFAB } from '../index';
import SwipeableCarousel from '../../ui/SwipeableCarousel';
import QuickStatCard from '../../dashboard/QuickStatCard';
import { Calendar, Users, Store, BarChart3 } from 'lucide-react';
import { AppRoute } from '../../../types';

/**
 * Universal Event Management Dashboard for Mobile
 * Used by both SuperAdmin and Organizer when an event is selected
 * Provides access to all core event management features
 */
const EventManagementDashboard: React.FC = () => {
    const { currentEvent } = useSelectedEvent();
    const { sessions, booths, attendees, scans, getOperationalSessionDetails } = useEventData();
    const navigate = useNavigate();

    const liveSession = getOperationalSessionDetails().session;

    // Event-specific stats
    const eventStats = useMemo(() => ({
        sessions: sessions.length,
        booths: booths.length,
        attendees: attendees.length,
        scans: scans.length,
        checkedIn: attendees.filter(a => a.checkInTime).length,
        liveScans: liveSession ? scans.filter(s => s.sessionId === liveSession.id).length : 0
    }), [sessions, booths, attendees, scans, liveSession]);

    if (!currentEvent) {
        return (
            <div className="p-4 text-center">
                <p className="text-slate-500">No event selected</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-24">
            {/* Live Session Banner */}
            {liveSession && (
                <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-green-500/90 to-emerald-500/90 dark:from-green-600/90 dark:to-emerald-600/90 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <span className="text-white font-bold text-xs uppercase tracking-wide">Live Now</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-white text-xs font-semibold">
                                {eventStats.liveScans} scans
                            </span>
                        </div>
                    </div>
                    <h2 className="text-white font-bold text-lg mb-1">{liveSession.name}</h2>
                    <p className="text-white/90 text-sm">
                        {new Date(liveSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(liveSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <button
                        onClick={() => navigate(AppRoute.RealTimeAnalytics)}
                        className="mt-3 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg text-white font-semibold text-sm transition-colors"
                    >
                        View Real-Time Analytics →
                    </button>
                </div>
            )}

            {/* Quick Stats */}
            <div>
                <h2 className="text-lg font-bold mb-3 px-4 text-slate-900 dark:text-white">Event Overview</h2>
                <SwipeableCarousel>
                    <QuickStatCard label="Sessions" value={eventStats.sessions} icon="calendar" color="blue" />
                    <QuickStatCard label="Booths" value={eventStats.booths} icon="store" color="purple" />
                    <QuickStatCard label="Attendees" value={eventStats.attendees} icon="users" color="green" />
                    <QuickStatCard label="Scans" value={eventStats.scans} icon="checkCircle" color="amber" />
                    <QuickStatCard label="Checked In" value={eventStats.checkedIn} icon="checkCircle" color="pink" />
                </SwipeableCarousel>
            </div>

            {/* Quick Actions */}
            <div className="px-4">
                <h2 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    <MobileCard
                        title="Sessions"
                        subtitle={`${eventStats.sessions} configured`}
                        icon={<Calendar className="w-5 h-5 text-blue-600" />}
                        onClick={() => navigate(AppRoute.SessionSettings)}
                    />
                    <MobileCard
                        title="Booths"
                        subtitle={`${eventStats.booths} active`}
                        icon={<Store className="w-5 h-5 text-purple-600" />}
                        onClick={() => navigate(AppRoute.BoothSetup)}
                    />
                    <MobileCard
                        title="Attendees"
                        subtitle={`${eventStats.attendees} registered`}
                        icon={<Users className="w-5 h-5 text-green-600" />}
                        onClick={() => navigate(AppRoute.AttendeeProfiles)}
                    />
                    <MobileCard
                        title="Analytics"
                        subtitle="Real-time data"
                        icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
                        onClick={() => navigate(AppRoute.DataVisualization)}
                    />
                </div>
            </div>

            {/* Speed Dial FAB */}
            <SpeedDialFAB
                actions={[
                    { icon: 'calendar', label: 'New Session', onClick: () => navigate('/sessions/new') },
                    { icon: 'users', label: 'Add Attendee', onClick: () => navigate('/attendees/add') },
                    { icon: 'scan', label: 'Quick Scan', onClick: () => navigate(AppRoute.QRScanner) }
                ]}
            />
        </div>
    );
};

export default EventManagementDashboard;
