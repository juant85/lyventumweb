// src/components/ui/SkeletonCard.tsx
import React from 'react';

export const StatCardSkeleton: React.FC = () => (
    <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 animate-pulse">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="h-3 w-24 bg-slate-700 rounded mb-3"></div>
                <div className="h-10 w-16 bg-slate-600 rounded mb-2"></div>
            </div>
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg"></div>
        </div>
    </div>
);

export const BoothCardSkeleton: React.FC = () => (
    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 animate-pulse">
        <div className="flex justify-between items-start mb-2">
            <div className="h-5 w-32 bg-slate-700 rounded"></div>
            <div className="h-4 w-8 bg-slate-700 rounded"></div>
        </div>
        <div className="h-10 w-24 bg-slate-600 rounded mb-2"></div>
        <div className="h-4 w-20 bg-slate-700 rounded mb-3"></div>
        <div className="w-full h-2 bg-slate-700 rounded-full"></div>
    </div>
);

export const ActivityFeedSkeleton: React.FC = () => (
    <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 animate-pulse">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                    <div className="h-4 w-full bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 w-20 bg-slate-700/70 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);

export default {
    StatCardSkeleton,
    BoothCardSkeleton,
    ActivityFeedSkeleton,
};
