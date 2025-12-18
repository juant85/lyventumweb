import React from 'react';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import EmailAnalyticsSummary from '../../components/admin/EmailAnalyticsSummary';
import EmailBreakdownCard from '../../components/admin/EmailBreakdownCard';
import Button from '../../components/ui/Button';
import { Mail, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmailCommunicationsPage() {
    const { selectedEventId } = useSelectedEvent();
    const navigate = useNavigate();

    if (!selectedEventId) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Mail className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        No Event Selected
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        Please select an event to view email communications
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Mail className="h-8 w-8" />
                            Email Communications
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Monitor and analyze your email campaigns and communications
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/email-settings')}
                        variant="secondary"
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Email Settings
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Email Analytics Summary - Reused Component */}
            <EmailAnalyticsSummary eventId={selectedEventId} />

            {/* Email Breakdown by Type - NEW in Phase 2 */}
            <div className="mt-8">
                <EmailBreakdownCard eventId={selectedEventId} />
            </div>
        </div>
    );
}
