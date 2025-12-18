import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number; // milliseconds
    className?: string;
    suffix?: string;
}

export default function AnimatedCounter({
    value,
    duration = 800,
    className = '',
    suffix = ''
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - percentage, 3);
            setDisplayValue(Math.floor(eased * value));

            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value); // Ensure final value is exact
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return (
        <span className={className}>
            {displayValue}{suffix}
        </span>
    );
}
