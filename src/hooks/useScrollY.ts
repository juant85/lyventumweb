import { useState, useEffect } from 'react';

/**
 * Hook to track vertical scroll position
 * @returns Current scroll Y position in pixels
 */
export function useScrollY(): number {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        // Set initial value
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return scrollY;
}
