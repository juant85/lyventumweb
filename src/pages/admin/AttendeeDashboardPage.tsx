import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { Session, SessionRegistration, Booth, Attendee, AppNotification } from '../../types';
import { mapSessionFromDb, mapSessionRegistrationFromDb, mapBoothFromDb, mapAttendeeFromDb } from '../../utils/dataMappers';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { PresentationChartLineIcon, ArrowPathIcon, BuildingStorefrontIcon, CogIcon, ChatBubbleLeftRightIcon, BellAlertIcon, BellSlashIcon, StarIcon } from '../../components/Icons';
import AttendeeBadge from '../../components/AttendeeBadge';
import { Database, Json } from '../../database.types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { useEventData } from '../../contexts/EventDataContext';
import { useChat } from '../../contexts/ChatContext';
import Button from '../../components/ui/Button';
import { urlB64ToUint8Array } from '../../utils/pushUtils';

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
            setLoading(false);
            setError("Could not identify current user. Please try logging in again.");
            return;
        }

        try {
            const { data: attendeeData, error: attendeeError } = await supabase
                .from('attendees')
                .select('*')
                .eq('email', currentUser.email)
                .single();

            if (attendeeError || !attendeeData) {
                throw new Error("Your email is not registered for any events. Please contact the organizer.");
            }

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
                throw new Error(`Failed to fetch your agenda: ${registrationError.message}`);
            }

            const enrichedAgenda = ((registrationData as any[]) || []).map((reg) => ({
                ...(mapSessionRegistrationFromDb(reg)),
                sessionDetails: reg.sessions ? mapSessionFromDb(reg.sessions) : undefined,
                boothDetails: reg.booths ? mapBoothFromDb(reg.booths) : undefined,
            }));

            setAgenda(enrichedAgenda);

        } catch (e: any) {
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
                applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <ArrowPathIcon className="w-8 h-8 mx-auto text-primary-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return <Alert type="error" message={error} />;
    }

    if (!attendeeProfile) {
        return <Alert type="info" message="No attendee profile found for your account." />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-montserrat">
                Welcome, {attendeeProfile.name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-1 space-y-6">
                    <Card title="Your Badge" bodyClassName="!p-2">
                        <AttendeeBadge attendee={attendeeProfile} qrCodeRef={qrCodeRef} />
                    </Card>
                    <Card title="Notification Settings" icon={<CogIcon className="w-6 h-6" />}>
                        {pushSubscriptionJSON ? (
                            <Button
                                variant="accent"
                                onClick={unsubscribeFromPush}
                                disabled={isPushSubscribing}
                                leftIcon={<BellSlashIcon className="w-5 h-5" />}
                            >
                                {isPushSubscribing ? 'Processing...' : 'Disable Notifications'}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={subscribeToPush}
                                disabled={isPushSubscribing}
                                leftIcon={<BellAlertIcon className="w-5 h-5" />}
                            >
                                {isPushSubscribing ? 'Processing...' : 'Enable Notifications'}
                            </Button>
                        )}
                        <p className="text-xs text-slate-500 mt-2">Get reminders for your upcoming meetings.</p>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card title="My Agenda">
                        {agenda.length > 0 ? (
                            <ul className="space-y-4">
                                {agenda.map(reg => (
                                    <li key={reg.id} className="flex items-start space-x-4">
                                        <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${reg.status === 'Attended' ? 'bg-green-100' : 'bg-blue-100'}`}>
                                            <PresentationChartLineIcon className={`h-6 w-6 ${reg.status === 'Attended' ? 'text-green-600' : 'text-blue-600'}`} />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{reg.sessionDetails?.name}</p>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${reg.status === 'Attended' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{reg.status}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {new Date(reg.sessionDetails?.startTime || 0).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {reg.boothDetails && (
                                                <div className="mt-2 flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                    <BuildingStorefrontIcon className="w-4 h-4 mr-2 text-slate-400" />
                                                    <span>Location: <strong>{reg.boothDetails.companyName} ({reg.boothDetails.physicalId})</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-slate-400 text-center p-4">Your agenda is empty. Please contact an organizer if you believe this is an error.</p>
                        )}
                    </Card>
                    <Card title="Need Assistance?">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            If you have questions about your schedule or need technical support, you can open a chat with an event supervisor.
                        </p>
                        <Button
                            onClick={() => openChatPanel({ boothId: 'attendee-support', isAttendee: true })}
                            leftIcon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
                        >
                            Chat with Supervisor
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AttendeeDashboardPage;