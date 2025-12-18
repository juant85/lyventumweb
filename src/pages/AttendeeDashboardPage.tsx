import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Session, SessionRegistration, Booth, Attendee, AppNotification } from '../types';
import { mapSessionFromDb, mapSessionRegistrationFromDb, mapBoothFromDb, mapAttendeeFromDb } from '../utils/dataMappers';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { PresentationChartLineIcon, ArrowPathIcon, BuildingStorefrontIcon, CogIcon, ChatBubbleLeftRightIcon, BellAlertIcon, BellSlashIcon, UsersGroupIcon, MapIcon, UserIcon } from '../components/Icons';
import AttendeeBadge from '../components/AttendeeBadge';
import { Database, Json } from '../database.types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { useEventData } from '../contexts/EventDataContext';
import { useChat } from '../contexts/ChatContext';
import Button from '../components/ui/Button';
import { urlB64ToUint8Array } from '../utils/pushUtils';

type EnrichedRegistration = SessionRegistration & {
    sessionDetails?: Session;
    boothDetails?: Booth;
};

// @ts-ignore
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

type RegistrationWithRelations = (Database['public']['Tables']['session_registrations']['Row'] & {
    attendees: { name: string; } | null;
    sessions: (Database['public']['Tables']['sessions']['Row'] & {
        session_booth_capacities: Database['public']['Tables']['session_booth_capacities']['Row'][];
    }) | null;
    booths: Database['public']['Tables']['booths']['Row'] | null;
});


