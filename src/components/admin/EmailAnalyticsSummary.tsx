import React, { useEffect, useState } from 'react';
import { emailTrackingService, EmailStats } from '../../services/emailTrackingService';
import Card from '../ui/Card';
import { ChartBarIcon, EnvelopeIcon, EnvelopeOpenIcon, CursorArrowRaysIcon, ExclamationTriangleIcon } from '../Icons';

interface EmailAnalyticsSummaryProps {
    eventId: string;
}

export default function EmailAnalyticsSummary({ eventId }: EmailAnalyticsSummaryProps) {
    const [stats, setStats] = useState<EmailStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [eventId]);

    const loadStats = async () => {
        setLoading(true);
        const data = await emailTrackingService.getEmailStats(eventId);
        setStats(data);
        setLoading(false);
    };

    if (loading) return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6"></div>;
    if (!stats) return null;

    const StatCard = ({ label, value, subtext, icon: Icon, color }: any) => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Email Performance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Delivery Rate"
                    value={`${stats.total_delivered > 0 ? Math.round((stats.total_delivered / stats.total_sent) * 100) : 0}%`}
                    subtext={`${stats.total_delivered} / ${stats.total_sent} delivered`}
                    icon={EnvelopeIcon}
                    color="bg-blue-500"
                />
                <StatCard
                    label="Open Rate"
                    value={`${stats.open_rate}%`}
                    subtext={`${stats.total_opened} unique opens`}
                    icon={EnvelopeOpenIcon}
                    color="bg-purple-500"
                />
                <StatCard
                    label="Click Rate"
                    value={`${stats.click_rate}%`}
                    subtext={`${stats.total_clicked} unique clicks`}
                    icon={CursorArrowRaysIcon}
                    color="bg-pink-500"
                />
                <StatCard
                    label="Bounce Rate"
                    value={`${stats.bounce_rate}%`}
                    subtext={`${stats.total_failed} failures`}
                    icon={ExclamationTriangleIcon}
                    color="bg-red-500"
                />
            </div>
        </div>
    );
}
