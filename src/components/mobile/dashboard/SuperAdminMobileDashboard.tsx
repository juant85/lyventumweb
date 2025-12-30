// src/components/mobile/dashboard/SuperAdminMobileDashboard.tsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { useEventData } from '../../../contexts/EventDataContext';
import { MobileCard, SpeedDialFAB, MobileEmptyState } from '../index';
import SwipeableCarousel from '../../ui/SwipeableCarousel';
import QuickStatCard from '../../dashboard/QuickStatCard';
import { Building2, Calendar } from 'lucide-react';
import { AppRoute } from '../../../types';

const SuperAdminMobileDashboard: React.FC = () => {
    const { availableEvents, setSelectedEventId } = useSelectedEvent();
    const { scans, sessions } = useEventData();
    const navigate = useNavigate();

    // Global stats across all events
    const globalStats = useMemo(() => {
        return {
            totalEvents: availableEvents.length,
            activeEvents: availableEvents.filter(e => {
                // Consider an event "active" if it has sessions or scans
                return e.id; // Simplified for now
            }).length,
            totalScans: scans.length,
            totalSessions: sessions.length
        };
    }, [availableEvents, scans, sessions]);

    // Categorize events
    const categorizedEvents = useMemo(() => {
        const active: typeof availableEvents = [];
        const upcoming: typeof availableEvents = [];
        const past: typeof availableEvents = [];

        availableEvents.forEach(event => {
            // For now, just categorize as active (this can be enhanced with date logic)
            active.push(event);
        });

        return { active, upcoming, past };
    }, [availableEvents]);

    const getEventStatusBadge = (event: typeof availableEvents[0]) => {
        // Simple status logic - can be enhanced
        return (
            <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                Active
            </span>
        );
    };

    const handleEventClick = (eventId: string) => {
        setSelectedEventId(eventId); // SELECT event first
        navigate(AppRoute.Dashboard); // Then navigate
    };

    return (
        <div className="space-y-6 pb-28">
            {/* Global Stats Carousel */}
            <div>
                <h2 className="text-lg font-bold mb-3 px-4 text-slate-900 dark:text-white">System Overview</h2>
                <SwipeableCarousel>
                    <QuickStatCard
                        label="Total Events"
                        value={globalStats.totalEvents}
                        icon="checkCircle"
                        color="blue"
                    />
                    <QuickStatCard
                        label="Active Events"
                        value={globalStats.activeEvents}
                        icon="checkCircle"
                        color="green"
                    />
                    <QuickStatCard
                        label="Total Scans"
                        value={globalStats.totalScans}
                        icon="users"
                        color="purple"
                    />
                    <QuickStatCard
                        label="Total Sessions"
                        value={globalStats.totalSessions}
                        icon="store"
                        color="amber"
                    />
                </SwipeableCarousel>
            </div>

            {/* All Events List */}
            <div className="px-4">
                <h2 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">All Events</h2>
                <div className="space-y-3">
                    {categorizedEvents.active.length > 0 ? (
                        categorizedEvents.active.map(event => (
                            <MobileCard
                                key={event.id}
                                title={event.name}
                                subtitle={event.companyName || 'No organization'}
                                icon={Building2}
                                badge={getEventStatusBadge(event)}
                                onClick={() => handleEventClick(event.id)}
                            />
                        ))
                    ) : (
                        <MobileEmptyState
                            icon={<Calendar className="w-12 h-12 text-primary-600" />}
                            title="No Events Yet"
                            description="Create your first event to get started"
                            actionLabel="Create Event"
                            onAction={() => navigate(AppRoute.SuperAdminEvents)}
                        />
                    )}
                </div>
            </div>

            {/* Quick Actions Section */}
            <div className="px-4">
                <h2 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate(AppRoute.SuperAdminEvents)}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-all shadow-sm active:scale-95"
                    >
                        <div className="text-center">
                            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Manage Events</p>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate('/admin/settings')}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-all shadow-sm active:scale-95"
                    >
                        <div className="text-center">
                            <Building2 className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">System Settings</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Speed Dial FAB */}
            <SpeedDialFAB
                actions={[
                    {
                        icon: 'settings',
                        label: 'Settings',
                        onClick: () => navigate('/admin/settings'),
                        color: 'secondary'
                    },
                    {
                        icon: 'calendar',
                        label: 'Manage Events',
                        onClick: () => navigate(AppRoute.SuperAdminEvents),
                        color: 'primary'
                    },
                    {
                        icon: 'plus',
                        label: 'Create Event',
                        onClick: () => navigate(AppRoute.SuperAdminEvents), // Opens modal in Events page
                        color: 'success'
                    }
                ]}
            />
        </div>
    );
};

export default SuperAdminMobileDashboard;
