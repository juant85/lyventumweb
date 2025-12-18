// src/components/ui/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] rounded ${className}`}
            style={{
                animation: 'shimmer 1.5s ease-in-out infinite',
            }}
        />
    );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
    return (
        <div className={`p-6 bg-white dark:bg-slate-800 rounded-lg shadow ${className}`}>
            <Skeleton className="h-6 w-1/3 mb-4" />
            <SkeletonText lines={3} />
            <div className="mt-4 flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
}

export function SkeletonList({ count = 3, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                        <Skeleton className="h-5 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    );
}

// Add shimmer keyframe to global styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `;
    document.head.appendChild(style);
}
