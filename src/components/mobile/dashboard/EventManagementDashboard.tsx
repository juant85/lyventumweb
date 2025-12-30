import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../../../contexts/EventDataContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { MobileCard, SpeedDialFAB } from '../index';
import SwipeableCarousel from '../../ui/SwipeableCarousel';
import QuickStatCard from '../../dashboard/QuickStatCard';
import { Calendar, Users, Store, BarChart3, CheckCircle } from 'lucide-react';
import { AppRoute } from '../../../types';
import { useBoothCapacity } from '../../../hooks/useBoothCapacity';

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
    const { getCapacity } = useBoothCapacity(liveSession?.id || '');

    // Event-specific stats
    const eventStats = useMemo(() => ({
        sessions: sessions.length,
        booths: booths.length,
        attendees: attendees.length,
        scans: scans.length,
        checkedIn: attendees.filter(a => a.checkInTime).length,
        liveScans: liveSession ? scans.filter(s => s.sessionId === liveSession.id).length : 0
    }), [sessions, booths, attendees, scans, liveSession]);

    // Live booth stats (top 4 booths by attendance)
    const liveBoothStats = useMemo(() => {
        if (!liveSession) return [];

        // Get scans for this session
        const sessionScans = scans.filter(s => s.sessionId === liveSession.id);

        // Count unique attendees per booth
        const boothCounts = new Map<string, Set<string>>();
        sessionScans.forEach(scan => {
            const boothId = scan.boothId;
            if (boothId) {
                if (!boothCounts.has(boothId)) {
                    boothCounts.set(boothId, new Set());
                }
                boothCounts.get(boothId)!.add(scan.attendeeId);
            }
        });

        // Build booth status array
        return booths
            .map(booth => {
                const attendeesCount = boothCounts.get(booth.id)?.size || 0;
                const capacityData = getCapacity(booth.id); \n                const capacity = typeof capacityData === 'number' ? capacityData : capacityData.capacity;
                const percentage = capacity > 0 ? (attendeesCount / capacity) * 100 : 0;

                return {
                    id: booth.id,
                    name: booth.companyName,
                    physicalId: booth.physicalId,
                    attendeesCount,
                    capacity,
                    percentage
                };
            })
            .sort((a, b) => b.attendeesCount - a.attendeesCount)
            .slice(0, 4); // Top 4 booths
    }, [liveSession, booths, scans, getCapacity]);

    // Get booth color (matching DataVisualizationPage logic)
    const getBoothColor = (percentage: number, attendeesCount: number) => {
        if (percentage >= 99) {
            return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-300';
        } else if (attendeesCount > 0) {
            return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300';
        } else {
            return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300';
        }
    };

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
                    <p className="text-white/90 text-sm mb-3">
                        {new Date(liveSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(liveSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Live Booth Status Grid */}
                    {liveBoothStats.length > 0 && (
                        <>
                            <div className="border-t border-white/20 pt-3 mb-3">
                                <p className="text-white/80 text-xs font-semibold mb-2 uppercase tracking-wide">Booth Status</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {liveBoothStats.map(booth => (
                                        <div
                                            key={booth.id}
                                            className={`p-2 rounded-lg border ${getBoothColor(booth.percentage, booth.attendeesCount)}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-bold truncate pr-1">{booth.physicalId}</p>
                                                {booth.percentage >= 99 && <span className="text-xs">🟢</span>}
                                                {booth.percentage > 0 && booth.percentage < 99 && <span className="text-xs">🟡</span>}
                                                {booth.attendeesCount === 0 && <span className="text-xs">🔴</span>}
                                            </div>
                                            <p className="text-lg font-bold leading-none">
                                                {booth.attendeesCount}<span className="text-xs opacity-60">/{booth.capacity}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => navigate(AppRoute.RealTimeAnalytics)}
                        className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg text-white font-semibold text-sm transition-colors"
                    >
                        View Full Analytics →
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
                        icon={<Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        onClick={() => navigate(AppRoute.SessionSettings)}
                        className="hover:shadow-lg transition-shadow"
                    />
                    <MobileCard
                        title="Booths Setup"
                        subtitle={`${eventStats.booths} configured`}
                        icon={<Store className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                        onClick={() => navigate(AppRoute.BoothSetup)}
                        className="hover:shadow-lg transition-shadow"
                    />
                    <MobileCard
                        title="Check-In"
                        subtitle="Scan attendees"
                        icon={<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
                        onClick={() => navigate(AppRoute.CheckInDesk)}
                        className="hover:shadow-lg transition-shadow"
                    />
                    <MobileCard
                        title="Attendees"
                        subtitle={`${eventStats.attendees} registered`}
                        icon={<Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                        onClick={() => navigate(AppRoute.AttendeeProfiles)}
                        className="hover:shadow-lg transition-shadow"
                    />
                    <MobileCard
                        title="Analytics"
                        subtitle="Real-time data"
                        icon={<BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                        onClick={() => navigate(AppRoute.DataVisualization)}
                        className="hover:shadow-lg transition-shadow"
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
