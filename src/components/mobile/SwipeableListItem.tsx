import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Edit2 } from 'lucide-react';
import haptics from '../../utils/haptics';

interface SwipeableListItemProps {
    children: React.ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    disabled?: boolean;
}

/**
 * Swipeable wrapper for list items
 * - Swipe left: Reveal delete action (red)
 * - Swipe right: Reveal edit action (blue)
 * - Supports haptic feedback
 */
const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
    children,
    onEdit,
    onDelete,
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const x = useMotionValue(0);

    // Transform x position to opacity for action buttons
    const deleteOpacity = useTransform(x, [-100, -60, 0], [1, 0.5, 0]);
    const editOpacity = useTransform(x, [0, 60, 100], [0, 0.5, 1]);

    const handleDragStart = () => {
        setIsDragging(true);
        haptics.selection();
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        setIsDragging(false);
        const threshold = 80; // pixels to trigger action

        if (info.offset.x < -threshold && onDelete) {
            // Swiped left far enough - trigger delete
            haptics.medium();
            onDelete();
        } else if (info.offset.x > threshold && onEdit) {
            // Swiped right far enough - trigger edit
            haptics.light();
            onEdit();
        }

        // Reset position
        x.set(0);
    };

    if (disabled || (!onEdit && !onDelete)) {
        // No swipe actions available
        return <>{children}</>;
    }

    return (
        <div className="relative overflow-hidden">
            {/* Delete Button (Left side - revealed by swiping left) */}
            {onDelete && (
                <motion.div
                    style={{ opacity: deleteOpacity }}
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-6 bg-red-500 rounded-r-xl"
                >
                    <Trash2 className="w-5 h-5 text-white" />
                </motion.div>
            )}

            {/* Edit Button (Right side - revealed by swiping right) */}
            {onEdit && (
                <motion.div
                    style={{ opacity: editOpacity }}
                    className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-6 bg-blue-500 rounded-l-xl"
                >
                    <Edit2 className="w-5 h-5 text-white" />
                </motion.div>
            )}

            {/* Swipeable Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: onDelete ? -120 : 0, right: onEdit ? 120 : 0 }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
            >
                {children}
            </motion.div>
        </div>
    );
};

export default SwipeableListItem;
