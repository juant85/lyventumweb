/**
 * Haptic Feedback Utility
 * 
 * Provides vibration feedback for mobile devices.
 * Uses the Vibration API when available.
 * 
 * Browser Support:
 * - Chrome Android: Yes
 * - Safari iOS: Partial (PWA only)
 * - Desktop: No-op
 */

// Check if vibration API is available
const isVibrationSupported = (): boolean => {
    return 'vibrate' in navigator;
};

/**
 * Base vibration function
 * @param pattern - Vibration pattern in milliseconds
 */
const vibrate = (pattern: number | number[]): void => {
    if (isVibrationSupported()) {
        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.warn('Vibration failed:', error);
        }
    }
};

/**
 * Haptic Feedback Patterns
 */
export const haptics = {
    /**
     * Light tap - Ultra short feedback (5ms)
     * Use for: List selection, button hover
     */
    light: () => vibrate(5),

    /**
     * Selection - Short tick (7ms)
     * Use for: Tab switching, filter selection
     */
    selection: () => vibrate(7),

    /**
     * Medium - Standard feedback (10ms)
     * Use for: Button press, card tap
     */
    medium: () => vibrate(10),

    /**
     * Success - Double pulse (10ms, pause 50ms, 10ms)
     * Use for: Successful action, check-in completed
     */
    success: () => vibrate([10, 50, 10]),

    /**
     * Warning - Triple pulse (10ms, pause 30ms, repeat)
     * Use for: Confirmation needed, near capacity
     */
    warning: () => vibrate([10, 30, 10, 30, 10]),

    /**
     * Error - Heavy triple pulse (15ms, pause 50ms, repeat)
     * Use for: Failed action, validation error
     */
    error: () => vibrate([15, 50, 15, 50, 15]),

    /**
     * Impact - Single strong pulse (20ms)
     * Use for: Swipe action completed, pull-to-refresh triggered
     */
    impact: () => vibrate(20),

    /**
     * Notification - Gentle pattern (10ms, pause 100ms, 15ms)
     * Use for: New message, background update
     */
    notification: () => vibrate([10, 100, 15]),

    /**
     * Check if haptic feedback is available
     */
    isSupported: isVibrationSupported,

    /**
     * Stop any ongoing vibration
     */
    cancel: () => vibrate(0),

    /**
     * Custom pattern
     * @param pattern - Custom vibration pattern
     */
    custom: (pattern: number | number[]) => vibrate(pattern)
};

/**
 * Haptic feedback with user preference check
 * In a real app, you'd want to check a user setting here
 */
export const hapticWithPreference = {
    light: () => {
        // Could check: if (userPreferences.haptics) haptics.light()
        haptics.light();
    },
    selection: () => haptics.selection(),
    medium: () => haptics.medium(),
    success: () => haptics.success(),
    warning: () => haptics.warning(),
    error: () => haptics.error(),
    impact: () => haptics.impact(),
    notification: () => haptics.notification()
};

export default haptics;
