// src/components/dashboard/SessionCountdown.tsx
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Session } from '../../types';

interface SessionCountdownProps {
    session: Session;
}

const SessionCountdown: React.FC<SessionCountdownProps> = ({ session }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isEnding, setIsEnding] = useState(false);

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const endTime = new Date(session.endTime);
            const diff = endTime.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Session ended');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Alert if less than 15 minutes remaining
            setIsEnding(diff < 15 * 60 * 1000);

            if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m remaining`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s remaining`);
            } else {
                setTimeLeft(`${seconds}s remaining`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [session.endTime]);

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isEnding
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
            }`}>
            {isEnding ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            ) : (
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            )}
            <span className={`text-sm font-semibold ${isEnding
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                {timeLeft}
            </span>
        </div>
    );
};

export default SessionCountdown;
