// src/hooks/useDashboardPreferences.ts
import { useState, useEffect, useCallback } from 'react';
import { QuickActionCard, DashboardPreferences } from '../types/dashboard';
import { DEFAULT_CARDS, AVAILABLE_CARDS } from '../constants/availableCards';

const STORAGE_KEY = 'lyventum_dashboard_prefs';
const CURRENT_VERSION = 1;

export const useDashboardPreferences = () => {
    const [cards, setCards] = useState<QuickActionCard[]>(DEFAULT_CARDS);
    const [isLoading, setIsLoading] = useState(true);

    // Load preferences from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const prefs: DashboardPreferences = JSON.parse(saved);

                // Version check - if old version, reset to defaults
                if (prefs.version !== CURRENT_VERSION) {
                    console.log('[Dashboard] Old version detected, resetting to defaults');
                    setCards(DEFAULT_CARDS);
                } else {
                    // Validate cards have required fields
                    const validCards = prefs.cards.filter(card =>
                        card.id && card.label && card.route && typeof card.enabled === 'boolean'
                    );

                    if (validCards.length > 0) {
                        setCards(validCards);
                    } else {
                        setCards(DEFAULT_CARDS);
                    }
                }
            }
        } catch (error) {
            console.error('[Dashboard] Error loading preferences:', error);
            setCards(DEFAULT_CARDS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save preferences to localStorage
    const savePreferences = useCallback((newCards: QuickActionCard[]) => {
        try {
            const prefs: DashboardPreferences = {
                cards: newCards,
                lastModified: new Date().toISOString(),
                version: CURRENT_VERSION,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
            setCards(newCards);
            console.log('[Dashboard] Preferences saved:', newCards.length, 'cards');
        } catch (error) {
            console.error('[Dashboard] Error saving preferences:', error);
        }
    }, []);

    // Reset to default cards
    const resetToDefaults = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setCards(DEFAULT_CARDS);
            console.log('[Dashboard] Reset to defaults');
        } catch (error) {
            console.error('[Dashboard] Error resetting preferences:', error);
        }
    }, []);

    // Get enabled cards sorted by order
    const enabledCards = cards
        .filter(card => card.enabled)
        .sort((a, b) => a.order - b.order);

    return {
        cards,
        enabledCards,
        availableCards: AVAILABLE_CARDS,
        isLoading,
        savePreferences,
        resetToDefaults,
    };
};
