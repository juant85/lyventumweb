import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Card from '../ui/Card';
import { Mail, Clock, Calendar, TrendingUp, BarChart3 } from 'lucide-react';

interface EmailTypeStats {
    template_type: string;
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
}

interface EmailBreakdownCardProps {
    eventId: string;
}

export default function EmailBreakdownCard({ eventId }: EmailBreakdownCardProps) {
    const [stats, setStats] = useState<EmailTypeStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBreakdown();
    }, [eventId]);

    const loadBreakdown = async () => {
        setLoading(true);
        try {
            // Fetch all email logs and aggregate in TypeScript
            const { data: logs, error } = await supabase
                .from('email_logs')
                .select('template_type, status, delivered_at, opened_at, first_click_at')
                .eq('event_id', eventId);

            if (error) throw error;

            // Group by template_type
            const breakdown: Record<string, EmailTypeStats> = {};

            logs?.forEach(log => {
                const type = log.template_type || 'unknown';

                if (!breakdown[type]) {
                    breakdown[type] = {
                        template_type: type,
                        total_sent: 0,
                        total_delivered: 0,
                        total_opened: 0,
                        total_clicked: 0,
                        delivery_rate: 0,
                        open_rate: 0,
                        click_rate: 0,
                    };
                }

                breakdown[type].total_sent++;
                if (log.delivered_at) breakdown[type].total_delivered++;
                if (log.opened_at) breakdown[type].total_opened++;
                if (log.first_click_at) breakdown[type].total_clicked++;
            });

            // Calculate rates
            Object.values(breakdown).forEach(stat => {
                stat.delivery_rate = stat.total_sent > 0
                    ? Math.round((stat.total_delivered / stat.total_sent) * 100)
                    : 0;
                stat.open_rate = stat.total_delivered > 0
                    ? Math.round((stat.total_opened / stat.total_delivered) * 100)
                    : 0;
                stat.click_rate = stat.total_opened > 0
                    ? Math.round((stat.total_clicked / stat.total_opened) * 100)
                    : 0;
            });

            setStats(Object.values(breakdown));
        } catch (error) {
            console.error('Error loading email breakdown:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTemplateIcon = (type: string) => {
        switch (type) {
            case 'access_code': return <Mail className="h-5 w-5" />;
            case 'session_reminder': return <Clock className="h-5 w-5" />;
            case 'daily_agenda': return <Calendar className="h-5 w-5" />;
            default: return <Mail className="h-5 w-5" />;
        }
    };

    const getTemplateLabel = (type: string) => {
        switch (type) {
            case 'access_code': return 'Access Codes';
            case 'session_reminder': return 'Session Reminders';
            case 'daily_agenda': return 'Daily Agendas';
            default: return type;
        }
    };

    const getEngagementColor = (rate: number) => {
        if (rate >= 70) return 'text-green-600 dark:text-green-400';
        if (rate >= 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                        <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                        <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    </div>
                </div>
            </Card>
        );
    }

    if (stats.length === 0) {
        return (
            <Card className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    No Email Data Yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                    Email breakdown will appear once emails are sent
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    Email Performance by Type
                </h2>
            </div>

            <div className="space-y-4">
                {stats.map((stat) => (
                    <div
                        key={stat.template_type}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {getTemplateIcon(stat.template_type)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                        {getTemplateLabel(stat.template_type)}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {stat.total_sent} sent
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className={`h-5 w-5 ${getEngagementColor(stat.open_rate)}`} />
                                <span className={`text-2xl font-bold ${getEngagementColor(stat.open_rate)}`}>
                                    {stat.open_rate}%
                                </span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Delivery */}
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Delivered</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {stat.total_delivered}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        ({stat.delivery_rate}%)
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${stat.delivery_rate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Opened */}
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Opened</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {stat.total_opened}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        ({stat.open_rate}%)
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${stat.open_rate >= 70 ? 'bg-green-500' :
                                                stat.open_rate >= 40 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                            }`}
                                        style={{ width: `${stat.open_rate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Clicked */}
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Clicked</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {stat.total_clicked}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        ({stat.click_rate}%)
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-pink-500 transition-all duration-300"
                                        style={{ width: `${stat.click_rate}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
