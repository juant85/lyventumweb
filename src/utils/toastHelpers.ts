// src/utils/toastHelpers.ts
// Centralized toast utilities with haptic feedback and success animations

import { toast, ToastOptions } from 'react-hot-toast';

/**
 * Show success toast with haptic feedback and animation
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
    // Haptic feedback (mobile only)
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }

    return toast.success(message, {
        icon: '✅',
        duration: 3000,
        ...options,
    });
};

/**
 * Show error toast with haptic feedback
 */
export const showError = (message: string, options?: ToastOptions) => {
    // Triple vibrate for errors (mobile only)
    if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
    }

    return toast.error(message, {
        duration: 4000,
        ...options,
    });
};

/**
 * Show loading toast
 */
export const showLoading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, options);
};

/**
 * Show info toast
 */
export const showInfo = (message: string, options?: ToastOptions) => {
    return toast(message, {
        icon: 'ℹ️',
        duration: 3000,
        ...options,
    });
};

/**
 * Dismiss a specific toast or all toasts
 */
export const dismissToast = (toastId?: string) => {
    if (toastId) {
        toast.dismiss(toastId);
    } else {
        toast.dismiss();
    }
};
