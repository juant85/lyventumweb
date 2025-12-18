// src/components/dashboard/QuickActions.tsx
import React from 'react';
import { Search, Map, BarChart3, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import Button from '../ui/Button';

interface QuickActionsProps {
    onAction?: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
    const navigate = useNavigate();

    const actions = [
        {
            id: 'find-attendee',
            label: 'Find Attendee',
            icon: <Search className="w-4 h-4" />,
            onClick: () => {
                onAction?.('find-attendee');
                navigate(AppRoute.AttendeeLocator);
            },
            variant: 'primary' as const,
        },
        {
            id: 'view-booths',
            label: 'View Booths',
            icon: <Map className="w-4 h-4" />,
            onClick: () => {
                onAction?.('view-booths');
                navigate(AppRoute.DataVisualization);
            },
            variant: 'neutral' as const,
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className="w-4 h-4" />,
            onClick: () => {
                onAction?.('analytics');
                navigate(AppRoute.RealTimeAnalytics);
            },
            variant: 'neutral' as const,
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: <FileText className="w-4 h-4" />,
            onClick: () => {
                onAction?.('reports');
                navigate(AppRoute.Reports);
            },
            variant: 'neutral' as const,
        },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {actions.map(action => (
                <Button
                    key={action.id}
                    onClick={action.onClick}
                    variant={action.variant}
                    size="sm"
                    className="flex items-center gap-2"
                >
                    {action.icon}
                    <span className="hidden sm:inline">{action.label}</span>
                </Button>
            ))}
        </div>
    );
};

export default QuickActions;
