import React, { ReactNode, useRef, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';

interface SwipeAction {
    icon: ReactNode;
    color: 'blue' | 'green' | 'amber' | 'red';
    label: string;
    onTrigger: () => void;
}

interface SwipeableCardProps {
    children: ReactNode;
    leftAction?: SwipeAction;
    rightAction?: SwipeAction;
    threshold?: number;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
    children,
    leftAction,
    rightAction,
    threshold = 100,
}) => {
    const x = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);
    const [actionTriggered, setActionTriggered] = useState(false);

    // Color maps
    const colorMap = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
    };

    // Transform for background reveal
    const leftBg = useTransform(x, [0, threshold], ['0%', '100%']);
    const rightBg = useTransform(x, [-threshold, 0], ['100%', '0%']);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        const offset = info.offset.x;

        // Trigger action if threshold reached
        if (Math.abs(offset) > threshold) {
            if (offset > 0 && leftAction) {
                leftAction.onTrigger();
                setActionTriggered(true);
                // Visual feedback
                setTimeout(() => {
                    x.set(0);
                    setActionTriggered(false);
                }, 300);
                return;
            } else if (offset < 0 && rightAction) {
                rightAction.onTrigger();
                setActionTriggered(true);
                setTimeout(() => {
                    x.set(0);
                    setActionTriggered(false);
                }, 300);
                return;
            }
        }

        // Snap back if not triggered
        x.set(0);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl">
            {/* Left Action Background */}
            {leftAction && (
                <motion.div
                    className={`absolute inset-y-0 left-0 ${colorMap[leftAction.color]} flex items-center justify-start px-6 z-0`}
                    style={{ width: leftBg }}
                >
                    <div className="flex items-center gap-2 text-white">
                        {leftAction.icon}
                        <span className="text-sm font-bold">{leftAction.label}</span>
                    </div>
                </motion.div>
            )}

            {/* Right Action Background */}
            {rightAction && (
                <motion.div
                    className={`absolute inset-y-0 right-0 ${colorMap[rightAction.color]} flex items-center justify-end px-6 z-0`}
                    style={{ width: rightBg }}
                >
                    <div className="flex items-center gap-2 text-white">
                        <span className="text-sm font-bold">{rightAction.label}</span>
                        {rightAction.icon}
                    </div>
                </motion.div>
            )}

            {/* Swipeable Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: rightAction ? -threshold * 1.5 : 0, right: leftAction ? threshold * 1.5 : 0 }}
                dragElastic={0.2}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className={`relative z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${actionTriggered ? 'opacity-80' : ''}`}
            >
                {children}
            </motion.div>
        </div>
    );
};

export default SwipeableCard;
