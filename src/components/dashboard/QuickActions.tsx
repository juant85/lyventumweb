// src/components/dashboard/QuickActions.tsx
import React from 'react';
import { useDashboardPreferences } from '../../hooks/useDashboardPreferences';
import QuickActionCard from './QuickActionCard';

interface QuickActionsProps {
    onAction?: (action: string) => void;
    isEditing?: boolean;
    onRemoveCard?: (cardId: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
    onAction,
    isEditing = false,
    onRemoveCard
}) => {
    const { enabledCards, isLoading } = useDashboardPreferences();

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (enabledCards.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No Quick Actions configured. Click "Edit" to add cards.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {enabledCards.map(card => (
                <QuickActionCard
                    key={card.id}
                    card={card}
                    isEditing={isEditing}
                    onRemove={onRemoveCard}
                />
            ))}
        </div>
    );
};

export default QuickActions;
