import { useState, useEffect, useCallback } from 'react';
import * as offlineStorage from '../utils/offlineStorage';
import { useEventData } from '../contexts/EventDataContext';
import haptics from '../utils/haptics';

interface UseOfflineSyncReturn {
    isOnline: boolean;
    isSyncing: boolean;
    queueCount: number;
    syncNow: () => Promise<void>;
    clearQueue: () => Promise<void>;
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [queueCount, setQueueCount] = useState(0);
    const { fetchData } = useEventData();

    // Update online/offline status
    useEffect(() => {
        const handleOnline = () => {
            console.log('[OfflineSync] Connection restored');
            setIsOnline(true);
            haptics.success();
            // Auto-sync when coming back online
            syncNow();
        };

        const handleOffline = () => {
            console.log('[OfflineSync] Connection lost');
            setIsOnline(false);
            haptics.warning();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load queue count on mount
    useEffect(() => {
        loadQueueCount();
    }, []);

    const loadQueueCount = async () => {
        try {
            const count = await offlineStorage.getPendingActionsCount();
            setQueueCount(count);
        } catch (error) {
            console.error('[OfflineSync] Error loading queue:', error);
        }
    };

    const syncNow = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            const queue = await offlineStorage.getPendingActions();
            console.log(`[OfflineSync] Syncing ${queue.length} queued actions`);

            for (const action of queue) {
                try {
                    await processQueuedAction(action);
                    await offlineStorage.markActionAsSynced(action.id);
                    console.log(`[OfflineSync] Synced action: ${action.type}`);
                } catch (error) {
                    console.error(`[OfflineSync] Failed to sync action ${action.id}:`, error);
                }
            }

            // Clean up synced actions
            await offlineStorage.clearSyncedActions();

            // Refresh data after sync
            await fetchData();
            await loadQueueCount();

            haptics.success();
        } catch (error) {
            console.error('[OfflineSync] Sync error:', error);
            haptics.error();
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing, fetchData]);

    const processQueuedAction = async (action: offlineStorage.PendingAction): Promise<void> => {
        // Process different action types
        console.log('[OfflineSync] Processing:', action.type, action.data);

        // Implementation depends on your API structure
        // Example:
        // switch (action.type) {
        //   case 'check-in':
        //     await processCheckIn(action.data);
        //     break;
        //   case 'scan':
        //     await processScan(action.data);
        //     break;
        // }
    };

    const clearQueue = useCallback(async () => {
        try {
            await offlineStorage.clearAllCache();
            await loadQueueCount();
            haptics.light();
        } catch (error) {
            console.error('[OfflineSync] Error clearing queue:', error);
            haptics.error();
        }
    }, []);

    return {
        isOnline,
        isSyncing,
        queueCount,
        syncNow,
        clearQueue
    };
};
