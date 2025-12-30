import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { challengeService, ChallengeProgress } from '../../services/challengeService';
import { supabase } from '../../supabaseClient';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import AttendeeBadge from '../../components/AttendeeBadge';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import CircularProgress from '../../components/ui/CircularProgress';
import { Calendar, Target, CheckCircle, MapPin, QrCode, BarChart3 } from 'lucide-react';

export default function AttendeeDashboard() {
    const { getSessionRegistrationsForAttendee } = useEventData();
    const { currentEvent } = useSelectedEvent();
    const [attendeeData, setAttendeeData] = useState<any>(null);
    const [agenda, setAgenda] = useState<any[]>([]);
    const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress | null>(null);
    const [checkInsCount, setCheckInsCount] = useState(0);
    const [liveCountdown, setLiveCountdown] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showChallenge, setShowChallenge] = useState(false);
    const [activeSection, setActiveSection] = useState('badge');

    const badgeRef = useRef<HTMLDivElement>(null);
    const challengeRef = useRef<HTMLDivElement>(null);
    const agendaRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const attendeeLogin = localStorage.getItem('attendee_login');
                if (!attendeeLogin) {
                    setIsLoading(false);
                    return;
                }

                const loginData = JSON.parse(attendeeLogin);

                setAttendeeData({
                    id: loginData.attendeeId,
                    name: loginData.attendeeName || 'Attendee',
                    email: loginData.attendeeEmail,
                    organization: loginData.attendeeOrganization || 'Independent',
                    event_id: loginData.eventId,
                });

                const result = await getSessionRegistrationsForAttendee(loginData.attendeeId);
                if (result.success) {
                    const sorted = (result.data as any[]).sort((a, b) =>
                        new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime()
                    );
                    console.log('[Dashboard] Agenda items sample:', sorted[0]);
                    setAgenda(sorted);
                }

                const progress = await challengeService.getProgress(
                    loginData.attendeeId,
                    loginData.eventId
                );
                setChallengeProgress(progress);

            } catch (e) {
                console.error('[Dashboard] Error:', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [getSessionRegistrationsForAttendee]);

    // Intersection Observer for active section detection
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        [badgeRef, challengeRef, agendaRef, statsRef].forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });

        return () => observer.disconnect();
    }, []);

    // Next session
    const nextSession = useMemo(() => {
        const now = new Date();
        return agenda.find(item => new Date(item.sessionStartTime) > now);
    }, [agenda]);

    // Today's stats
    const todayStats = useMemo(() => {
        const today = new Date().toDateString();
        const todaySessions = agenda.filter(item =>
            new Date(item.sessionStartTime).toDateString() === today
        );
        const completed = todaySessions.filter(item => item.status === 'Attended').length;

        return {
            total: todaySessions.length,
            completed,
            boothsVisited: challengeProgress?.attended_booths || 0
        };
    }, [agenda, challengeProgress]);

    // Live countdown timer
    useEffect(() => {
        if (!nextSession) {
            setLiveCountdown('');
            return;
        }

        const updateCountdown = () => {
            const now = new Date();
            const start = new Date(nextSession.sessionStartTime);
            const diff = start.getTime() - now.getTime();

            if (diff <= 0) {
                setLiveCountdown('Starting now!');
                return;
            }

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            if (hours > 0) {
                setLiveCountdown(`${hours}h ${minutes}m`);
            } else if (minutes > 0) {
                setLiveCountdown(`${minutes}m ${seconds}s`);
            } else {
                setLiveCountdown(`${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextSession]);

    // Group agenda by day for timeline
    const agendaByDay = useMemo(() => {
        const groups: Record<string, any[]> = {};
        agenda.forEach(item => {
            const date = new Date(item.sessionStartTime).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return groups;
    }, [agenda]);

    const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderTimelineItem = (item: any, isLast: boolean) => {
        const startTime = new Date(item.sessionStartTime);
        const endTime = new Date(item.sessionEndTime);
        const isNow = new Date() >= startTime && new Date() <= endTime;
        const isPast = new Date() > endTime;

        return (
            <div key={item.id} className="relative flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 z-10 ${isNow ? 'bg-primary-500 border-primary-500 animate-pulse' : isPast ? 'bg-slate-300 dark:bg-slate-600 border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-700 border-primary-500 dark:border-primary-400'}`}></div>
                    {!isLast && <div className="w-0.5 flex-grow bg-slate-200 dark:bg-slate-700 -my-1"></div>}
                </div>

                {/* Content */}
                <div className={`flex-1 mb-8 ${isPast ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`p-4 rounded-xl border ${isNow
                        ? 'bg-white/90 dark:bg-slate-800/90 border-primary-200 dark:border-primary-700 shadow-md ring-1 ring-primary-100 dark:ring-primary-800'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700 shadow-sm'
                        } backdrop-blur-sm transition-all`}>
                        {/* VENDOR as HERO - Company Name + Booth Badge */}
                        {(item.boothDetails || item.boothName) ? (
                            <div className="mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {item.boothDetails?.companyName || item.boothName || 'Booth'}
                                    </h3>
                                    {(item.boothDetails?.physicalId || item.boothId) && (
                                        <span className="px-2.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-sm font-bold">
                                            #{item.boothDetails?.physicalId || item.boothId}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    {item.sessionName}
                                </p>
                            </div>
                        ) : (
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 line-clamp-2">{item.sessionName}</h3>
                        )}

                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.status === 'Attended'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                }`}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!attendeeData) {
        return <Alert type="error" message="No session found. Please log in again." />;
    }

    return (
        <div className="space-y-6 pb-6">
            {/* QR Badge Section */}
            <div id="badge" ref={badgeRef} className="scroll-mt-4">
                <div className="sticky top-20 z-10 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-lg border border-primary-100 dark:border-slate-600">
                    <div className="relative flex flex-col items-center">
                        <div className="bg-white p-4 rounded-xl shadow-md relative z-10">
                            <AttendeeBadge attendee={attendeeData} />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 text-center font-medium">
                            Tap to show at check-in
                        </p>
                    </div>
                </div>

                {/* Next Session */}
                {nextSession ? (
                    <Card className="border-2 border-primary-200 dark:border-primary-800 shadow-lg mt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary-600" />
                                    Next Session
                                </h2>
                                {liveCountdown && (
                                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold animate-pulse">
                                        {liveCountdown}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {nextSession.sessionName}
                                </p>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">
                                        {new Date(nextSession.sessionStartTime).toLocaleString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                {nextSession.boothName && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm">
                                            {nextSession.boothName} ({nextSession.boothDetails?.physicalId})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="mt-6">
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No upcoming sessions</p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Challenge Section */}
            <div id="challenge" ref={challengeRef} className="scroll-mt-4">
                <Card>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-secondary-600" />
                                Booth Challenge
                            </h2>
                            <button
                                onClick={() => setShowChallenge(!showChallenge)}
                                className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                            >
                                {showChallenge ? 'Hide' : 'View Challenge'}
                            </button>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {todayStats.boothsVisited} meetings attended
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-3 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${challengeProgress?.progress_percentage || 0}%`
                                    }}
                                />
                            </div>
                        </div>

                        {showChallenge && (
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-4 gap-2">
                                    {[...Array(16)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="aspect-square bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center hover:border-primary-400 transition-colors"
                                        >
                                            <span className="text-gray-400 text-sm font-semibold">#{i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                                    Visit booths to collect stamps
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Agenda Section */}
            <div id="agenda" ref={agendaRef} className="scroll-mt-4">
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Your Agenda</h2>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{agenda.length} Sessions</span>
                    </div>

                    {agenda.length > 0 ? (
                        <div className="pl-2">
                            {Object.entries(agendaByDay).map(([date, items]) => (
                                <React.Fragment key={date}>
                                    <div className="sticky top-24 md:top-20 z-10 py-2 bg-white dark:bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                        {date}
                                    </div>
                                    {items.map((item, idx) => renderTimelineItem(item, idx === items.length - 1))}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50 text-slate-300" />
                            <p className="text-slate-500 font-medium">No sessions scheduled</p>
                            <p className="text-xs text-slate-400 mt-1">Check back later</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Stats Section */}
            <div id="stats" ref={statsRef} className="scroll-mt-4">
                <Card title="Today's Summary">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl">
                            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                                {todayStats.completed}/{todayStats.total}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Sessions
                            </div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 rounded-xl">
                            <div className="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mb-1">
                                {todayStats.boothsVisited}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Booths
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
