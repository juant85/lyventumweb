import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { SparklineChart } from '../charts/SparklineChart';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface QuickStatCardProps {
    label: string;
    value: number | string;
    icon?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'amber' | 'pink';
    // Premium features
    trend?: number; // % change (positive or negative)
    sparklineData?: number[]; // Array of historical values
    trendDirection?: 'up' | 'down' | 'neutral';
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({
    label,
    value,
    icon = 'activity',
    color = 'blue',
    trend,
    sparklineData,
    trendDirection
}) => {
    const colorMap = {
        blue: '#3b82f6',
        green: '#10b981',
        purple: '#a855f7',
        orange: '#f97316',
        red: '#ef4444',
        teal: '#14b8a6',
        amber: '#f59e0b',
        pink: '#ec4899',
    };

    // Define colors for the new layout
    const iconBgColorMap = {
        blue: 'bg-blue-100 dark:bg-blue-900',
        green: 'bg-green-100 dark:bg-green-900',
        purple: 'bg-purple-100 dark:bg-purple-900',
        orange: 'bg-orange-100 dark:bg-orange-900',
        red: 'bg-red-100 dark:bg-red-900',
        teal: 'bg-teal-100 dark:bg-teal-900',
        amber: 'bg-amber-100 dark:bg-amber-900',
        pink: 'bg-pink-100 dark:bg-pink-900',
    };

    const iconTextColorMap = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        purple: 'text-purple-600 dark:text-purple-400',
        orange: 'text-orange-600 dark:text-orange-400',
        red: 'text-red-600 dark:text-red-400',
        teal: 'text-teal-600 dark:text-teal-400',
        amber: 'text-amber-600 dark:text-amber-400',
        pink: 'text-pink-600 dark:text-pink-400',
    };

    const iconShadowColorMap = {
        blue: 'shadow-blue-500/20',
        green: 'shadow-green-500/20',
        purple: 'shadow-purple-500/20',
        orange: 'shadow-orange-500/20',
        red: 'shadow-red-500/20',
        teal: 'shadow-teal-500/20',
        amber: 'shadow-amber-500/20',
        pink: 'shadow-pink-500/20',
    };

    const bgColor = iconBgColorMap[color] || iconBgColorMap.blue;
    const textColor = iconTextColorMap[color] || iconTextColorMap.blue;
    const shadowColor = iconShadowColorMap[color] || iconShadowColorMap.blue;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.97 }}
            className="relative p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700"
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${bgColor} ${shadowColor}`}>
                        <Icon name={icon as any} className={`w-6 h-6 ${textColor}`} />
                    </div>
                    <div className="text-right flex-1 ml-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                            {label}
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {value}
                            </p>
                            {/* Trend Indicator */}
                            {trend !== undefined && (
                                <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend > 0 ? 'text-green-600 dark:text-green-400' :
                                    trend < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-slate-500 dark:text-slate-400'
                                    }`}>
                                    {trend > 0 && <TrendingUp className="w-3 h-3" />}
                                    {trend < 0 && <TrendingDown className="w-3 h-3" />}
                                    {trend === 0 && <Minus className="w-3 h-3" />}
                                    <span>{trend > 0 ? '+' : ''}{trend}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sparkline */}
                {sparklineData && sparklineData.length > 0 && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Last 7 days</span>
                        <SparklineChart
                            data={sparklineData}
                            color={
                                trend && trend > 0 ? '#10b981' :
                                    trend && trend < 0 ? '#ef4444' :
                                        colorMap[color]
                            }
                            width={80}
                            height={24}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default QuickStatCard;
