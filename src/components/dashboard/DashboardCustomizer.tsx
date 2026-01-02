// src/components/dashboard/DashboardCustomizer.tsx
import React, { useState } from 'react';
import { useDashboardPreferences } from '../../hooks/useDashboardPreferences';
import QuickActions from './QuickActions';
import CardSelectionModal from './CardSelectionModal';
import Button from '../ui/Button';
import { QuickActionCard } from '../../types/dashboard';

interface DashboardCustomizerProps {
    className?: string;
}

const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({ className = '' }) => {
    const { cards, savePreferences, resetToDefaults } = useDashboardPreferences();
    const [isEditing, setIsEditing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveCards = (updatedCards: QuickActionCard[]) => {
        savePreferences(updatedCards);
        setIsModalOpen(false);
    };

    const handleRemoveCard = (cardId: string) => {
        const updatedCards = cards.map(card =>
            card.id === cardId ? { ...card, enabled: false } : card
        );
        savePreferences(updatedCards);
    };

    const handleReset = () => {
        if (confirm('Reset to default Quick Actions? This will remove all customizations.')) {
            resetToDefaults();
            setIsEditing(false);
        }
    };

    return (
        <div className={className}>
            {/* Header with Controls */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Quick Actions
                </h2>

                <div className="flex items-center gap-2">
                    {isEditing && (
                        <>
                            <Button
                                variant="neutral"
                                size="sm"
                                onClick={() => setIsModalOpen(true)}
                            >
                                + Add Card
                            </Button>
                            <Button
                                variant="neutral"
                                size="sm"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        </>
                    )}
                    <Button
                        variant={isEditing ? 'primary' : 'neutral'}
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? 'Done' : 'Edit'}
                    </Button>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <QuickActions
                isEditing={isEditing}
                onRemoveCard={handleRemoveCard}
            />

            {/* Card Selection Modal */}
            <CardSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentCards={cards}
                onSave={handleSaveCards}
            />
        </div>
    );
};

export default DashboardCustomizer;
