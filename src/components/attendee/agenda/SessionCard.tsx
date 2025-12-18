import React from 'react';
import { Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Session, Booth } from '../../../types';

interface SessionCardProps {
    registration: any;
    session: Session;
    booth?: Booth;
}

export default function SessionCard({ registration, session, booth }: SessionCardProps) {
    const now = new Date();
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    const isLive = now >= start && now <= end;
    const isPast = now > end;
    const minutesUntil = Math.floor((start.getTime() - now.getTime()) / 60000);
    const isStartingSoon = minutesUntil > 0 && minutesUntil <= 15;

    const statusConfig = {
        'Registered': {
            icon: CheckCircle,
            color: 'text-success-600 dark:text-success-400',
            bgColor: 'bg-success-50 dark:bg-success-900/20',
            label: 'Registered'
        },
        'Attended': {
            icon: CheckCircle,
            color: 'text-success-600 dark:text-success-400',
            bgColor: 'bg-success-50 dark:bg-success-900/20',
            label: 'Attended  ✓'
        },
        'No-Show': {
            icon: XCircle,
            color: 'text-gray-500 dark:text-gray-400',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            label: 'Missed'
        },
    };

    const status = statusConfig[registration.status as keyof typeof statusConfig] || statusConfig.Registered;
    const StatusIcon = status.icon;

    return (
        <div
            className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
        ${isLive
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : isStartingSoon
                        ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/20'
                        : isPast
                            ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-75'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800'
                }
      `}
        >
            {/* LIVE Indicator */}
            {isLive && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                </div>
            )}

            {/* Time Badge */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isStartingSoon && !isLive && (
                            <p className="text-xs text-warning-600 dark:text-warning-400 font-medium">
                                Starting in {minutesUntil} min
                            </p>
                        )}
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-1 px-2 py-1 ${status.bgColor} rounded-full`}>
                    <StatusIcon className={`w-3 h-3 ${status.color}`} />
                    <span className={`text-xs font-medium ${status.color}`}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Session Info */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {session.name}
                </h3>

                {booth && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{booth.companyName} ({booth.physicalId})</span>
                    </div>
                )}
            </div>

            {/* Actions (if needed) */}
            {isStartingSoon && !isLive && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        Get Directions →
                    </button>
                </div>
            )}
        </div>
    );
}
