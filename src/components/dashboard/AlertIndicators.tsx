// src/components/dashboard/AlertIndicators.tsx
import React, { useMemo } from 'react';
import { AlertTriangle, AlertCircle, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface Alert {
    id: string;
    type: 'warning' | 'critical' | 'info';
    title: string;
    description: string;
    icon: React.ReactNode;
}

interface AlertIndicatorsProps {
    emptyBooths: number;
    totalBooths: number;
    checkInRate: number;
    activeAttendees: number;
    expectedAttendees: number;
}

const AlertIndicators: React.FC<AlertIndicatorsProps> = ({
    emptyBooths,
    totalBooths,
    checkInRate,
    activeAttendees,
    expectedAttendees,
}) => {
    const alerts = useMemo(() => {
        const alertList: Alert[] = [];

        // Empty booths alert
        if (emptyBooths > 0 && totalBooths > 0) {
            const emptyPercentage = (emptyBooths / totalBooths) * 100;
            if (emptyPercentage > 50) {
                alertList.push({
                    id: 'empty-booths-critical',
                    type: 'critical',
                    title: `${emptyBooths} Empty Booths`,
                    description: `More than half of booths have no visitors`,
                    icon: <AlertTriangle className="w-5 h-5" />,
                });
            } else if (emptyBooths >= 3) {
                alertList.push({
                    id: 'empty-booths-warning',
                    type: 'warning',
                    title: `${emptyBooths} Empty Booths`,
                    description: 'Consider directing attendees to these booths',
                    icon: <AlertCircle className="w-5 h-5" />,
                });
            }
        }

        // Low check-in rate
        if (checkInRate < 50 && expectedAttendees > 0) {
            alertList.push({
                id: 'low-checkin',
                type: 'warning',
                title: 'Low Check-in Rate',
                description: `Only ${checkInRate}% of registered attendees have checked in`,
                icon: <TrendingDown className="w-5 h-5" />,
            });
        }

        // Very low attendance  
        if (activeAttendees < 5 && expectedAttendees > 20) {
            alertList.push({
                id: 'low-attendance',
                type: 'critical',
                title: 'Very Low Attendance',
                description: `Only ${activeAttendees} active attendees`,
                icon: <AlertTriangle className="w-5 h-5" />,
            });
        }

        return alertList;
    }, [emptyBooths, totalBooths, checkInRate, activeAttendees, expectedAttendees]);

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {alerts.map((alert, index) => {
                const colors = {
                    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300',
                    critical: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300',
                    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300',
                };

                return (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${colors[alert.type]}`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {alert.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold">{alert.title}</p>
                            <p className="text-xs opacity-90 mt-0.5">{alert.description}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default AlertIndicators;
