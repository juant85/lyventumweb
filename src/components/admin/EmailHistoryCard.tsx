import React, { useState, useEffect } from 'react';
import { emailTrackingService } from '../../services/emailTrackingService';
import Card from '../ui/Card';
import { EmailLog } from '../../types';
import { ArrowPathIcon, ChevronDownIcon, ChevronUpIcon, PaperAirplaneIcon, MagnifyingGlassIcon, FunnelIcon, ArrowUpTrayIcon } from '../Icons';
import EmailStatusBadge from './EmailStatusBadge';

interface EmailHistoryCardProps {
    attendeeId: string;
    eventId: string;
}

export default function EmailHistoryCard({ attendeeId, eventId }: EmailHistoryCardProps) {
    const [history, setHistory] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [resendingId, setResendingId] = useState<string | null>(null);

    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [attendeeId, eventId]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await emailTrackingService.getEmailHistory(attendeeId, eventId);
        setHistory(data);
        setLoading(false);
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const handleResend = async (e: React.MouseEvent, log: EmailLog) => {
        e.stopPropagation(); // Prevent toggling expand

        if (resendingId) return;

        if (!window.confirm(`Are you sure you want to resend "${log.subject}"? This will create a new log entry.`)) {
            return;
        }

        setResendingId(log.id);
        try {
            const result = await emailTrackingService.resendEmail(log);

            if (result.success) {
                // optimizing reload - maybe just append or reload
                await loadHistory();
                // Optionally show a success toast here if toast context existed
            } else {
                window.alert(`Failed to resend: ${result.message}`);
            }
        } catch (err) {
            console.error(err);
            window.alert('An unexpected error occurred');
        } finally {
            setResendingId(null);
        }
    };

    // Filter Logic
    const filteredHistory = history.filter(log => {
        const matchesSearch =
            log.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.templateType.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = statusFilter === 'all' || log.status === statusFilter;

        return matchesSearch && matchesFilter;
    });

    const exportToCSV = () => {
        if (filteredHistory.length === 0) return;

        const headers = ['Date', 'Type', 'Subject', 'Recipient', 'Status', 'Opened', 'Clicked', 'Error'];
        const rows = filteredHistory.map(log => [
            new Date(log.sentAt).toLocaleString(),
            log.templateType,
            `"${log.subject?.replace(/"/g, '""') || ''}"`,
            log.recipientEmail,
            log.status,
            log.openCount || 0,
            log.clickCount || 0,
            `"${log.deliveryError?.replace(/"/g, '""') || ''}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `email_history_${attendeeId}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <Card title="Email History">
                <div className="flex justify-center py-8">
                    <ArrowPathIcon className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            </Card>
        );
    }

    if (history.length === 0) {
        return (
            <Card title="Email History">
                <div className="text-center py-8 text-slate-500">
                    <PaperAirplaneIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No emails sent yet</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Email History" titleActions={
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-1.5 rounded transition-colors ${showFilters ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500'}`}
                    title="Toggle Filters"
                >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={exportToCSV}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                    title="Export to CSV"
                >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={loadHistory}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                    title="Refresh"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                </button>
            </div>
        }>
            {showFilters && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by subject or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="relative min-w-[140px]">
                        <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="sent">Sent</option>
                            <option value="delivered">Delivered</option>
                            <option value="opened">Opened</option>
                            <option value="clicked">Clicked</option>
                            <option value="failed">Failed</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            )}

            <div className="overflow-hidden">
                <div className="space-y-4">
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No emails match your filters
                        </div>
                    ) : (
                        filteredHistory.map((log) => (
                            <div key={log.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800">
                                <div
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/50"
                                    onClick={() => toggleExpand(log.id)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0 bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                                            <PaperAirplaneIcon className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate pr-4">
                                                {log.subject || 'No Subject'}
                                            </h4>
                                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-2">
                                                <span>{new Date(log.sentAt).toLocaleDateString()} at {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>•</span>
                                                <span className="capitalize">{log.templateType.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <EmailStatusBadge status={log.status} />
                                        {expandedIds.has(log.id) ?
                                            <ChevronUpIcon className="w-4 h-4 text-slate-400" /> :
                                            <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                                        }
                                    </div>
                                </div>

                                {expandedIds.has(log.id) && (
                                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/50 text-xs">
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mt-3">
                                            <div>
                                                <span className="block text-slate-400 mb-1">Sent To</span>
                                                <span className="font-mono text-slate-700 dark:text-slate-300">{log.recipientEmail}</span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-400 mb-1">Email ID</span>
                                                <span className="font-mono text-slate-500">{log.id.slice(0, 8)}...</span>
                                            </div>
                                            {(log.openCount ?? 0) > 0 && (
                                                <div>
                                                    <span className="block text-slate-400 mb-1">Engagement</span>
                                                    <div className="flex gap-3">
                                                        <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                                            <span className="font-bold">{log.openCount}</span> Opens
                                                        </span>
                                                        {(log.clickCount ?? 0) > 0 && (
                                                            <span className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400">
                                                                <span className="font-bold">{log.clickCount}</span> Clicks
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {log.deliveryError && (
                                                <div className="col-span-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded p-2 text-red-600 dark:text-red-400">
                                                    <span className="font-bold block mb-0.5">Delivery Error:</span>
                                                    {log.deliveryError}
                                                </div>
                                            )}

                                            {/* Detailed Timeline */}
                                            <div className="col-span-2 space-y-1.5 mt-1 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Sent</span>
                                                    <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(log.sentAt).toLocaleString()}</span>
                                                </div>
                                                {log.deliveredAt && (
                                                    <div className="flex justify-between">
                                                        <span className="text-green-600 dark:text-green-500">Delivered</span>
                                                        <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(log.deliveredAt).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {log.openedAt && (
                                                    <div className="flex justify-between">
                                                        <span className="text-purple-600 dark:text-purple-500">First Opened</span>
                                                        <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(log.openedAt).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {log.lastOpenedAt && log.lastOpenedAt !== log.openedAt && (
                                                    <div className="flex justify-between">
                                                        <span className="text-purple-600/70 dark:text-purple-500/70">Last Opened</span>
                                                        <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(log.lastOpenedAt).toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Resend Action */}
                                            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-end">
                                                {log.templateType === 'access_code' && (
                                                    <button
                                                        onClick={(e) => handleResend(e, log)}
                                                        disabled={!!resendingId}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                    >
                                                        {resendingId === log.id ? (
                                                            <>
                                                                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PaperAirplaneIcon className="w-3.5 h-3.5" />
                                                                Resend Email
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
}
