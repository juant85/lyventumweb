// src/hooks/usePendingActions.ts
import { useState, useEffect } from 'react';
import { getPendingActionsCount } from '../utils/offlineStorage';
import { useOnlineStatus } from './useOnlineStatus';

export function usePendingActions() {
    const [pendingCount, setPendingCount] = useState(0);
    const { isOnline } = useOnlineStatus();

    useEffect(() => {
        async function updateCount() {
            const count = await getPendingActionsCount();
            setPendingCount(count);
        }

        updateCount();

        // Update count every 5 seconds
        const interval = setInterval(updateCount, 5000);

        return () => clearInterval(interval);
    }, [isOnline]);

    return pendingCount;
}
