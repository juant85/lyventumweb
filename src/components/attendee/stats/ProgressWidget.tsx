import React from 'react';
import { Building2, Calendar, TrendingUp } from 'lucide-react';
import Card from '../../ui/Card';

interface ProgressWidgetProps {
    boothsVisited: number;
    sessionsAttended: number;
    totalBooths?: number;
    totalSessions?: number;
}

export default function ProgressWidget({
    boothsVisited,
    sessionsAttended,
    totalBooths = 15,
    totalSessions = 8
}: ProgressWidgetProps) {
    const boothProgress = Math.min((boothsVisited / totalBooths) * 100, 100);
    const sessionProgress = Math.min((sessionsAttended / totalSessions) * 100, 100);

    return (
        <Card title="🎯 Your Progress Today" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="space-y-4">
                {/* Booths Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Booths Visited
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {boothsVisited}/{totalBooths}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-success-500 to-success-600 h-3 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${boothProgress}%` }}
                        />
                    </div>
                </div>

                {/* Sessions Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Sessions Attended
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {sessionsAttended}/{totalSessions}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${sessionProgress}%` }}
                        />
                    </div>
                </div>

                {/* Next Achievement Hint */}
                {boothsVisited >= 5 && boothsVisited < 10 && (
                    <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                        <p className="text-sm text-warning-800 dark:text-warning-200">
                            💎 <strong>{10 - boothsVisited} more booth{10 - boothsVisited > 1 ? 's' : ''}</strong> to unlock Silver status!
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}
