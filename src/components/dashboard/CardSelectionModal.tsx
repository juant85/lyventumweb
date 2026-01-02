// src/components/dashboard/CardSelectionModal.tsx
import React, { useState } from 'react';
import { QuickActionCard } from '../../types/dashboard';
import { AVAILABLE_CARDS } from '../../constants/availableCards';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Icon } from '../ui/Icon';
import { IconName } from '../ui';

interface CardSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCards: QuickActionCard[];
    onSave: (cards: QuickActionCard[]) => void;
}

const CardSelectionModal: React.FC<CardSelectionModalProps> = ({
    isOpen,
    onClose,
    currentCards,
    onSave,
}) => {
    const [selectedCards, setSelectedCards] = useState<Set<string>>(
        new Set(currentCards.filter(c => c.enabled).map(c => c.id))
    );

    const toggleCard = (cardId: string) => {
        const newSelected = new Set(selectedCards);
        if (newSelected.has(cardId)) {
            // Prevent removing if it's the last card
            if (newSelected.size > 1) {
                newSelected.delete(cardId);
            }
        } else {
            // Prevent adding more than 12 cards
            if (newSelected.size < 12) {
                newSelected.add(cardId);
            }
        }
        setSelectedCards(newSelected);
    };

    const handleSave = () => {
        const updatedCards = AVAILABLE_CARDS.map((card, index) => ({
            ...card,
            enabled: selectedCards.has(card.id),
            order: selectedCards.has(card.id) ? index : 999,
        }));
        onSave(updatedCards);
        onClose();
    };

    const groupedCards = {
        manage: AVAILABLE_CARDS.filter(c => c.category === 'manage'),
        configure: AVAILABLE_CARDS.filter(c => c.category === 'configure'),
        analyze: AVAILABLE_CARDS.filter(c => c.category === 'analyze'),
        tools: AVAILABLE_CARDS.filter(c => c.category === 'tools'),
    };

    const categoryLabels = {
        manage: '👥 Manage & Edit',
        configure: '⚙️ Configure & Setup',
        analyze: '📊 Analyze & Track',
        tools: '🛠️ Tools & Utilities',
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Customize Quick Actions"
            size="lg"
        >
            <div className="space-y-6">
                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <Icon name="alert" className="w-4 h-4 inline mr-1" />
                        Select cards to show on your dashboard (min: 1, max: 12). Selected: <strong>{selectedCards.size}</strong>
                    </p>
                </div>

                {/* Card Categories */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(groupedCards).map(([category, cards]) => (
                        <div key={category}>
                            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
                                {categoryLabels[category as keyof typeof categoryLabels]}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {cards.map(card => {
                                    const isSelected = selectedCards.has(card.id);
                                    const isDisabled = !isSelected && selectedCards.size >= 12;
                                    const isLastCard = isSelected && selectedCards.size === 1;

                                    return (
                                        <button
                                            key={card.id}
                                            onClick={() => toggleCard(card.id)}
                                            disabled={isDisabled || isLastCard}
                                            className={`
                        p-3 rounded-lg border-2 transition-all text-left
                        ${isSelected
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                }
                        ${isDisabled || isLastCard
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer'
                                                }
                      `}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <Icon
                                                    name={card.icon as IconName}
                                                    className={`w-5 h-5 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`}
                                                />
                                                {isSelected && (
                                                    <Icon name="checkCircle" className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {card.label}
                                            </p>
                                            {isLastCard && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                    Must keep at least 1 card
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="neutral" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default CardSelectionModal;
