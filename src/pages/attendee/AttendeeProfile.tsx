import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import AttendeeBadge from '../../components/AttendeeBadge';

export default function AttendeeProfile() {
    const [attendeeData, setAttendeeData] = useState<any>(null);

    useEffect(() => {
        const attendeeLogin = localStorage.getItem('attendee_login');
        if (attendeeLogin) {
            const data = JSON.parse(attendeeLogin);
            setAttendeeData({
                id: data.attendeeId,
                name: data.attendeeName,
                email: data.attendeeEmail,
                event_id: data.eventId,
            });
        }
    }, []);

    if (!attendeeData) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Your event profile and information
                </p>
            </div>

            <Card title="Your Badge">
                <div className="flex justify-center p-4">
                    <AttendeeBadge attendee={attendeeData} />
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Show this QR code when checking in to sessions or visiting booths
                </p>
            </Card>

            <Card title="Personal Information">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name</label>
                        <p className="text-gray-900 dark:text-white">{attendeeData.name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                        <p className="text-gray-900 dark:text-white">{attendeeData.email}</p>
                    </div>
                </div>
            </Card>

            <Card title="Event Access">
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>✅ Full event access</p>
                    <p>✅ Session registration enabled</p>
                    <p>✅ Booth challenge participation</p>
                    <p>✅ Networking features</p>
                </div>
            </Card>
        </div>
    );
}
