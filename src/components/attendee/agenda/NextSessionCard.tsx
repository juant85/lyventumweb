import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, Navigation } from 'lucide-react';
import { Session, Booth } from '../../../types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';

interface NextSessionCardProps {
    session: Session;
    booth?: Booth;
}

export default function NextSessionCard({ session, booth }: NextSessionCardProps) {
    const [timeRemaining, setTimeRemaining] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const start = new Date(session.startTime);
            const diff = start.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeRemaining('In progress');
                setIsUrgent(false);
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;

            setIsUrgent(minutes <= 15);

            if (hours > 0) {
                setTimeRemaining(`Starts in ${hours}h ${mins}m`);
            } else if (mins > 0) {
                setTimeRemaining(`Starts in ${mins} minute${mins > 1 ? 's' : ''}`);
            } else {
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeRemaining(`Starting now! (${secs}s)`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [session.startTime]);

    const handleAddToCalendar = () => {
        // Generate ICS file
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${new Date(session.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(session.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${session.name}
DESCRIPTION:${booth ? `Location: ${booth.companyName} (${booth.physicalId})` : ''}
LOCATION:${booth?.companyName || 'TBD'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${session.name}.ics`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card
            className="border-l-4 border-primary-600 relative overflow-hidden"
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-slate-800 opacity-50" />

            <div className="relative space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wide">
                            📍 Next Session
                        </p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                            {session.name}
                        </h3>
                    </div>
                    <Clock className={`w-5 h-5 ${isUrgent ? 'text-orange-600 animate-pulse' : 'text-primary-600'}`} />
                </div>

                {/* Countdown */}
                <div className={`text-2xl font-bold ${isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-primary-600 dark:text-primary-400'}`}>
                    {timeRemaining}
                </div>

                {/* Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>
                            {new Date(session.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                    {booth && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{booth.companyName} ({booth.physicalId})</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Calendar className="w-4 h-4" />}
                        onClick={handleAddToCalendar}
                        className="flex-1"
                    >
                        Add to Calendar
                    </Button>
                    {booth && (
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Navigation className="w-4 h-4" />}
                            className="flex-1"
                        >
                            Directions
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
