import React, { useState, useEffect } from 'react';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { challengeService, ChallengeProgress, ChallengeConfig } from '../../services/challengeService';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { Trophy, CheckCircle, Loader2 } from 'lucide-react';

export default function BoothChallenge() {
    const { currentEvent } = useSelectedEvent();
    const [attendeeData, setAttendeeData] = useState<any>(null);
    const [progress, setProgress] = useState<ChallengeProgress | null>(null);
    const [challengeConfig, setChallengeConfig] = useState<ChallengeConfig | null>(null);
    const [visitedBooths, setVisitedBooths] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const attendeeLogin = localStorage.getItem('attendee_login');
                if (!attendeeLogin || !currentEvent) {
                    setLoading(false);
                    return;
                }

                const loginData = JSON.parse(attendeeLogin);
                setAttendeeData({
                    id: loginData.attendeeId,
                    name: loginData.attendeeName,
                });

                // Load challenge config
                const config = await challengeService.getChallengeConfig(currentEvent.id);
                setChallengeConfig(config);

                if (!config?.challenge_enabled) {
                    setLoading(false);
                    return;
                }

                // Load attendee progress
                const prog = await challengeService.getProgress(
                    loginData.attendeeId,
                    currentEvent.id
                );
                setProgress(prog);

                // Load booth details
                if (prog && prog.visited_booth_ids && prog.visited_booth_ids.length > 0) {
                    const booths = await challengeService.getVisitedBoothDetails(
                        prog.visited_booth_ids,
                        currentEvent.id
                    );
                    setVisitedBooths(booths);
                }
            } catch (e) {
                console.error('[BoothChallenge] Error loading data:', e);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentEvent]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!challengeConfig?.challenge_enabled) {
        return (
            <div className="space-y-6">
                <Alert
                    type="info"
                    message="The Booth Challenge is not currently active for this event."
                />
            </div>
        );
    }

    const targetBooths = progress?.total_agenda_booths || 0;
    const visitedCount = progress?.attended_booths || 0;
    const progressPercent = progress?.progress_percentage || 0;
    const agendaBoothIds = progress?.agenda_booth_ids || [];
    const visitedBoothIds = progress?.visited_booth_ids || [];

    // Get grid size (4x4 = 16 max, 3x4 = 12, 2x4 = 8, etc.)
    const gridCols = 4;
    const gridRows = Math.ceil(targetBooths / gridCols);

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {challengeConfig.challenge_title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {challengeConfig.challenge_description}
                </p>
            </div>

            {targetBooths === 0 ? (
                <Alert
                    type="info"
                    message="You don't have any meetings scheduled yet. Check back once your agenda is confirmed!"
                />
            ) : (
                <>
                    {/* Progress Card */}
                    <Card className="border-2 border-secondary-200 dark:border-secondary-800">
                        <div className="text-center py-6">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Trophy className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
                                <div className="text-5xl font-bold text-secondary-600 dark:text-secondary-400">
                                    {visitedCount}/{targetBooths}
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Meetings attended
                            </p>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                <div
                                    className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-4 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {progressPercent.toFixed(0)}% Complete
                            </p>
                        </div>
                    </Card>

                    {/* Bingo Grid - Your Scheduled Meetings */}
                    <Card title="Your Scheduled Meetings">
                        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                            {agendaBoothIds.map((boothId, i) => {
                                const booth = visitedBooths.find(b => b.id === boothId);
                                const isVisited = visitedBoothIds.includes(boothId);

                                return (
                                    <div
                                        key={boothId || i}
                                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all duration-300 ${isVisited
                                            ? 'bg-secondary-100 dark:bg-secondary-900 border-secondary-500 dark:border-secondary-600 scale-105 shadow-md'
                                            : 'bg-white dark:bg-slate-800 border-dashed border-gray-300 dark:border-slate-600'
                                            }`}
                                    >
                                        {isVisited ? (
                                            <>
                                                <CheckCircle className="w-6 h-6 text-secondary-600 dark:text-secondary-400 mb-1" />
                                                <span className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 text-center">
                                                    {booth?.physical_id || 'Visited'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-6 h-6 rounded-full border-2 border-gray-400 dark:border-gray-500 mb-1" />
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                                                    {booth?.physical_id || `#${i + 1}`}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {visitedCount === targetBooths && targetBooths > 0 && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800 rounded-lg text-center">
                                <p className="text-lg font-bold text-secondary-700 dark:text-secondary-300">
                                    🎉 Congratulations! All Meetings Completed! 🎉
                                </p>
                                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                                    Visit the event desk to claim your prize!
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* How It Works */}
                    <Card title="How it works">
                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <p>📅 Your challenge is based on YOUR scheduled meetings</p>
                            <p>📍 Visit each booth at your scheduled meeting time</p>
                            <p>✅ Get stamped as you check in to each meeting</p>
                            <p>🏆 Complete all your meetings to win prizes!</p>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
