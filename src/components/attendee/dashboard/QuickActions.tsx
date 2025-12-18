import React from 'react';
import { Camera, Map, MessageCircle, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { Attendee } from '../../../types';

interface QuickActionsProps {
    attendee: Attendee;
}

export default function QuickActions({ attendee }: QuickActionsProps) {
    const navigate = useNavigate();

    const actions = [
        {
            icon: Camera,
            label: 'My Badge',
            onClick: () => navigate('/portal/profile'),
            color: 'text-primary-600 dark:text-primary-400'
        },
        {
            icon: Map,
            label: 'Floor Map',
            onClick: () => {
                // TODO: Implement floor map view
                console.log('Opening floor map...');
            },
            color: 'text-success-600 dark:text-success-400'
        },
        {
            icon: MessageCircle,
            label: 'Support',
            onClick: () => {
                // Open chat
                console.log('Opening support chat...');
            },
            color: 'text-orange-600 dark:text-orange-400'
        },
        {
            icon: BarChart3,
            label: 'Stats',
            onClick: () => navigate('/portal/stats'),
            color: 'text-purple-600 dark:text-purple-400'
        },
    ];

    return (
        <Card title="⚡ Quick Actions">
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:shadow-md active:scale-95 min-h-[100px] group"
                        >
                            <div className={`p-3 rounded-full bg-white dark:bg-slate-900 shadow-sm group-hover:shadow-md transition-shadow mb-2`}>
                                <Icon className={`w-6 h-6 ${action.color}`} />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {action.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </Card>
    );
}
