// src/components/calendar/AddToCalendarDropdown.tsx
import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';
import { getCalendarUrl } from '../../lib/calendar/calendar-links';
import { sessionToCalendarEvent } from '../../lib/calendar/ics-generator';
import { exportSessionCalendar, downloadICSFile } from '../../lib/calendar/calendar-service';
import { CalendarProvider } from '../../lib/calendar/types';

interface AddToCalendarDropdownProps {
    session: {
        id: string;
        name: string;
        startTime: string;
        endTime: string;
        boothName?: string;
    };
    size?: 'sm' | 'md';
}

const CALENDAR_PROVIDERS: Array<{
    provider: CalendarProvider;
    label: string;
    icon: string;
}> = [
        { provider: 'google', label: 'Google Calendar', icon: '📅' },
        { provider: 'outlook', label: 'Outlook', icon: '📧' },
        { provider: 'apple', label: 'Apple/iCal', icon: '🍎' },
    ];

export default function AddToCalendarDropdown({
    session,
    size = 'sm',
}: AddToCalendarDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleProviderClick = async (provider: CalendarProvider) => {
        const calendarEvent = sessionToCalendarEvent({
            id: session.id,
            name: session.name,
            startTime: session.startTime,
            endTime: session.endTime,
            boothName: session.boothName,
        });

        if (provider === 'apple' || provider === 'ical') {
            // Download .ics file for Apple Calendar
            const result = await exportSessionCalendar(session.id);
            if (result.success && result.data) {
                downloadICSFile(result.data, result.filename || 'session.ics');
            }
        } else {
            // Open calendar provider in new tab
            const url = getCalendarUrl(provider, calendarEvent);
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        setIsOpen(false);
    };

    return (
        <div className="relative inline-block">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="secondary"
                size={size}
                className="flex items-center gap-2"
            >
                <Calendar className="w-4 h-4" />
                <span>Add to Calendar</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20">
                        <div className="py-1">
                            {CALENDAR_PROVIDERS.map(({ provider, label, icon }) => (
                                <button
                                    key={provider}
                                    onClick={() => handleProviderClick(provider)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                                >
                                    <span className="text-lg">{icon}</span>
                                    <span className="text-slate-700 dark:text-slate-200">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
