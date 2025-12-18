import React, { useState, useEffect } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { accessCodeService } from '../../services/accessCodeService';
import { emailTrackingService, EmailTrackingStatus } from '../../services/emailTrackingService';
import { toast } from 'react-hot-toast';
import { PaperAirplaneIcon, ArrowPathIcon } from '../../components/Icons';
import { Attendee } from '../../types';

export default function AccessCodesManagementPage() {
    const { attendees, loadingData } = useEventData();
    const { selectedEventId } = useSelectedEvent();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [trackingMap, setTrackingMap] = useState<Map<string, EmailTrackingStatus>>(new Map());
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'sent' | 'not_sent' | 'opened' | 'failed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingTracking, setIsLoadingTracking] = useState(true);

    useEffect(() => {
        loadTracking();
    }, [selectedEventId]);

    async function loadTracking() {
        if (!selectedEventId) return;
        setIsLoadingTracking(true);
        const map = await emailTrackingService.getBulkTrackingStatus(selectedEventId);
        setTrackingMap(map);
        setIsLoadingTracking(false);
    }

    const handleSelectAll = () => {
        if (selected.size === filteredAttendees.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filteredAttendees.map(a => a.id)));
        }
    };

    const handleBulkSend = async () => {
        if (selected.size === 0) {
            toast.error('No attendees selected');
            return;
        }

        const confirmed = confirm(`Send access code emails to ${selected.size} attendees?`);
        if (!confirmed) return;

        setLoading(true);
        const toastId = toast.loading(`Sending to ${selected.size} attendees...`);

        const attendeesToSend = attendees
            .filter(a => selected.has(a.id) && a.email && selectedEventId)
            .map(a => ({ attendeeId: a.id, email: a.email, eventId: selectedEventId! }));

        const result = await accessCodeService.bulkCreateAndSendCodes(attendeesToSend);

        if (result.success > 0) {
            toast.success(`✅ Successfully sent: ${result.success}`, { id: toastId });
        }
        if (result.failed > 0) {
            toast.error(`❌ Failed: ${result.failed}`, { id: toastId });
            console.error('Send errors:', result.errors);
        }

        setLoading(false);
        setSelected(new Set());

        // Reload tracking data
        setTimeout(() => loadTracking(), 2000);
    };

    const nonVendorAttendees = attendees.filter(a => !a.is_vendor);

    const filteredAttendees = nonVendorAttendees.filter(a => {
        // Apply filter
        const tracking = trackingMap.get(a.id);
        if (filter === 'sent' && !tracking) return false;
        if (filter === 'not_sent' && tracking) return false;
        if (filter === 'opened' && (!tracking || (tracking.status !== 'opened' && tracking.status !== 'clicked'))) return false;
        if (filter === 'failed' && (!tracking || tracking.status !== 'failed')) return false;

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                a.name.toLowerCase().includes(query) ||
                a.email.toLowerCase().includes(query) ||
                a.organization.toLowerCase().includes(query)
            );
        }

        return true;
    });

    function getStatusBadge(attendeeId: string) {
        const tracking = trackingMap.get(attendeeId);
        if (!tracking) {
            return <span className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Not Sent</span>;
        }

        const statusConfig = {
            sent: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: '📤', label: 'Sent' },
            delivered: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: '✅', label: 'Delivered' },
            opened: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', icon: '👀', label: 'Opened' },
            clicked: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-300', icon: '🔗', label: 'Clicked' },
            failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: '❌', label: 'Failed' },
            pending: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', icon: '⏳', label: 'Pending' },
        };

        const config = statusConfig[tracking.status] || statusConfig.pending;

        return (
            <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded font-medium ${config.bg} ${config.text}`}>
                    {config.icon} {config.label}
                </span>
                {tracking.openCount > 1 && (
                    <span className="text-xs text-gray-500">({tracking.openCount}x)</span>
                )}
                {tracking.status === 'failed' && tracking.deliveryError && (
                    <span className="text-xs text-red-600 dark:text-red-400" title={tracking.deliveryError}>⚠️</span>
                )}
            </div>
        );
    }

    const stats = {
        total: nonVendorAttendees.length,
        sent: Array.from(trackingMap.values()).length,
        opened: Array.from(trackingMap.values()).filter(t => t.status === 'opened' || t.status === 'clicked').length,
        failed: Array.from(trackingMap.values()).filter(t => t.status === 'failed').length,
    };

    if (loadingData) {
        return (
            <div className="flex justify-center items-center h-64">
                <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-3">
                        <PaperAirplaneIcon className="w-8 h-8 text-primary-600" />
                        Access Codes Management
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Send and track IME access code emails to attendees
                    </p>
                </div>
                <Button onClick={loadTracking} variant="neutral" size="sm" leftIcon={<ArrowPathIcon className="w-4 h-4" />}>
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Attendees</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.sent}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Emails Sent</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.opened}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Opened</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            {stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0}% open rate
                        </p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                    </div>
                </Card>
            </div>

            {/* Bulk Actions Bar */}
            {selected.size > 0 && (
                <Card>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {selected.size} attendee{selected.size > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <Button onClick={() => setSelected(new Set())} variant="neutral" size="sm">
                                Clear Selection
                            </Button>
                            <Button onClick={handleBulkSend} variant="primary" size="sm" disabled={loading}>
                                {loading ? 'Sending...' : `📧 Send Access Codes (${selected.size})`}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Filters and Search */}
            <Card>
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search by name, email, or organization..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="all">All ({nonVendorAttendees.length})</option>
                        <option value="sent">Sent Only ({stats.sent})</option>
                        <option value="not_sent">Not Sent ({stats.total - stats.sent})</option>
                        <option value="opened">Opened ({stats.opened})</option>
                        <option value="failed">Failed ({stats.failed})</option>
                    </select>
                </div>
            </Card>

            {/* Attendees Table */}
            <Card title={`Attendees (${filteredAttendees.length})`}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left p-3">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={filteredAttendees.length > 0 && selected.size === filteredAttendees.length}
                                        className="w-4 h-4"
                                    />
                                </th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Organization</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Sent At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingTracking ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        <ArrowPathIcon className="w-6 h-6 mx-auto mb-2 animate-spin" />
                                        Loading tracking data...
                                    </td>
                                </tr>
                            ) : filteredAttendees.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        No attendees match your filters
                                    </td>
                                </tr>
                            ) : (
                                filteredAttendees.map(attendee => {
                                    const tracking = trackingMap.get(attendee.id);
                                    return (
                                        <tr
                                            key={attendee.id}
                                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(attendee.id)}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selected);
                                                        if (e.target.checked) {
                                                            newSet.add(attendee.id);
                                                        } else {
                                                            newSet.delete(attendee.id);
                                                        }
                                                        setSelected(newSet);
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                            </td>
                                            <td className="p-3 font-medium text-gray-900 dark:text-white">{attendee.name}</td>
                                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{attendee.email}</td>
                                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{attendee.organization}</td>
                                            <td className="p-3">{getStatusBadge(attendee.id)}</td>
                                            <td className="p-3 text-sm text-gray-500 dark:text-gray-500">
                                                {tracking?.sentAt ? new Date(tracking.sentAt).toLocaleString() : '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
