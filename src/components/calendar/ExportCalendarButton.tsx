// src/components/calendar/ExportCalendarButton.tsx
import React, { useState } from 'react';
import Button from '../ui/Button';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportAttendeeCalendar, downloadICSFile } from '../../lib/calendar/calendar-service';

interface ExportCalendarButtonProps {
    attendeeId: string;
    eventId: string;
    variant?: 'primary' | 'secondary';
    className?: string;
}

export default function ExportCalendarButton({
    attendeeId,
    eventId,
    variant = 'primary',
    className,
}: ExportCalendarButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading('Generating calendar file...');

        try {
            const result = await exportAttendeeCalendar(attendeeId, eventId);

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to export calendar');
            }

            // Download the .ics file
            downloadICSFile(result.data, 'my-event-agenda.ics');

            toast.success('Calendar exported! Import the file to your calendar app.', {
                id: toastId,
                duration: 5000,
            });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export calendar. Please try again.', {
                id: toastId,
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={isExporting}
            variant={variant}
            className={className}
            leftIcon={<Download className="w-4 h-4" />}
        >
            {isExporting ? 'Exporting...' : 'Export All to Calendar'}
        </Button>
    );
}
