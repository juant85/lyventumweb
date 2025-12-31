import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../../../contexts/EventDataContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { motion } from 'framer-motion';
import { Calendar, Users, Store, CheckCircle, Activity, FileText, UserMinus, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { AppRoute, SessionRegistration } from '../../../types';
import SpeedDialFAB from '../SpeedDialFAB';
import SwipeableCarousel from '../../ui/SwipeableCarousel';
import QuickStatCard from '../../dashboard/QuickStatCard';
import MobileCard from '../MobileCard';
import Button from '../../ui/Button';
import { useBoothCapacity } from '../../../hooks/useBoothCapacity';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';

/**
 * Universal Event Management Dashboard for Mobile
 * Used by both SuperAdmin and Organizer when an event is selected
 * Provides access to all core event management features
 */
const EventManagementDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { currentEvent } = useSelectedEvent();
    const { sessions, booths, attendees, scans, getOperationalSessionDetails, getSessionRegistrationsForSession, getBoothById } = useEventData();

    const liveSession = useMemo(() => {
        const details = getOperationalSessionDetails();
        return details.session;
    }, [getOperationalSessionDetails]);

    const [sessionRegistrations, setSessionRegistrations] = useState<(SessionRegistration & { boothName?: string })[]>([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);

    // Load registrations for live session
    useEffect(() => {
        if (liveSession?.id) {
            setLoadingRegistrations(true);
            getSessionRegistrationsForSession(liveSession.id)
                .then(result => {
                    if (result.success) {
                        setSessionRegistrations(result.data);
                    }
                })
                .finally(() => setLoadingRegistrations(false));
        } else {
            setSessionRegistrations([]);
        }
    }, [liveSession, getSessionRegistrationsForSession]);
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
        <div className="space-y-4 pb-28">
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
                                            className={`p - 2.5 rounded - xl border backdrop - blur - sm ${getBoothColor(booth.percentage, booth.attendeesCount)} shadow - lg`}
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
                                                    animate={{ width: `${Math.min(booth.percentage, 100)}% ` }}
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

            {/* Desktop Parity Features - Only show when live session active */}
            {liveSession && sessionRegistrations.length > 0 && (
                <div className="px-4 space-y-4">
                    {/* Meeting Completion Gauge */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Meeting Completion</h3>
                        </div>
                        <div className="flex items-center justify-center py-4">
                            <div className="relative w-32 h-32">
                                <svg className="transform -rotate-90 w-32 h-32">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-slate-200 dark:text-slate-700"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={2 * Math.PI * 56}
                                        strokeDashoffset={2 * Math.PI * 56 * (1 - (sessionRegistrations.filter(r => r.status === 'Attended').length / sessionRegistrations.length))}
                                        className="text-primary-500 transition-all duration-1000"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {Math.round((sessionRegistrations.filter(r => r.status === 'Attended').length / sessionRegistrations.length) * 100)}%
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Complete</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                            {sessionRegistrations.filter(r => r.status === 'Attended').length} of {sessionRegistrations.length} attendees checked in
                        </p>
                    </div>

                    {/* MIA (Missing In Action) Attendees */}
                    {(() => {
                        const miaAttendees = sessionRegistrations.filter(r => r.status === 'Registered' && r.expectedBoothId);
                        return miaAttendees.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <UserMinus className="w-5 h-5 text-amber-500" />
                                    <h3 className="font-bold text-slate-900 dark:text-white">Missing Attendees ({miaAttendees.length})</h3>
                                </div>
                                <div className="space-y-2">
                                    {miaAttendees.slice(0, 5).map(reg => (
                                        <motion.div
                                            key={reg.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate(`/attendee-profiles/${reg.attendeeId}`)}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 dark:text-white truncate">{reg.attendeeName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Expected at: {getBoothById(reg.expectedBoothId!)?.companyName || 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="text-xs text-primary-600 dark:text-primary-400 font-medium ml-2">View</div>
                                        </motion.div>
                                    ))}
                                    {miaAttendees.length > 5 && (
                                        <p className="text-center text-sm text-slate-500 pt-2">
                                            +{miaAttendees.length - 5} more missing
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Booth Leaderboard */}
                    {liveBoothStats.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <h3 className="font-bold text-slate-900 dark:text-white">Top Booths</h3>
                            </div>
                            <div className="space-y-2">
                                {liveBoothStats.map((booth, index) => (
                                    <div
                                        key={booth.id}
                                        className="flex items-center gap-3 p-2"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">{booth.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Booth {booth.physicalId}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-primary-600 dark:text-primary-400">{booth.attendeesCount}</p>
                                            <p className="text-xs text-slate-500">/{booth.capacity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions - Modern Premium Design */}
            <div className="px-4">
                <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                    {/* Sessions */}
                    <motion.div
                        drag={false}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, duration: 0.3 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(AppRoute.SessionSettings)}
                        className="relative group cursor-pointer"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity" />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Sessions</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{eventStats.sessions} configured</p>
                        </div>
                    </motion.div>

                    {/* Booths Setup */}
                    <motion.div
                        drag={false}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(AppRoute.BoothSetup)}
                        className="relative group cursor-pointer"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity" />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Booths Setup</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{eventStats.booths} configured</p>
                        </div>
                    </motion.div>

                    {/* Check-In */}
                    <motion.div
                        drag={false}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(AppRoute.CheckInDesk)}
                        className="relative group cursor-pointer"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity" />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Check-In</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Scan attendees</p>
                        </div>
                    </motion.div>

                    {/* Attendees */}
                    <motion.div
                        drag={false}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.10, duration: 0.3 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(AppRoute.AttendeeProfiles)}
                        className="relative group cursor-pointer"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity" />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Attendees</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{eventStats.attendees} registered</p>
                        </div>
                    </motion.div>

                    {/* Live Monitor */}
                    <motion.div
                        drag={false}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(AppRoute.RealTimeAnalytics)}
                        className="relative group cursor-pointer"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity" />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Live Monitor</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {liveSession ? 'Real-time data' : 'No live session'}
                            </p>
                        </div>
                    </motion.div>

                    {/* Session Reports */}
                    <motion.div
                        drag={false}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(AppRoute.DataVisualization)}
                        className="relative group cursor-pointer"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity" />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Reports</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Session analysis</p>
                        </div>
                    </motion.div>
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
