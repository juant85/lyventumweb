import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
    items: T[];
    estimatedItemSize: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
}

/**
 * Virtualized List Component
 * Renders only visible items for ultra-smooth scrolling
 * Perfect for long lists (100+ items)
 * 
 * Performance benefits:
 * - Only renders ~10-15 visible items instead of all
 * - Smooth 60fps scrolling even with 1000+ items
 * - Dramatically reduced memory usage
 */
function VirtualizedList<T>({
    items,
    estimatedItemSize,
    renderItem,
    className = ''
}: VirtualizedListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedItemSize,
        overscan: 5 // Render extra items above/below viewport
    });

    return (
        <div
            ref={parentRef}
            className={`overflow-auto ${className}`}
            style={{ height: '100%' }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative'
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`
                        }}
                    >
                        {renderItem(items[virtualItem.index], virtualItem.index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default VirtualizedList;
