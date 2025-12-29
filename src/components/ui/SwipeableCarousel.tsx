import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface SwipeableCarouselProps {
    children: ReactNode[];
    showIndicators?: boolean;
    className?: string;
}

const SwipeableCarousel: React.FC<SwipeableCarouselProps> = ({
    children,
    showIndicators = true,
    className = '',
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 50;
        const { offset, velocity } = info;

        if (Math.abs(offset.x) > threshold || Math.abs(velocity.x) > 500) {
            if (offset.x > 0 && currentIndex > 0) {
                // Swipe right - previous
                setDirection(-1);
                setCurrentIndex(currentIndex - 1);
            } else if (offset.x < 0 && currentIndex < children.length - 1) {
                // Swipe left - next
                setDirection(1);
                setCurrentIndex(currentIndex + 1);
            }
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0,
        }),
    };

    return (
        <div className={`relative ${className}`}>
            <div className="overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.3}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing"
                    >
                        {children[currentIndex]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Indicators */}
            {showIndicators && children.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {children.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setDirection(index > currentIndex ? 1 : -1);
                                setCurrentIndex(index);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'w-8 bg-primary-600'
                                    : 'w-1.5 bg-slate-300 dark:bg-slate-600'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SwipeableCarousel;
