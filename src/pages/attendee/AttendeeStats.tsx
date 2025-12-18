import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import JourneyTimeline from '../../components/journey/JourneyTimeline';
import { useAttendeeJourney } from '../../hooks/useAttendeeJourney';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';

export default function AttendeeStats() {
    const [attendeeData, setAttendeeData] = useState<any>(null);
    const { selectedEventId } = useSelectedEvent();

    useEffect(() => {
        const attendeeLogin = localStorage.getItem('attendee_login');
        if (attendeeLogin) {
            const data = JSON.parse(attendeeLogin);
            setAttendeeData({
                id: data.attendeeId,
                name: data.attendeeName,
            });
        }
    }, []);

    // Use journey hook for real data
    const { events, stats, isLoading } = useAttendeeJourney(
        attendeeData?.id || undefined,
        selectedEventId || undefined
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Stats
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Your event activity and progress
                </p>
            </div>

            {/* Real Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <div className="text-center p-4">
                        <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                            {isLoading ? '...' : stats.sessionsAttended}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Sessions Attended</div>
                    </div>
                </Card>
                <Card>
                    <div className="text-center p-4">
                        <div className="text-4xl font-bold text-secondary-600 dark:text-secondary-400 mb-2">
                            {isLoading ? '...' : stats.boothsVisited}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Booths Visited</div>
                    </div>
                </Card>
                <Card>
                    <div className="text-center p-4">
                        <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                            0
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Connections Made</div>
                    </div>
                </Card>
                <Card>
                    <div className="text-center p-4">
                        <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            0
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Points Earned</div>
                    </div>
                </Card>
            </div>

            {/* Journey Timeline */}
            <Card title="Activity Timeline">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Loading your journey...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Your event journey will appear here</p>
                        <p className="text-sm mt-2">Check in to sessions and visit booths to see your timeline</p>
                    </div>
                ) : (
                    <JourneyTimeline
                        events={events}
                        mode="attendee"
                        maxHeight="32rem"
                        showEmptyState={false}
                    />
                )}
            </Card>

            {/* Achievements - TODO: Connect to achievement system */}
            <Card title="Achievements">
                <div className="grid grid-cols-3 gap-4">
                    {['Early Bird', 'Networker', 'Explorer', 'Learner', 'Champion', 'VIP'].map((badge) => (
                        <div key={badge} className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg opacity-50">
                            <div className="text-3xl mb-2">🏅</div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{badge}</div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
