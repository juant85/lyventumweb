import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../../../contexts/EventDataContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { MobileCard, SpeedDialFAB } from '../index';
import SwipeableCarousel from '../../ui/SwipeableCarousel';
import QuickStatCard from '../../dashboard/QuickStatCard';
import { Calendar, Users, Store, BarChart3, CheckCircle, RefreshCw } from 'lucide-react';
import { AppRoute } from '../../../types';
import { useBoothCapacity } from '../../../hooks/useBoothCapacity';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import { motion } from 'framer-motion';

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

    // Auto-refresh for live data (only when session is active)
    const { lastUpdated, isRefreshing, manualRefresh } = useAutoRefresh({
        intervalMs: 5000, // Every 5 seconds
        enabled: !!liveSession, // Only during live sessions
        onlyWhenActive: true
    });

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
                const capacity = getCapacity(booth.id); // Returns number directly
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
            {/* Live Session Banner - Modern Design */}
            {liveSession && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mt-4 relative overflow-hidden rounded-3xl shadow-2xl"
                >
                    {/* Gradient Background with Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 dark:from-green-600 dark:via-emerald-600 dark:to-teal-600" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                    {/* Glassmorphism Overlay */}
                    <div className="relative backdrop-blur-sm bg-white/10 p-4">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-2.5 h-2.5 bg-white rounded-full shadow-lg shadow-white/50"
                                />
                                <span className="text-white font-bold text-xs uppercase tracking-wider drop-shadow-md">Live Now</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Scans Badge */}
                                <div className="bg-white/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                    <span className="text-white text-xs font-bold">
                                        {eventStats.liveScans} scans
                                    </span>
                                </div>

                                {/* Refresh Indicator */}
                                <motion.button
                                    onClick={manualRefresh}
                                    animate={isRefreshing ? { rotate: 360 } : {}}
                                    transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                                    className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full border border-white/20 transition-colors"
                                    disabled={isRefreshing}
                                >
                                    <RefreshCw className="w-3.5 h-3.5 text-white" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Session Info */}
                        <h2 className="text-white font-bold text-xl mb-1 drop-shadow-md">{liveSession.name}</h2>
                        <p className="text-white/95 text-sm mb-1 drop-shadow">
                            {new Date(liveSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                            {new Date(liveSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        {/* Auto-refresh indicator */}
                        <p className="text-white/70 text-xs mb-3">
                            {isRefreshing ? (
                                <span className="flex items-center gap-1">
                                    <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>●</motion.span>
                                    Updating...
                                </span>
                            ) : (
                                `Updated ${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago`
                            )}
                        </p>

                        {/* Live Booth Status Grid */}
                        {liveBoothStats.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="border-t border-white/30 pt-3 mb-3"
                            >
                                <p className="text-white/90 text-xs font-bold mb-2 uppercase tracking-wider drop-shadow">Booth Status</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {liveBoothStats.map((booth, index) => (
                                        <motion.div
                                            key={booth.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1 * index }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`p-2.5 rounded-xl border backdrop-blur-sm ${getBoothColor(booth.percentage, booth.attendeesCount)} shadow-lg`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="text-xs font-bold truncate pr-1">{booth.physicalId}</p>
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.3 + (0.1 * index), type: "spring" }}
                                                    className="text-sm"
                                                >
                                                    {booth.percentage >= 99 && '🟢'}
                                                    {booth.percentage > 0 && booth.percentage < 99 && '🟡'}
                                                    {booth.attendeesCount === 0 && '🔴'}
                                                </motion.span>
                                            </div>
                                            <p className="text-xl font-bold leading-none">
                                                {booth.attendeesCount}<span className="text-sm opacity-70">/{booth.capacity}</span>
                                            </p>
                                            {/* Progress bar */}
                                            <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(booth.percentage, 100)}%` }}
                                                    transition={{ delay: 0.4 + (0.1 * index), duration: 0.8, ease: "easeOut" }}
                                                    className="h-full bg-white/80 rounded-full"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* View Full Analytics Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(AppRoute.RealTimeAnalytics)}
                            className="w-full bg-white/25 hover:bg-white/35 backdrop-blur-md py-2.5 rounded-xl text-white font-bold text-sm transition-all border border-white/30 shadow-lg"
                        >
                            View Full Analytics →
                        </motion.button>
                    </div>
                </motion.div>
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
