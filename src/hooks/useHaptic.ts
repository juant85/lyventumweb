// src/hooks/useHaptic.ts
import { useCallback } from 'react';

type HapticIntensity = 'light' | 'medium' | 'heavy';

export function useHaptic() {
    const vibrate = useCallback((intensity: HapticIntensity = 'light') => {
        // Check if vibration API is supported
        if (!navigator.vibrate) {
            return;
        }

        // Vibration patterns (in milliseconds)
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 50,
        };

        try {
            navigator.vibrate(patterns[intensity]);
        } catch (error) {
            console.warn('[Haptic] Vibration failed:', error);
        }
    }, []);

    const success = useCallback(() => vibrate('medium'), [vibrate]);
    const error = useCallback(() => vibrate('heavy'), [vibrate]);
    const tap = useCallback(() => vibrate('light'), [vibrate]);

    return {
        vibrate,
        success,
        error,
        tap,
    };
}
