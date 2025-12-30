import { useEffect, useRef, useState } from 'react';
import { useEventData } from '../contexts/EventDataContext';

interface UseAutoRefreshOptions {
    intervalMs?: number;
    enabled?: boolean;
    onlyWhenActive?: boolean; // Stop refreshing when tab is hidden
}

export const useAutoRefresh = (options: UseAutoRefreshOptions = {}) => {
    const {
        intervalMs = 15000, // Default: 15 seconds
        enabled = true,
        onlyWhenActive = true
    } = options;

    const { fetchData } = useEventData();
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const handleRefresh = async () => {
            // Check if tab is active (if option enabled)
            if (onlyWhenActive && document.hidden) {
                return;
            }

            setIsRefreshing(true);
            try {
                await fetchData();
                setLastUpdated(new Date());
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            } finally {
                setIsRefreshing(false);
            }
        };

        // Initial fetch
        handleRefresh();

        // Set up interval
        intervalRef.current = setInterval(handleRefresh, intervalMs);

        // Handle visibility change
        const handleVisibilityChange = () => {
            if (!document.hidden && onlyWhenActive) {
                // Tab became active, refresh immediately
                handleRefresh();
            }
        };

        if (onlyWhenActive) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (onlyWhenActive) {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [enabled, intervalMs, onlyWhenActive, fetchData]);

    const manualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchData();
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Manual refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return {
        lastUpdated,
        isRefreshing,
        manualRefresh
    };
};
