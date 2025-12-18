import React from 'react';

interface EmailStatusBadgeProps {
    status: string;
    mini?: boolean;
}

export default function EmailStatusBadge({ status, mini = false }: EmailStatusBadgeProps) {
    const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
        sent: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: '📤', label: 'Sent' },
        delivered: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: '✅', label: 'Delivered' },
        opened: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', icon: '👀', label: 'Opened' },
        clicked: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-300', icon: '🔗', label: 'Clicked' },
        failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: '❌', label: 'Failed' },
        bounced: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: '❌', label: 'Bounced' },
    };

    const config = statusConfig[status] || statusConfig.sent;

    if (mini) {
        return (
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${config.bg} ${config.text}`} title={config.label}>
                {config.icon}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
}
