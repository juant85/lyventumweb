// src/components/dashboard/ActivityFeed.tsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, UserPlus, AlertCircle } from 'lucide-react';
import { ScanRecord, SessionRegistration } from '../../types';

interface Activity {
    id: string;
    type: 'scan' | 'registration' | 'alert';
    timestamp: Date;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
}

interface ActivityFeedProps {
    scans: ScanRecord[];
    registrations: SessionRegistration[];
    maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ scans, registrations, maxItems = 20 }) => {
    const activities = useMemo(() => {
        const scanActivities: Activity[] = scans.map(scan => ({
            id: `scan-${scan.id}`,
            type: 'scan' as const,
            timestamp: new Date(scan.timestamp),
            title: scan.attendeeName || 'Unknown Attendee',
            subtitle: `Scanned at booth`,
            icon: <CheckCircle className="w-4 h-4" />,
            color: 'text-green-500',
        }));

        const regActivities: Activity[] = registrations
            .filter(reg => reg.id) // Only include registrations with valid data
            .map(reg => ({
                id: `reg-${reg.id}`,
                type: 'registration' as const,
                timestamp: new Date(), // Use current time since createdAt doesn't exist
                title: reg.attendeeName || 'Unknown',
                subtitle: 'Registered for session',
                icon: <UserPlus className="w-4 h-4" />,
                color: 'text-blue-500',
            }));

        return [...scanActivities, ...regActivities]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, maxItems);
    }, [scans, registrations, maxItems]);

    const getTimeAgo = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-montserrat">
                    Recent Activity
                </h3>
                <Clock className="w-5 h-5 text-slate-400" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                <AnimatePresence initial={false}>
                    {activities.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-slate-500 dark:text-slate-400"
                        >
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No recent activity</p>
                        </motion.div>
                    ) : (
                        activities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2, delay: index * 0.02 }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className={`p-2 rounded-full bg-slate-200 dark:bg-slate-700 ${activity.color}`}>
                                    {activity.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                        {activity.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {activity.subtitle}
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {getTimeAgo(activity.timestamp)}
                                </span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActivityFeed;
