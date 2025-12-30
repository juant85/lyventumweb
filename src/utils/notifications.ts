/**
 * Push Notifications Utility
 * 
 * Handles Web Push Notifications for the mobile app.
 * Manages permission requests, subscription, and notification display.
 * 
 * Browser Support:
 * - Chrome Android: Yes
 * - Safari iOS: PWA only (iOS 16.4+)
 * - Desktop: Yes
 */

import { supabase } from '../supabaseClient';

// Check if Push API is supported
export const isPushSupported = (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Check if user has granted notification permission
export const hasNotificationPermission = (): boolean => {
    return Notification.permission === 'granted';
};

// Request notification permission from user
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isPushSupported()) {
        console.warn('Push notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('Notification permission denied');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
};

// Convert base64 VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
};

export interface PushSubscriptionInfo {
    endpoint: string;
    p256dh: string;
    auth: string;
}

// Subscribe to push notifications
export const subscribeToPush = async (
    vapidPublicKey: string
): Promise<PushSubscriptionInfo | null> => {
    if (!isPushSupported()) {
        console.warn('Push notifications not supported');
        return null;
    }

    if (!hasNotificationPermission()) {
        const granted = await requestNotificationPermission();
        if (!granted) return null;
    }

    try {
        // Register service worker if not already registered
        let registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
            registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('Service Worker registered:', registration);
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
        });

        // Extract keys
        const key = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        if (!key || !auth) {
            throw new Error('Failed to get subscription keys');
        }

        // Convert ArrayBuffer to base64 string
        const p256dhArray = new Uint8Array(key);
        const authArray = new Uint8Array(auth);

        const subscriptionInfo: PushSubscriptionInfo = {
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(p256dhArray))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(authArray)))
        };

        return subscriptionInfo;
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return null;
    }
};

// Save push subscription to Supabase
export const savePushSubscription = async (
    subscriptionInfo: PushSubscriptionInfo,
    userId: string,
    eventId: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                event_id: eventId,
                endpoint: subscriptionInfo.endpoint,
                p256dh: subscriptionInfo.p256dh,
                auth: subscriptionInfo.auth,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,event_id'
            });

        if (error) {
            console.error('Error saving subscription:', error);
            return false;
        }

        console.log('Push subscription saved successfully');
        return true;
    } catch (error) {
        console.error('Exception saving subscription:', error);
        return false;
    }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return true;

        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) return true;

        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        return true;
    } catch (error) {
        console.error('Error unsubscribing:', error);
        return false;
    }
};

// Show a local notification (for testing)
export const showLocalNotification = (
    title: string,
    options?: NotificationOptions
): void => {
    if (!hasNotificationPermission()) {
        console.warn('No notification permission');
        return;
    }

    navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            // vibrate property not in standard NotificationOptions
            ...options
        });
    });
};

// Notification types for the app
export enum NotificationType {
    SESSION_STARTING = 'session_starting',
    SESSION_STARTED = 'session_started',
    BOOTH_CROWDED = 'booth_crowded',
    VIP_ARRIVED = 'vip_arrived',
    ATTENDEE_MISSING = 'attendee_missing',
    SYSTEM_ALERT = 'system_alert'
}

// Create notification in database (to be sent by backend)
export const createNotificationEvent = async (
    eventId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('notification_events')
            .insert({
                event_id: eventId,
                type,
                title,
                body,
                data: data || {}
            });

        if (error) {
            console.error('Error creating notification event:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Exception creating notification:', error);
        return false;
    }
};

export default {
    isPushSupported,
    hasNotificationPermission,
    requestNotificationPermission,
    subscribeToPush,
    savePushSubscription,
    unsubscribeFromPush,
    showLocalNotification,
    createNotificationEvent,
    NotificationType
};