const AttendeeDashboardPage = () => {
    const { currentUser } = useAuth();
    const { updateAttendee } = useEventData();
    const { openChatPanel } = useChat();

    const [attendeeProfile, setAttendeeProfile] = useState<Attendee | null>(null);
    const [agenda, setAgenda] = useState<EnrichedRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for notification settings
    const [pushSubscriptionJSON, setPushSubscriptionJSON] = useState<PushSubscriptionJSON | null>(null);
    const [isPushSubscribing, setIsPushSubscribing] = useState(false);

    const qrCodeRef = useRef<HTMLDivElement>(null);
    const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
    const notificationChannelRef = useRef<RealtimeChannel | null>(null);

    const fetchAgendaAndProfile = useCallback(async () => {
        if (!currentUser?.email) {
            console.log("AttendeeDashboard: No current user email found.");
            setLoading(false);
            setError("Could not identify current user. Please try logging in again.");
            return;
        }

        console.log("AttendeeDashboard: Fetching profile for", currentUser.email);

        try {
            const { data: attendeeData, error: attendeeError } = await supabase
                .from('attendees')
                .select('*')
                .eq('email', currentUser.email)
                .single();

            if (attendeeError || !attendeeData) {
                console.error("AttendeeDashboard: Attendee lookup failed", attendeeError);
                throw new Error("Your email is not registered for any events. Please contact the organizer.");
            }

            console.log("AttendeeDashboard: Found attendee profile", attendeeData.id);
            const profile = mapAttendeeFromDb(attendeeData);
            setAttendeeProfile(profile);

            if (profile.push_subscription) {
                setPushSubscriptionJSON(profile.push_subscription as PushSubscriptionJSON | null);
            }

            const attendeeId = profile.id;

            const { data: registrationData, error: registrationError } = await supabase
                .from('session_registrations')
                .select('*, attendees(name), sessions(*, session_booth_capacities(*)), booths!session_registrations_expected_booth_id_fkey(*)')
                .eq('attendee_id', attendeeId)
                .order('start_time', { referencedTable: 'sessions', ascending: true });

            if (registrationError) {
                console.error("AttendeeDashboard: Registration fetch failed", registrationError);
                throw new Error(`Failed to fetch your agenda: ${registrationError.message}`);
            }

            console.log("AttendeeDashboard: Raw registration data", registrationData);

            const enrichedAgenda = ((registrationData as any[]) || []).map((reg) => ({
                ...(mapSessionRegistrationFromDb(reg)),
                sessionDetails: reg.sessions ? mapSessionFromDb(reg.sessions) : undefined,
                boothDetails: reg.booths ? mapBoothFromDb(reg.booths) : undefined,
            }));

            console.log("AttendeeDashboard: Enriched agenda items", enrichedAgenda.length);
            setAgenda(enrichedAgenda);

        } catch (e: any) {
            console.error("AttendeeDashboard: Error in fetchAgendaAndProfile", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.email) {
            setLoading(true);
            fetchAgendaAndProfile();
        }
    }, [currentUser, fetchAgendaAndProfile]);

    // Realtime for Agenda and Notifications
    useEffect(() => {
        if (!attendeeProfile) return;

        // --- Agenda Updates Channel ---
        const agendaChannel = supabase.channel(`attendee-agenda-changes-${attendeeProfile.id}`);
        agendaChannel
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'session_registrations', filter: `attendee_id=eq.${attendeeProfile.id}` },
                () => { toast('Your agenda has been updated.'); fetchAgendaAndProfile(); }
            )
            .subscribe();
        realtimeChannelRef.current = agendaChannel;

        // --- In-App Notifications Channel ---
        const notificationsChannel = supabase.channel(`attendee-notifications-${attendeeProfile.id}`);
        notificationsChannel
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `attendee_id=eq.${attendeeProfile.id}` },
                (payload) => {
                    const newNotification = payload.new as AppNotification;
                    toast.success(newNotification.message, {
                        icon: '🔔',
                        duration: 6000
                    });
                }
            )
            .subscribe();
        notificationChannelRef.current = notificationsChannel;


        return () => {
            if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
            if (notificationChannelRef.current) supabase.removeChannel(notificationChannelRef.current);
        };
    }, [attendeeProfile, fetchAgendaAndProfile]);


    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !attendeeProfile) {
            toast.error("Push notifications are not supported by your browser or you are not logged in.");
            return;
        }
        if (!VAPID_PUBLIC_KEY) {
            toast.error("Push notification key is not configured for this app.");
            console.error("VITE_VAPID_PUBLIC_KEY is not set in environment variables.");
            return;
        }

        setIsPushSubscribing(true);
        const toastId = toast.loading("Subscribing to notifications...");
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) as any,
            });

            const result = await updateAttendee(attendeeProfile.id, { push_subscription: subscription.toJSON() as unknown as Json });

            if (result.success) {
                setPushSubscriptionJSON(subscription.toJSON());
                toast.success("Successfully subscribed to device notifications!", { id: toastId });
            } else {
                await subscription.unsubscribe();
                throw new Error(result.message);
            }

        } catch (err: any) {
            console.error("Failed to subscribe to push notifications:", err);
            toast.error(`Failed to subscribe: ${err.message}`, { id: toastId });
        } finally {
            setIsPushSubscribing(false);
        }
    };

    const unsubscribeFromPush = async () => {
        if (!('serviceWorker' in navigator) || !attendeeProfile) return;

        setIsPushSubscribing(true);
        const toastId = toast.loading("Unsubscribing...");

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const unsubscribed = await subscription.unsubscribe();
                if (!unsubscribed) throw new Error("Browser failed to unsubscribe.");
            }

            const result = await updateAttendee(attendeeProfile.id, { push_subscription: null });

            if (result.success) {
                setPushSubscriptionJSON(null);
                toast.success("Successfully unsubscribed.", { id: toastId });
            } else {
                throw new Error(result.message);
            }
        } catch (err: any) {
            console.error("Failed to unsubscribe from push notifications:", err);
            toast.error(`Failed to unsubscribe: ${err.message}`, { id: toastId });
        } finally {
            setIsPushSubscribing(false);
        }
    };

    // Helper to group agenda by day
    const agendaByDay = useMemo(() => {
        const groups: Record<string, EnrichedRegistration[]> = {};
        agenda.forEach(item => {
            const date = new Date(item.sessionDetails?.startTime || 0).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return groups;
    }, [agenda]);

    const renderTimelineItem = (reg: EnrichedRegistration, isLast: boolean, isFirst: boolean) => {
        const startTime = new Date(reg.sessionDetails?.startTime || 0);
        const endTime = new Date(reg.sessionDetails?.endTime || 0);
        const isNow = new Date() >= startTime && new Date() <= endTime;
        const isPast = new Date() > endTime;

        const sessionType = reg.sessionDetails?.sessionType || 'meeting';
        const isMeeting = sessionType === 'meeting';
        const isPresentation = sessionType === 'presentation';
        const isNetworking = sessionType === 'networking';
        const isBreak = sessionType === 'break';

        // Choose icon base on session type
        let SessionIcon = BuildingStorefrontIcon;
        if (isPresentation) SessionIcon = PresentationChartLineIcon;
        if (isNetworking) SessionIcon = UsersGroupIcon; // Or similar
        if (isBreak) SessionIcon = CogIcon; // Just a placeholder or maybe Coffee icon if we had it

        return (
            <div key={reg.id} className="relative flex gap-2 sm:gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 z-10 ${isNow ? 'bg-primary-500 border-primary-500 animate-pulse' : isPast ? 'bg-slate-300 border-slate-300' : 'bg-white border-primary-500'}`}></div>
                    {!isLast && <div className="w-0.5 flex-grow bg-slate-200 dark:bg-slate-700 -my-1"></div>}
                </div>

                {/* Content */}
                <div className={`flex-1 mb-8 ${isPast ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex items-center text-sm font-medium text-slate-500 mb-1">
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`p-4 rounded-xl border ${isNow ? 'bg-white/90 border-primary-200 shadow-md ring-1 ring-primary-100' : 'bg-white/60 border-slate-100 shadow-sm'} backdrop-blur-sm transition-all`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{reg.sessionDetails?.name}</h3>
                                    {/* Session Type Badge */}
                                    <div className="flex flex-wrap gap-2">
                                        {isPresentation && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit">
                                                <PresentationChartLineIcon className="w-3 h-3" />
                                                CHARLA
                                            </span>
                                        )}
                                        {isNetworking && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit">
                                                <UsersGroupIcon className="w-3 h-3" />
                                                NETWORKING
                                            </span>
                                        )}
                                        {isBreak && (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full w-fit">
                                                PAUSA
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                            {isMeeting && reg.boothDetails && (
                                <div className="flex items-center">
                                    <BuildingStorefrontIcon className="w-4 h-4 mr-2 text-primary-500" />
                                    <span>{reg.boothDetails.companyName} ({reg.boothDetails.physicalId})</span>
                                </div>
                            )}

                            {/* Presentation Details */}
                            {isPresentation && (
                                <>
                                    {reg.sessionDetails?.location && (
                                        <div className="flex items-center">
                                            <MapIcon className="w-4 h-4 mr-2 text-primary-500" />
                                            <span>{reg.sessionDetails.location}</span>
                                        </div>
                                    )}
                                    {reg.sessionDetails?.speaker && (
                                        <div className="flex items-center">
                                            <UserIcon className="w-4 h-4 mr-2 text-primary-500" />
                                            <span>{reg.sessionDetails.speaker}</span>
                                        </div>
                                    )}
                                    {reg.sessionDetails?.description && (
                                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs italic border-l-2 border-purple-300">
                                            {reg.sessionDetails.description}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Networking/Break Description */}
                            {(isNetworking || isBreak) && reg.sessionDetails?.description && (
                                <div className="mt-1 text-xs italic text-slate-500">
                                    {reg.sessionDetails.description}
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${reg.status === 'Attended' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {reg.status}
                                </span>
                            </div>

                            {/* Description for Presentations */}
                            {isPresentation && reg.sessionDetails?.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-700 pt-2 line-clamp-3">
                                    {reg.sessionDetails.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[80vh]">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-500 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="mt-4 text-slate-500 animate-pulse font-medium">Loading your experience...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert type="error" message={error} />
                <Button onClick={() => window.location.reload()} variant="neutral" className="mt-4 w-full">Retry</Button>
            </div>
        );
    }

    if (!attendeeProfile) {
        return <div className="p-4"><Alert type="info" message="Profile not found." /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 pb-24 font-sans">
            {/* Mobile App Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 safe-area-top">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Welcome Back</p>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{attendeeProfile.name}</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={pushSubscriptionJSON ? unsubscribeFromPush : subscribeToPush}
                            disabled={isPushSubscribing}
                            className={`p-2 rounded-full transition-colors ${pushSubscriptionJSON ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'}`}
                        >
                            {isPushSubscribing ? <div className="w-5 h-5 border-2 border-current rounded-full animate-spin border-t-transparent" /> : (pushSubscriptionJSON ? <BellAlertIcon className="w-6 h-6" /> : <BellSlashIcon className="w-6 h-6" />)}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">
                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="!p-0 overflow-hidden relative group cursor-pointer border-0 shadow-sm hover:shadow-md transition-shadow" onClick={() => { qrCodeRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="p-4 flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                <UsersGroupIcon className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">My Badge</span>
                        </div>
                    </Card>
                    <Card className="!p-0 overflow-hidden relative group cursor-pointer border-0 shadow-sm hover:shadow-md transition-shadow" onClick={() => openChatPanel({ boothId: 'attendee-support', isAttendee: true })}>
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="p-4 flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Support</span>
                        </div>
                    </Card>
                </div>

                {/* Badge Card (Collapsible or Prominent) */}
                <div ref={qrCodeRef}>
                    <Card title="Digital Badge" className="glass-card border-0 !bg-gradient-to-br !from-slate-900 !to-slate-800 text-white shadow-xl theme-card">
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <AttendeeBadge attendee={attendeeProfile} qrCodeRef={qrCodeRef} />
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-3">Show this QR code at booths to check in.</p>
                    </Card>
                </div>

                {/* Timeline Agenda */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white font-montserrat">Your Timeline</h2>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{agenda.length} Sessions</span>
                    </div>

                    {agenda.length > 0 ? (
                        <div className="pl-2">
                            {Object.entries(agendaByDay).map(([date, items]) => (
                                <React.Fragment key={date}>
                                    <div className="sticky top-20 z-10 py-2 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                        {date}
                                    </div>
                                    {items.map((item, idx) => renderTimelineItem(item, idx === items.length - 1, idx === 0))}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <PresentationChartLineIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">Your agenda is clear.</p>
                            <p className="text-xs text-slate-400 mt-1">Visit booths to register for sessions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendeeDashboardPage;