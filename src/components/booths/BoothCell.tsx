import React from 'react';
import { Booth, BoothStatus } from '../../types';

interface BoothCellProps {
    booth: Booth;
    current: number;
    expected: number;
    status: BoothStatus;
    onClick: () => void;
    compact?: boolean;
    isDraggable?: boolean;
    isRecentlyChanged?: boolean; // NEW: For highlighting recently changed booths
}

export const BoothCell: React.FC<BoothCellProps> = ({
    booth,
    current,
    expected,
    status,
    onClick,
    compact = false,
    isDraggable = false,
    isRecentlyChanged = false, // NEW
}) => {
    // Helper for class names
    const getClassNames = (...classes: (string | boolean | undefined)[]): string => {
        return classes.filter(Boolean).join(' ');
    };

    const Component = isDraggable ? 'div' : 'button';

    return (
        <Component
            onClick={!isDraggable ? onClick : undefined}
            className={getClassNames(
                "booth-cell group relative rounded-lg w-full",
                "p-2 sm:p-2.5",  // Responsive padding
                "min-w-[80px] sm:min-w-[90px]",  // Responsive min-width
                "flex flex-col items-center justify-center",
                "border-2 font-bold transition-all duration-200",
                "backdrop-blur-sm",
                "min-h-[60px] sm:min-h-[70px]",  // Minimum tap target

                // Touch optimizations - applies on touch devices
                "touch-manipulation",  // Remove 300ms delay
                "select-none",  // Prevent text selection on drag
                "[@media(hover:none)]:min-w-[100px]",  // Larger on touch devices
                "[@media(hover:none)]:min-h-[80px]",
                "[@media(hover:none)]:p-3",

                // Interactive states only when NOT draggable
                !isDraggable && "cursor-pointer hover:scale-105 hover:-translate-y-1 hover:z-10 hover:shadow-xl",
                !isDraggable && "active:scale-100 active:translate-y-0",  // Touch feedback
                !isDraggable && "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",

                // Draggable specific styles - better visual feedback
                isDraggable && "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary-400 hover:ring-offset-1 hover:shadow-lg",
                isDraggable && "active:opacity-80",  // Touch feedback when dragging

                // Status-based styling with better contrast
                status === 'empty' && "bg-gradient-to-br from-red-500 to-red-600 border-red-400/50 text-white shadow-lg shadow-red-500/50",
                status === 'empty' && !isDraggable && "animate-pulse",
                status === 'partial' && "bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300/50 text-slate-900 shadow-md",
                status === 'full' && "bg-gradient-to-br from-green-500 to-green-600 border-green-400/50 text-white shadow-md",

                // NEW: Highlight animation for recently changed booths
                isRecentlyChanged && "ring-4 ring-green-400 animate-pulse-ring",

                compact && "p-1.5 text-xs min-w-[70px] min-h-[50px]",
            )}
        >
            {/* Pulsing glow for empty booths - disable when dragging */}
            {status === 'empty' && !isDraggable && (
                <div className="absolute inset-0 rounded-lg bg-red-500/20 animate-pulse pointer-events-none" />
            )}

            {/* Urgent badge for empty booths */}
            {status === 'empty' && !compact && (
                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] px-1 py-0.5 rounded-full font-bold animate-bounce">
                    ⚠️
                </div>
            )}

            {/* Content - Responsive sizing */}
            <div className="relative z-10 space-y-1 pointer-events-none w-full flex flex-col items-center">
                {/* Booth ID - Responsive font size */}
                <div className={`font-black tracking-tight ${compact ? "text-xs" : "text-base sm:text-lg"
                    }`}>
                    {booth.physicalId}
                </div>

                {/* Occupancy - Always visible, scaled down on mobile */}
                {!compact && (
                    <div className="text-[10px] sm:text-xs font-bold opacity-95">
                        {current}/{expected}
                    </div>
                )}

                {/* Company - Hidden on very small screens, visible on sm+ */}
                {!compact && (
                    <div className="hidden sm:block text-[9px] sm:text-[10px] font-medium opacity-90 truncate max-w-[75px] sm:max-w-[85px] text-center">
                        {booth.companyName}
                    </div>
                )}
            </div>
        </Component>
    );
};

export default BoothCell;
