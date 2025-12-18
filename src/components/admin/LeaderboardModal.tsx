import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { challengeService, LeaderboardEntry } from '../../services/challengeService';
import { Download, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
}

export default function LeaderboardModal({ isOpen, onClose, eventId }: LeaderboardModalProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && eventId) {
            loadLeaderboard();
        }
    }, [isOpen, eventId]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const data = await challengeService.getLeaderboard(eventId, 100);
            setLeaderboard(data);
        } catch (e) {
            console.error('[LeaderboardModal] Error loading:', e);
            toast.error('Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (leaderboard.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            const headers = ['Rank', 'Name', 'Meetings Attended', 'Total Scans', 'Last Scan'];

            const rows = leaderboard.map(entry => [
                entry.rank,
                `"${entry.attendee_name}"`, // Quote to handle commas in names
                entry.unique_booths_visited,
                entry.total_scans,
                new Date(entry.latest_scan_time).toLocaleString()
            ]);

            const csv = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `challenge-leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success('Leaderboard exported successfully!');
        } catch (e) {
            console.error('[LeaderboardModal] Export error:', e);
            toast.error('Failed to export CSV');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Challenge Leaderboard">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Top performers ranked by meetings attended
                    </p>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={exportToCSV}
                        disabled={leaderboard.length === 0}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                {/* Leaderboard Table */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                        <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                            No challenge data yet
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Attendees will appear here as they complete meetings
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Rank
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Attendee
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Meetings
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Total Scans
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Last Activity
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {leaderboard.map((entry) => (
                                    <tr
                                        key={entry.attendee_id}
                                        className={`${entry.rank <= 3
                                                ? 'bg-secondary-50 dark:bg-secondary-900/20'
                                                : ''
                                            }`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {entry.rank === 1 && (
                                                    <span className="text-2xl mr-2">🥇</span>
                                                )}
                                                {entry.rank === 2 && (
                                                    <span className="text-2xl mr-2">🥈</span>
                                                )}
                                                {entry.rank === 3 && (
                                                    <span className="text-2xl mr-2">🥉</span>
                                                )}
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    #{entry.rank}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {entry.attendee_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200">
                                                {entry.unique_booths_visited}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {entry.total_scans}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(entry.latest_scan_time).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modal>
    );
}
