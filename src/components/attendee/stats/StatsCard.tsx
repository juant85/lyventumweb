import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: 'primary' | 'success' | 'warning' | 'purple' | 'info' | 'gold';
}

const colorConfig = {
    primary: {
        bg: 'bg-primary-50 dark:bg-primary-900/20',
        icon: 'text-primary-600 dark:text-primary-400',
        value: 'text-primary-700 dark:text-primary-300',
        border: 'border-primary-200 dark:border-primary-800',
    },
    success: {
        bg: 'bg-success-50 dark:bg-success-900/20',
        icon: 'text-success-600 dark:text-success-400',
        value: 'text-success-700 dark:text-success-300',
        border: 'border-success-200 dark:border-success-800',
    },
    warning: {
        bg: 'bg-warning-50 dark:bg-warning-900/20',
        icon: 'text-warning-600 dark:text-warning-400',
        value: 'text-warning-700 dark:text-warning-300',
        border: 'border-warning-200 dark:border-warning-800',
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        value: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        value: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
    },
    gold: {
        bg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        value: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
    },
};

export default function StatsCard({
    icon,
    label,
    value,
    color = 'primary'
}: StatsCardProps) {
    const config = colorConfig[color];

    return (
        <div className={`
      ${config.bg} ${config.border}
      border-2 rounded-xl p-4 
      transition-all duration-200 
      hover:shadow-lg hover:-translate-y-1
    `}>
            <div className="flex items-start justify-between mb-2">
                <div className={`${config.icon}`}>
                    {icon}
                </div>
            </div>

            <div className={`text-3xl font-bold ${config.value} mb-1`}>
                {value}
            </div>

            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {label}
            </div>
        </div>
    );
}
