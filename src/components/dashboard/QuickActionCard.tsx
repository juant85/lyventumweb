// src/components/dashboard/QuickActionCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickActionCard as CardType } from '../../types/dashboard';
import { Icon } from '../ui/Icon';
import { IconName } from '../ui';

interface QuickActionCardProps {
    card: CardType;
    isEditing?: boolean;
    onRemove?: (cardId: string) => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
    card,
    isEditing = false,
    onRemove
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (!isEditing) {
            navigate(card.route);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.(card.id);
    };

    return (
        <div
            onClick={handleClick}
            className={`
        relative group
        bg-white dark:bg-slate-800 
        border border-slate-200 dark:border-slate-700
        rounded-xl p-4
        transition-all duration-200
        ${isEditing
                    ? 'cursor-move ring-2 ring-primary-500/30'
                    : 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary-400'
                }
      `}
        >
            {/* Drag Handle (only in edit mode) */}
            {isEditing && (
                <div className="absolute top-2 left-2 text-slate-400">
                    <Icon name="menu" className="w-4 h-4" />
                </div>
            )}

            {/* Remove Button (only in edit mode) */}
            {isEditing && (
                <button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    aria-label={`Remove ${card.label}`}
                >
                    <Icon name="close" className="w-3 h-3" />
                </button>
            )}

            {/* Card Content */}
            <div className="flex flex-col items-center gap-2 mt-2">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon name={card.icon as IconName} className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center">
                    {card.label}
                </p>
            </div>
        </div>
    );
};

export default QuickActionCard;
