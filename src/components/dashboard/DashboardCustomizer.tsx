// src/components/dashboard/DashboardCustomizer.tsx
import React, { useState } from 'react';
import { useDashboardPreferences } from '../../hooks/useDashboardPreferences';
import QuickActions from './QuickActions';
import CardSelectionModal from './CardSelectionModal';
import Button from '../ui/Button';
import { QuickActionCard } from '../../types/dashboard';
import { Icon } from '../ui/Icon';
import { useIsMobile } from '../../hooks/useIsMobile';
import BottomSheet from '../ui/BottomSheet';
import { AVAILABLE_CARDS } from '../../constants/availableCards';
import { IconName } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardCustomizerProps {
    className?: string;
    /** External control of edit mode (optional) */
    externalIsEditing?: boolean;
    /** Callback when edit mode changes (optional) */
    onEditChange?: (isEditing: boolean) => void;
}

const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
    className = '',
    externalIsEditing,
    onEditChange
}) => {
    const { cards, enabledCards, savePreferences, resetToDefaults } = useDashboardPreferences();
    // Use external state if provided, otherwise use internal
    const [internalIsEditing, setInternalIsEditing] = useState(false);
    const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;

    const setIsEditing = (value: boolean) => {
        if (onEditChange) {
            onEditChange(value);
        } else {
            setInternalIsEditing(value);
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleSaveCards = (updatedCards: QuickActionCard[]) => {
        savePreferences(updatedCards);
        setIsModalOpen(false);
        setIsBottomSheetOpen(false);
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

    const handleAddCardClick = () => {
        if (isMobile) {
            setIsBottomSheetOpen(true);
        } else {
            setIsModalOpen(true);
        }
    };

    // Toggle card in mobile bottom sheet
    const handleToggleCard = (cardId: string) => {
        const currentCard = cards.find(c => c.id === cardId);
        if (!currentCard) return;

        const enabledCount = cards.filter(c => c.enabled).length;

        // Don't allow removing last card
        if (currentCard.enabled && enabledCount <= 1) return;

        // Don't allow more than 12 cards
        if (!currentCard.enabled && enabledCount >= 12) return;

        const updatedCards = cards.map(card =>
            card.id === cardId ? { ...card, enabled: !card.enabled } : card
        );
        savePreferences(updatedCards);
    };

    // Group cards by category for bottom sheet
    const groupedCards = {
        manage: AVAILABLE_CARDS.filter(c => c.category === 'manage'),
        configure: AVAILABLE_CARDS.filter(c => c.category === 'configure'),
        analyze: AVAILABLE_CARDS.filter(c => c.category === 'analyze'),
        tools: AVAILABLE_CARDS.filter(c => c.category === 'tools'),
    };

    const categoryLabels = {
        manage: '👥 Manage',
        configure: '⚙️ Configure',
        analyze: '📊 Analyze',
        tools: '🛠️ Tools',
    };

    return (
        <div className={className}>
            {/* Header with Controls - Mobile Optimized */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Quick Actions
                    </h2>
                    {/* Mobile hint badge */}
                    {isMobile && !isEditing && enabledCards.length > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full"
                        >
                            Tap Edit ✏️
                        </motion.span>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <AnimatePresence mode="wait">
                        {isEditing && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-2"
                            >
                                <button
                                    onClick={handleAddCardClick}
                                    className="min-h-[44px] min-w-[44px] px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                                >
                                    <Icon name="plus" className="w-4 h-4" />
                                    <span className="hidden sm:inline">Add Card</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="min-h-[44px] min-w-[44px] px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-1.5"
                                >
                                    <Icon name="refresh" className="w-4 h-4" />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 ${isEditing
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Icon name={isEditing ? 'checkCircle' : 'edit'} className="w-4 h-4" />
                        {isEditing ? 'Done' : 'Edit'}
                    </button>
                </div>
            </div>

            {/* Edit mode hint for mobile */}
            <AnimatePresence>
                {isEditing && isMobile && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4"
                    >
                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                            <Icon name="alert" className="w-4 h-4 flex-shrink-0" />
                            Tap the <span className="font-bold">✕</span> on cards to remove, or <span className="font-bold">+ Add Card</span> to add more
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Actions Grid */}
            <QuickActions
                isEditing={isEditing}
                onRemoveCard={handleRemoveCard}
            />

            {/* Card Selection Modal (Desktop) */}
            <CardSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentCards={cards}
                onSave={handleSaveCards}
            />

            {/* Card Selection Bottom Sheet (Mobile) */}
            <BottomSheet
                isOpen={isBottomSheetOpen}
                onClose={() => setIsBottomSheetOpen(false)}
                title="Add Quick Action Cards"
            >
                <div className="space-y-6">
                    {/* Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Tap cards to add/remove. Selected: <strong>{enabledCards.length}</strong>/12
                        </p>
                    </div>

                    {/* Card Categories */}
                    {Object.entries(groupedCards).map(([category, categoryCards]) => (
                        <div key={category}>
                            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">
                                {categoryLabels[category as keyof typeof categoryLabels]}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {categoryCards.map(card => {
                                    const isEnabled = cards.find(c => c.id === card.id)?.enabled ?? false;
                                    const enabledCount = cards.filter(c => c.enabled).length;
                                    const isDisabled = (!isEnabled && enabledCount >= 12) || (isEnabled && enabledCount <= 1);

                                    return (
                                        <motion.button
                                            key={card.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleToggleCard(card.id)}
                                            disabled={isDisabled}
                                            className={`
                                                p-4 rounded-xl border-2 transition-all text-left min-h-[80px]
                                                ${isEnabled
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                }
                                                ${isDisabled ? 'opacity-50' : ''}
                                            `}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                                    <Icon
                                                        name={card.icon as IconName}
                                                        className={`w-5 h-5 ${isEnabled ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`}
                                                    />
                                                </div>
                                                {isEnabled && (
                                                    <Icon name="checkCircle" className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {card.label}
                                            </p>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Done Button */}
                    <button
                        onClick={() => setIsBottomSheetOpen(false)}
                        className="w-full min-h-[56px] bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-lg"
                    >
                        Done
                    </button>
                </div>
            </BottomSheet>
        </div>
    );
};

export default DashboardCustomizer;
