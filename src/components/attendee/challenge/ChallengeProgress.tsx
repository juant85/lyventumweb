import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import Card from '../../ui/Card';

interface ChallengeProgressProps {
    visited: number;
    total: number;
    achievementLevel: 'none' | 'bronze' | 'silver' | 'gold';
}

const achievementConfig = {
    none: {
        color: 'gray',
        label: 'Getting Started',
        icon: '🎯',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-600 dark:text-gray-400',
        progressColor: 'bg-gray-400',
    },
    bronze: {
        color: 'bronze',
        label: 'Bronze Explorer',
        icon: '🥉',
        bgColor: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30',
        textColor: 'text-amber-800 dark:text-amber-300',
        progressColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
    },
    silver: {
        color: 'silver',
        label: 'Silver Networker',
        icon: '🥈',
        bgColor: 'bg-gradient-to-br from-gray-100 to-slate-200 dark:from-gray-800 dark:to-slate-700',
        textColor: 'text-slate-700 dark:text-slate-300',
        progressColor: 'bg-gradient-to-r from-gray-400 to-slate-500',
    },
    gold: {
        color: 'gold',
        label: 'Gold Completionist',
        icon: '🥇',
        bgColor: 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-900/30',
        textColor: 'text-yellow-800 dark:text-yellow-300',
        progressColor: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    },
};

export default function ChallengeProgress({
    visited,
    total,
    achievementLevel
}: ChallengeProgressProps) {
    const percentage = total > 0 ? (visited / total) * 100 : 0;
    const config = achievementConfig[achievementLevel];

    // Calculate next milestone
    const getNextMilestone = () => {
        if (percentage < 25) return { target: Math.ceil(total * 0.25), level: 'Bronze' };
        if (percentage < 50) return { target: Math.ceil(total * 0.50), level: 'Silver' };
        if (percentage < 75) return { target: Math.ceil(total * 0.75), level: 'Gold' };
        return null;
    };

    const nextMilestone = getNextMilestone();

    return (
        <Card className={`border-2 ${config.bgColor}`}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-4xl">{config.icon}</div>
                        <div>
                            <h3 className={`text-lg font-bold ${config.textColor}`}>
                                {config.label}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {visited} of {total} booths visited
                            </p>
                        </div>
                    </div>
                    <Trophy className={`w-8 h-8 ${config.textColor}`} />
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                            Progress
                        </span>
                        <span className={`font-bold ${config.textColor}`}>
                            {Math.round(percentage)}%
                        </span>
                    </div>
                    <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`${config.progressColor} h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                            style={{ width: `${percentage}%` }}
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </div>
                    </div>
                </div>

                {/* Next Milestone */}
                {nextMilestone && (
                    <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700">
                        <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>{nextMilestone.target - visited} more</strong> to unlock <strong>{nextMilestone.level}</strong>!
                        </p>
                    </div>
                )}

                {/* Completed Message */}
                {percentage === 100 && (
                    <div className="p-4 bg-success-100 dark:bg-success-900/30 rounded-lg border-2 border-success-500 text-center">
                        <p className="text-lg font-bold text-success-800 dark:text-success-200 mb-1">
                            🎉 Challenge Complete!
                        </p>
                        <p className="text-sm text-success-700 dark:text-success-300">
                            You've visited all booths! Check with organizers for your prize.
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}
