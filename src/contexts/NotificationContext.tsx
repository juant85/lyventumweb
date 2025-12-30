import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSelectedEvent } from './SelectedEventContext';
import notifications, { PushSubscriptionInfo } from '../utils/notifications';

interface NotificationContextType {
    isSupported: boolean;
    hasPermission: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    requestPermission: () => Promise<boolean>;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    showTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const { selectedEventId } = useSelectedEvent();

    const [isSupported] = useState(notifications.isPushSupported());
    const [hasPermission, setHasPermission] = useState(notifications.hasNotificationPermission());
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check if already subscribed on mount
    useEffect(() => {
        const checkSubscription = async () => {
            if (!isSupported) return;

            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (!registration) return;

                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (error) {
                console.error('Error checking subscription:', error);
            }
        };

        checkSubscription();
    }, [isSupported]);

    const requestPermission = async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            const granted = await notifications.requestNotificationPermission();
            setHasPermission(granted);
            return granted;
        } finally {
            setIsLoading(false);
        }
    };

    const subscribe = async (): Promise<boolean> => {
        if (!currentUser || !selectedEventId) {
            console.warn('Cannot subscribe: no user or event selected');
            return false;
        }

        setIsLoading(true);
        try {
            // Get VAPID public key from env
            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                console.error('VAPID public key not configured');
                return false;
            }

            // Subscribe to push
            const subscriptionInfo = await notifications.subscribeToPush(vapidKey);
            if (!subscriptionInfo) return false;

            // Save to database
            const saved = await notifications.savePushSubscription(
                subscriptionInfo,
                currentUser.id,
                selectedEventId
            );

            if (saved) {
                setIsSubscribed(true);
                return true;
            }

            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            const success = await notifications.unsubscribeFromPush();
            if (success) {
                setIsSubscribed(false);
            }
            return success;
        } finally {
            setIsLoading(false);
        }
    };

    const showTestNotification = () => {
        notifications.showLocalNotification('Test Notification', {
            body: 'This is a test notification from Lyventum',
            icon: '/icon-192x192.png',
            tag: 'test',
            requireInteraction: false
        });
    };

    return (
        <NotificationContext.Provider
            value={{
                isSupported,
                hasPermission,
                isSubscribed,
                isLoading,
                requestPermission,
                subscribe,
                unsubscribe,
                showTestNotification
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
