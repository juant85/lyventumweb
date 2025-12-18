import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile size
 * @param breakpoint - Breakpoint in pixels (default: 768px for tablets)
 * @returns boolean indicating if viewport is below breakpoint
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Check on mount
        checkMobile();

        // Add listener for resize
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint]);

    return isMobile;
};

/**
 * Hook to get current breakpoint tier
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export const useBreakpoint = (): 'mobile' | 'tablet' | 'desktop' => {
    const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

    useEffect(() => {
        const checkBreakpoint = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setBreakpoint('mobile');
            } else if (width < 1024) {
                setBreakpoint('tablet');
            } else {
                setBreakpoint('desktop');
            }
        };

        checkBreakpoint();
        window.addEventListener('resize', checkBreakpoint);
        return () => window.removeEventListener('resize', checkBreakpoint);
    }, []);

    return breakpoint;
};
