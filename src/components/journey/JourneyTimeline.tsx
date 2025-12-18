// src/components/journey/JourneyTimeline.tsx
import React from 'react';
import { JourneyEvent } from '../../types';
import { MapPin, Calendar, CheckCircle, Clipboard } from 'lucide-react';
import Card from '../ui/Card';

interface JourneyTimelineProps {
    events: JourneyEvent[];
    mode?: 'admin' | 'attendee';
    maxHeight?: string;
    showEmptyState?: boolean;
}

/**
 * Unified Journey Timeline Component
 * Displays chronological journey of an attendee
 */
export default function JourneyTimeline({
    events,
    mode = 'attendee',
    maxHeight = '24rem',
    showEmptyState = true,
}: JourneyTimelineProps) {

    // Icon mapping based on event type
    const getIcon = (event: JourneyEvent): React.ReactNode => {
        if (event.icon) return event.icon;

        switch (event.type) {
            case 'check-in':
                return <Clipboard className="w-4 h-4" />;
            case 'booth-scan':
                return <MapPin className="w-4 h-4" />;
            case 'session-attendance':
                return <Calendar className="w-4 h-4" />;
            default:
                return <CheckCircle className="w-4 h-4" />;
        }
    };

    // Color mapping based on event type
    const getColorClasses = (type: JourneyEvent['type']): string => {
        switch (type) {
            case 'check-in':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
            case 'booth-scan':
                return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400';
            case 'session-attendance':
                return 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400';
            case 'achievement':
                return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
        }
    };

    // Empty state
    if (events.length === 0 && showEmptyState) {
        return (
            <Card title="📜 Your Journey">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No activity yet. Start scanning booths and attending sessions!</p>
                </div>
            </Card>
        );
    }

    const content = (
        <div className="space-y-4">
            {events.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                    {/* Timeline line */}
                    {index < events.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    )}

                    {/* Icon */}
                    <div
                        className={`
              relative z-10 flex-shrink-0 w-10 h-10 rounded-full 
              flex items-center justify-center
              ${getColorClasses(event.type)}
            `}
                    >
                        {getIcon(event)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {event.title}
                                </h4>
                                {event.subtitle && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                        {event.subtitle}
                                    </p>
                                )}
                            </div>
                            {event.type === 'session-attendance' && (
                                <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                            )}
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {new Date(event.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>

                        {/* Metadata display (admin mode shows more details) */}
                        {mode === 'admin' && event.metadata?.notes && (
                            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic">
                                Note: {event.metadata.notes}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    // Wrap in scrollable container
    return (
        <div
            className="overflow-y-auto"
            style={{ maxHeight }}
        >
            {content}
        </div>
    );
}
