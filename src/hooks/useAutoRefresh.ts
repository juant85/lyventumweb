import { useEffect, useState, useRef, useCallback } from 'react';

export interface AutoRefreshConfig {
    enabled: boolean;
    intervalMs: number;
    onRefresh: () => Promise<void> | void;
    pauseOnHidden?: boolean;
}

export interface AutoRefreshState {
    isRefreshing: boolean;
    lastRefreshTime: Date | null;
    enabled: boolean;
    intervalMs: number;
}

export interface AutoRefreshControls {
    toggle: () => void;
    setInterval: (ms: number) => void;
    refresh: () => Promise<void>;
}

/**
 * Hook for automatic data refresh with configurable intervals
 * Features:
 * - Configurable refresh interval
 * - Enable/disable toggle
 * - Manual refresh trigger
 * - Pause when tab/window hidden (battery optimization)
 * - Track last refresh time
 */
export const useAutoRefresh = (
    config: AutoRefreshConfig
): [AutoRefreshState, AutoRefreshControls] => {
    const [enabled, setEnabled] = useState(config.enabled);
    const [intervalMs, setIntervalMs] = useState(config.intervalMs);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isTabVisibleRef = useRef(true);

    // Manual refresh function
    const refresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await config.onRefresh();
            setLastRefreshTime(new Date());
        } catch (error) {
            console.error('[AutoRefresh] Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [config, isRefreshing]);

    // Clear existing interval
    const clearRefreshInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Start auto-refresh interval
    const startRefreshInterval = useCallback(() => {
        clearRefreshInterval();

        if (!enabled || intervalMs <= 0) return;

        intervalRef.current = setInterval(() => {
            // Only refresh if tab is visible (or pauseOnHidden is false)
            if (isTabVisibleRef.current || !config.pauseOnHidden) {
                refresh();
            }
        }, intervalMs);
    }, [enabled, intervalMs, refresh, clearRefreshInterval, config.pauseOnHidden]);

    // Handle visibility change (pause when tab hidden)
    useEffect(() => {
        if (!config.pauseOnHidden) return;

        const handleVisibilityChange = () => {
            isTabVisibleRef.current = !document.hidden;

            // If tab becomes visible and auto-refresh is enabled, refresh immediately
            if (isTabVisibleRef.current && enabled) {
                refresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [config.pauseOnHidden, enabled, refresh]);

    // Start/stop interval when config changes
    useEffect(() => {
        if (enabled) {
            startRefreshInterval();
        } else {
            clearRefreshInterval();
        }

        return clearRefreshInterval;
    }, [enabled, intervalMs, startRefreshInterval, clearRefreshInterval]);

    // Controls
    const controls: AutoRefreshControls = {
        toggle: () => setEnabled(prev => !prev),
        setInterval: (ms: number) => setIntervalMs(ms),
        refresh,
    };

    const state: AutoRefreshState = {
        isRefreshing,
        lastRefreshTime,
        enabled,
        intervalMs,
    };

    return [state, controls];
};

/**
 * Format time ago string
 */
export const getTimeAgoString = (date: Date | null): string => {
    if (!date) return 'Nunca';

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'Justo ahora';
    if (seconds < 60) return `Hace ${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes}m`;

    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h`;
};

/**
 * Common refresh intervals
 */
export const REFRESH_INTERVALS = {
    FAST: 10000,      // 10 seconds
    NORMAL: 30000,    // 30 seconds (default)
    SLOW: 60000,      // 1 minute
    VERY_SLOW: 300000 // 5 minutes
} as const;
