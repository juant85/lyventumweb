import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    maxPullDistance?: number;
    enabled?: boolean;
}

interface PullToRefreshState {
    isPulling: boolean;
    pullDistance: number;
    isRefreshing: boolean;
    canPull: boolean;
}

export const usePullToRefresh = ({
    onRefresh,
    threshold = 80,
    maxPullDistance = 150,
    enabled = true
}: UsePullToRefreshOptions) => {
    const [state, setState] = useState<PullToRefreshState>({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
        canPull: false
    });

    const startY = useRef(0);
    const scrollElement = useRef<HTMLElement | null>(null);

    // Check if we're at the top of the scroll container
    const checkCanPull = useCallback(() => {
        const element = scrollElement.current || document.documentElement;
        return element.scrollTop === 0;
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled || state.isRefreshing) return;

        const canPull = checkCanPull();
        if (canPull) {
            startY.current = e.touches[0].clientY;
            setState(prev => ({ ...prev, canPull: true }));
        }
    }, [enabled, state.isRefreshing, checkCanPull]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enabled || state.isRefreshing || !state.canPull) return;

        const currentY = e.touches[0].clientY;
        const pullDistance = Math.max(0, currentY - startY.current);

        // Only prevent default if we're actually pulling
        if (pullDistance > 0 && checkCanPull()) {
            e.preventDefault();

            // Apply resistance - gets harder to pull as distance increases
            const resistance = 0.5;
            const adjustedDistance = Math.min(
                pullDistance * resistance,
                maxPullDistance
            );

            setState(prev => ({
                ...prev,
                isPulling: true,
                pullDistance: adjustedDistance
            }));
        }
    }, [enabled, state.isRefreshing, state.canPull, maxPullDistance, checkCanPull]);

    const handleTouchEnd = useCallback(async () => {
        if (!enabled || state.isRefreshing || !state.isPulling) {
            setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, canPull: false }));
            return;
        }

        // Check if we crossed the threshold
        if (state.pullDistance >= threshold) {
            setState(prev => ({ ...prev, isRefreshing: true, isPulling: false }));

            try {
                await onRefresh();
            } catch (error) {
                console.error('Pull to refresh error:', error);
            } finally {
                setState(prev => ({ ...prev, isRefreshing: false, pullDistance: 0, canPull: false }));
            }
        } else {
            // Didn't reach threshold, reset
            setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, canPull: false }));
        }
    }, [enabled, state.isRefreshing, state.isPulling, state.pullDistance, threshold, onRefresh]);

    useEffect(() => {
        if (!enabled) return;

        // Add event listeners with passive: false to allow preventDefault
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

    // Calculate progress percentage for UI
    const progress = Math.min((state.pullDistance / threshold) * 100, 100);

    return {
        ...state,
        progress,
        setScrollElement: (element: HTMLElement | null) => {
            scrollElement.current = element;
        }
    };
};
