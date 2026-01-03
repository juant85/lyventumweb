// src/pages/admin/ActivityLogPage.tsx
import React, { useState, useMemo } from 'react';
import { useScans } from '../../contexts/scans';
import { useAttendees } from '../../contexts/attendees';
import { useBooths } from '../../contexts/booths';
import { Icon } from '../../components/ui/Icon';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

type ActivityFilter = 'all' | 'expected' | 'walk_in' | 'wrong_booth' | 'out_of_schedule';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    EXPECTED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Expected' },
    WALK_IN: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Walk-in' },
    WRONG_BOOTH: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Wrong Booth' },
    OUT_OF_SCHEDULE: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Out of Schedule' },
    FREQUENT_SCAN: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Frequent Scan' },
};

const ActivityLogPage: React.FC = () => {
    const { scans, loading: scansLoading } = useScans();
    const { attendees } = useAttendees();
    const { booths } = useBooths();

    const [filter, setFilter] = useState<ActivityFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Create lookup maps for performance
    const attendeeMap = useMemo(() => {
        const map = new Map<string, string>();
        attendees.forEach(a => map.set(a.id, a.name || a.email || 'Unknown'));
        return map;
    }, [attendees]);

    const boothMap = useMemo(() => {
        const map = new Map<string, string>();
        booths.forEach(b => map.set(b.id, b.companyName || b.physicalId || 'Unknown'));
        return map;
    }, [booths]);

    // Filter and sort scans
    const filteredActivities = useMemo(() => {
        let result = [...scans];

        // Apply status filter
        if (filter !== 'all') {
            const statusMap: Record<ActivityFilter, string> = {
                all: '',
                expected: 'EXPECTED',
                walk_in: 'WALK_IN',
                wrong_booth: 'WRONG_BOOTH',
                out_of_schedule: 'OUT_OF_SCHEDULE'
            };
            result = result.filter(s => s.scanStatus === statusMap[filter]);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(scan => {
                const attendeeName = attendeeMap.get(scan.attendeeId)?.toLowerCase() || '';
                const boothName = scan.boothId ? (boothMap.get(scan.boothId)?.toLowerCase() || '') : '';
                return attendeeName.includes(query) || boothName.includes(query);
            });
        }

        // Sort by most recent first
        return result.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 100); // Limit to 100 most recent
    }, [scans, filter, searchQuery, attendeeMap, boothMap]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: scans.length,
            expected: scans.filter(s => s.scanStatus === 'EXPECTED').length,
            walkIn: scans.filter(s => s.scanStatus === 'WALK_IN').length,
            issues: scans.filter(s => ['WRONG_BOOTH', 'OUT_OF_SCHEDULE'].includes(s.scanStatus || '')).length
        };
    }, [scans]);

    if (scansLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading activity...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-24">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <Icon name="activity" className="w-8 h-8 text-primary-600" />
                        Activity Log
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Recent scanning activity and event interactions.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</div>
                        <div className="text-sm text-slate-500">Total Scans</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 shadow-md border border-green-200 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-600">{stats.expected}</div>
                        <div className="text-sm text-green-600/70">Expected</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 shadow-md border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600">{stats.walkIn}</div>
                        <div className="text-sm text-blue-600/70">Walk-ins</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 shadow-md border border-red-200 dark:border-red-800">
                        <div className="text-2xl font-bold text-red-600">{stats.issues}</div>
                        <div className="text-sm text-red-600/70">Issues</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-200 dark:border-slate-700 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by attendee or booth..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'expected', 'walk_in', 'wrong_booth', 'out_of_schedule'] as ActivityFilter[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity List */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {filteredActivities.length === 0 ? (
                        <div className="p-8 text-center">
                            <Icon name="activity" className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No activity found matching your filters.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredActivities.map((activity, index) => {
                                const status = STATUS_STYLES[activity.scanStatus || 'EXPECTED'];
                                const attendeeName = attendeeMap.get(activity.attendeeId) || 'Unknown Attendee';
                                const boothName = activity.boothId ? (boothMap.get(activity.boothId) || 'Unknown Booth') : 'No Booth';
                                const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });

                                return (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Icon */}
                                            <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center flex-shrink-0`}>
                                                <Icon name="qrCode" className={`w-5 h-5 ${status.text}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-slate-800 dark:text-white truncate">
                                                        {attendeeName}
                                                    </span>
                                                    <span className="text-slate-400">→</span>
                                                    <span className="text-slate-600 dark:text-slate-300 truncate">
                                                        {boothName}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {timeAgo}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text} flex-shrink-0`}>
                                                {status.label}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer info */}
                {filteredActivities.length > 0 && (
                    <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        Showing {filteredActivities.length} of {scans.length} activities
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogPage;
