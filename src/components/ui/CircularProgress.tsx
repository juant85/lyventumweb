import React from 'react';

interface CircularProgressProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    showPercentage?: boolean;
}

export default function CircularProgress({
    value,
    max,
    size = 80,
    strokeWidth = 8,
    label,
    showPercentage = true
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-gray-200 dark:text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="text-primary-600 dark:text-primary-400 transition-all duration-500 ease-out"
                    />
                </svg>
                {/* Center content */}
                {showPercentage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {Math.round(percentage)}%
                        </span>
                    </div>
                )}
            </div>
            {label && (
                <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {label}
                </span>
            )}
        </div>
    );
}
