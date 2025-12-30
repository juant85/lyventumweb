import React from 'react';

interface SkeletonCardProps {
    count?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 3 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse"
                >
                    <div className="flex items-center gap-3">
                        {/* Icon skeleton */}
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0" />

                        <div className="flex-1 space-y-2">
                            {/* Title skeleton */}
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                            {/* Subtitle skeleton */}
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        </div>

                        {/* Badge skeleton (optional) */}
                        {index % 2 === 0 && (
                            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        )}
                    </div>

                    {/* Actions skeleton */}
                    <div className="mt-3 h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
            ))}
        </>
    );
};

export default SkeletonCard;
