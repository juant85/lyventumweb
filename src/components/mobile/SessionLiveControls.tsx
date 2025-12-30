import React from 'react';
import { Session } from '../../types';
import { Icon } from '../ui/Icon';
import { motion } from 'framer-motion';

interface SessionLiveControlsProps {
    session: Session;
    attendeeCount: number;
    capacity?: number;
    onStart?: () => void;
    onEnd?: () => void;
    disabled?: boolean;
}

const SessionLiveControls: React.FC<SessionLiveControlsProps> = ({
    session,
    attendeeCount,
    capacity,
    onStart,
    onEnd,
    disabled = false
}) => {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);

    const isScheduledToStart = now < startTime;
    const isLive = now >= startTime && now <= endTime;
    const hasEnded = now > endTime;

    const capacityPercentage = capacity ? (attendeeCount / capacity) * 100 : 0;
    const isNearCapacity = capacityPercentage >= 80;
    const isAtCapacity = capacityPercentage >= 100;

    return (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isLive ? (
                        <motion.div
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-sm font-bold">LIVE NOW</span>
                        </motion.div>
                    ) : isScheduledToStart ? (
                        <div className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                            <span className="text-sm font-semibold">Scheduled</span>
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                            <span className="text-sm font-semibold">Ended</span>
                        </div>
                    )}
                </div>

                {/* Attendee Count */}
                <div className="flex items-center gap-2">
                    <Icon name="users" className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-lg text-slate-800 dark:text-white">
                        {attendeeCount}
                    </span>
                    {capacity && (
                        <span className="text-sm text-slate-500">
                            / {capacity}
                        </span>
                    )}
                </div>
            </div>

            {/* Capacity Warning */}
            {capacity && isNearCapacity && !hasEnded && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isAtCapacity
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    }`}>
                    <Icon name="alert" className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                        {isAtCapacity ? 'At Capacity!' : 'Near Capacity'}
                    </span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                {isScheduledToStart && onStart && (
                    <button
                        onClick={onStart}
                        disabled={disabled}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        <Icon name="play" className="w-4 h-4" />
                        Start Session
                    </button>
                )}

                {isLive && onEnd && (
                    <button
                        onClick={onEnd}
                        disabled={disabled}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        <Icon name="stop" className="w-4 h-4" />
                        End Session
                    </button>
                )}

                {hasEnded && (
                    <div className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-semibold text-center">
                        Session Ended
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionLiveControls;
