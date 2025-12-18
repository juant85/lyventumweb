// src/utils/soundEffects.ts
import { ScanStatus } from '../types';

/**
 * Generate synthetic beep using Web Audio API
 * Better than requiring external audio files
 */
const generateBeep = (frequency: number, duration: number, type: OscillatorType = 'sine'): void => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.warn('Web Audio API not supported:', error);
    }
};

/**
 * Play sound effect based on scan status
 * Uses synthetic beeps for better compatibility
 */
export const playScanSound = (status: ScanStatus): void => {
    switch (status) {
        case 'EXPECTED':
            // Success: Higher pitch, pleasant
            generateBeep(800, 0.15, 'sine');
            setTimeout(() => generateBeep(1000, 0.15, 'sine'), 100);
            break;

        case 'WRONG_BOOTH':
            // Warning: Two different tones
            generateBeep(600, 0.2, 'square');
            setTimeout(() => generateBeep(400, 0.2, 'square'), 150);
            break;

        case 'WALK_IN':
            // Info: Neutral tone
            generateBeep(700, 0.2, 'sine');
            break;

        case 'OUT_OF_SCHEDULE':
            // Neutral: Lower tone
            generateBeep(500, 0.25, 'sine');
            break;
    }
};

/**
 * Play vibration pattern based on scan status (mobile only)
 */
export const vibrateScanFeedback = (status: ScanStatus): void => {
    if (!navigator.vibrate) return;

    try {
        const vibrationPatterns: Record<ScanStatus, number | number[]> = {
            EXPECTED: 200, // Single strong vibration
            WRONG_BOOTH: [100, 50, 100, 50, 100], // Triple vibration for warning
            WALK_IN: 150, // Medium vibration
            OUT_OF_SCHEDULE: 100 // Short vibration
        };

        navigator.vibrate(vibrationPatterns[status]);
    } catch (error) {
        console.warn('Vibration not supported:', error);
    }
};

/**
 * Combined audio + haptic feedback
 */
export const playFullScanFeedback = (status: ScanStatus): void => {
    playScanSound(status);
    vibrateScanFeedback(status);
};
