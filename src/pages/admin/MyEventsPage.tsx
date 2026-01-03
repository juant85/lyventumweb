// src/pages/admin/MyEventsPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { supabase } from '../../supabaseClient';
import { Event, AppRoute } from '../../types';
import { Icon } from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion } from 'framer-motion';
import { ClockIcon, MapIcon, BuildingStorefrontIcon, UsersGroupIcon, PlusCircleIcon, CheckCircleIcon } from '../../components/Icons';
import WizardModal, { WizardStep } from '../../components/ui/WizardModal';
import { Database } from '../../database.types';

type PlanRow = Database['public']['Tables']['plans']['Row'];

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    vendor_meetings: { label: 'Vendor Meetings', icon: '💼', color: 'bg-blue-100 text-blue-700' },
    conference: { label: 'Conference', icon: '🎤', color: 'bg-purple-100 text-purple-700' },
    trade_show: { label: 'Trade Show', icon: '🏢', color: 'bg-green-100 text-green-700' },
    hybrid: { label: 'Hybrid Event', icon: '🔄', color: 'bg-orange-100 text-orange-700' },
};

const MyEventsPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { setSelectedEventId } = useSelectedEvent();
    const isMobile = useIsMobile();

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [organizerCounts, setOrganizerCounts] = useState<Record<string, number>>({});

    // Create Event Wizard State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [newEventName, setNewEventName] = useState('');
    const [newEventType, setNewEventType] = useState('vendor_meetings');
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [availablePlans, setAvailablePlans] = useState<PlanRow[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const isSuperAdmin = currentUser?.role === 'superadmin';

    useEffect(() => {
        const fetchOrganizerEvents = async () => {
            if (!currentUser) return;

            setLoading(true);
            setError(null);

            try {
                // Fetch events where user has organizer role via event_users table
                // or is the owner via profiles.managed_event_id
                const { data: organizerLinks, error: linkError } = await supabase
                    .from('event_users')
                    .select('event_id')
                    .eq('user_id', currentUser.id);

                let eventIds: string[] = [];

                if (organizerLinks && organizerLinks.length > 0) {
                    eventIds = organizerLinks.map(link => link.event_id);
                }

                // For now, also fetch events the user might be admin of
                // This handles legacy scenarios where event_users table might not be fully populated
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('managed_event_id')
                    .eq('id', currentUser.id)
                    .single();

                if (profileData?.managed_event_id) {
                    eventIds.push(profileData.managed_event_id);
                }

                // Remove duplicates
                eventIds = [...new Set(eventIds)];

                if (eventIds.length === 0) {
                    // No events found via organizer links, try to get all active events for admin/superadmin
                    if (['admin', 'superadmin'].includes(currentUser.role)) {
                        const { data: allEvents, error: allError } = await supabase
                            .from('events')
                            .select('*')
                            .eq('is_active', true)
                            .order('start_date', { ascending: false });

                        if (allError) throw allError;
                        setEvents(allEvents || []);
                    } else {
                        setEvents([]);
                    }
                } else {
                    // Fetch the actual events
                    const { data: eventsData, error: eventsError } = await supabase
                        .from('events')
                        .select('*')
                        .in('id', eventIds)
                        .eq('is_active', true)
                        .order('start_date', { ascending: false });

                    if (eventsError) throw eventsError;
                    setEvents(eventsData || []);

                    // Fetch organizer counts for team badges
                    if (eventsData && eventsData.length > 0) {
                        const { data: countData } = await supabase
                            .from('event_users')
                            .select('event_id')
                            .in('event_id', eventsData.map(e => e.id));

                        if (countData) {
                            const counts: Record<string, number> = {};
                            countData.forEach(item => {
                                counts[item.event_id] = (counts[item.event_id] || 0) + 1;
                            });
                            setOrganizerCounts(counts);
                        }
                    }
                }
            } catch (err: any) {
                console.error('Error fetching organizer events:', err);
                setError(err.message || 'Failed to load events');
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizerEvents();
    }, [currentUser]);

    const handleSelectEvent = (eventId: string) => {
        setSelectedEventId(eventId);
        navigate(AppRoute.Dashboard);
    };

    // Fetch available plans for the wizard
    useEffect(() => {
        const fetchPlans = async () => {
            const { data } = await supabase
                .from('plans')
                .select('*')
                .order('name', { ascending: true });
            if (data) {
                setAvailablePlans(data);
                // Auto-select first plan if available
                if (data.length > 0 && !selectedPlanId) {
                    setSelectedPlanId(data[0].id);
                }
            }
        };
        fetchPlans();
    }, []);

    // Wizard steps configuration
    const wizardSteps: WizardStep[] = [
        { title: 'Event Info', description: 'Basic event details' },
        { title: 'Select Plan', description: 'Choose feature package' }
    ];

    // Create event handler
    const handleCreateEvent = async () => {
        if (!newEventName.trim()) {
            setCreateError('Event name is required');
            return;
        }

        setIsCreating(true);
        setCreateError(null);

        try {
            const { data, error: insertError } = await supabase
                .from('events')
                .insert({
                    name: newEventName.trim(),
                    is_active: true,
                    created_by_user_id: currentUser?.id,
                    plan_id: selectedPlanId
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Refresh events list
            setIsWizardOpen(false);
            setNewEventName('');
            setNewEventType('vendor_meetings');
            setSelectedPlanId(availablePlans[0]?.id || null);
            setWizardStep(0);

            // Navigate to the new event
            if (data?.id) {
                setSelectedEventId(data.id);
                navigate(AppRoute.Dashboard);
            }
        } catch (err: any) {
            console.error('Error creating event:', err);
            setCreateError(err.message || 'Failed to create event');
        } finally {
            setIsCreating(false);
        }
    };

    const openWizard = () => {
        setIsWizardOpen(true);
        setWizardStep(0);
        setNewEventName('');
        setSelectedPlanId(availablePlans[0]?.id || null);
        setCreateError(null);
    };

    const formatDateRange = (start?: string | null, end?: string | null): string => {
        if (!start) return 'Dates TBD';
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : null;
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        if (endDate && startDate.toDateString() !== endDate.toDateString()) {
            return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
        }
        return startDate.toLocaleDateString('en-US', options);
    };

    const getEventTypeInfo = (eventType?: string) => {
        return EVENT_TYPE_LABELS[eventType || 'vendor_meetings'] || EVENT_TYPE_LABELS.vendor_meetings;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading your events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${isMobile ? 'pb-24' : ''}`}>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <Icon name="calendar" className="w-8 h-8 text-primary-600" />
                            My Events
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Select an event to manage. {events.length > 0 ? `You have access to ${events.length} event${events.length > 1 ? 's' : ''}.` : ''}
                        </p>
                    </div>
                    {isSuperAdmin && (
                        <Button variant="primary" onClick={openWizard} className="whitespace-nowrap">
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Create Event
                        </Button>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                        <p className="font-medium">Error loading events</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && events.length === 0 && (
                    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <Icon name="calendar" className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Events Found</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                            You don't have any events assigned to you yet. Contact your administrator to get access to events.
                        </p>
                    </div>
                )}

                {/* Events Grid */}
                {events.length > 0 && (
                    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {events.map((event, index) => {
                            const typeInfo = getEventTypeInfo(event.eventType);
                            return (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group"
                                >
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600">
                                        {/* Card Header with gradient */}
                                        <div className="h-24 bg-gradient-to-br from-primary-500 to-primary-700 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                                            {event.eventLogoUrl && (
                                                <img
                                                    src={event.eventLogoUrl}
                                                    alt={event.name}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                                                />
                                            )}
                                            <div className="absolute bottom-3 left-4 right-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                    {typeInfo.icon} {typeInfo.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">
                                                {event.name}
                                            </h3>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <ClockIcon className="w-4 h-4 flex-shrink-0" />
                                                    <span>{formatDateRange(event.startDate, event.endDate)}</span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <MapIcon className="w-4 h-4 flex-shrink-0" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                                {/* Team Badge */}
                                                {organizerCounts[event.id] && organizerCounts[event.id] > 0 && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <UsersGroupIcon className="w-4 h-4 flex-shrink-0" />
                                                        <span>{organizerCounts[event.id]} team member{organizerCounts[event.id] > 1 ? 's' : ''}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                onClick={() => handleSelectEvent(event.id)}
                                                className="w-full"
                                                variant="primary"
                                            >
                                                Select Event
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Event Wizard Modal */}
            <WizardModal
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                title="Create New Event"
                steps={wizardSteps}
                currentStep={wizardStep}
                onNext={() => setWizardStep(s => Math.min(s + 1, wizardSteps.length - 1))}
                onBack={() => setWizardStep(s => Math.max(s - 1, 0))}
                onFinish={handleCreateEvent}
                isLoading={isCreating}
                canProceed={wizardStep === 0 ? !!newEventName.trim() : !!selectedPlanId}
                finishLabel="Create Event"
            >
                {wizardStep === 0 && (
                    <div className="space-y-6">
                        {/* Event Name Input */}
                        <div>
                            <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Event Name *
                            </label>
                            <input
                                type="text"
                                id="eventName"
                                value={newEventName}
                                onChange={(e) => setNewEventName(e.target.value)}
                                placeholder="Enter event name..."
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                autoFocus
                            />
                        </div>

                        {/* Event Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Event Type
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(EVENT_TYPE_LABELS).map(([key, { label, icon, color }]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setNewEventType(key)}
                                        className={`p-3 rounded-lg border-2 transition-all text-left ${newEventType === key
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        <span className="text-xl mr-2">{icon}</span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {wizardStep === 1 && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Select a plan to determine which features will be available for this event.
                        </p>

                        {availablePlans.length === 0 ? (
                            <div className="p-6 text-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <Icon name="settings" className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                <p className="text-slate-500 dark:text-slate-400">
                                    No plans available. Contact your administrator.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {availablePlans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${selectedPlanId === plan.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-semibold text-slate-800 dark:text-white">
                                                {plan.name}
                                            </div>
                                            {plan.description && (
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    {plan.description}
                                                </div>
                                            )}
                                        </div>
                                        {selectedPlanId === plan.id && (
                                            <CheckCircleIcon className="w-6 h-6 text-primary-500 flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {createError && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                        {createError}
                    </div>
                )}
            </WizardModal>
        </div>
    );
};

export default MyEventsPage;
