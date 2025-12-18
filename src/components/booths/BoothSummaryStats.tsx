import React from 'react';
import { Booth } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

interface BoothSummaryStatsProps {
    booths: Array<{ booth: Booth; attendeesCount: number; capacity: number }>;
}

export const BoothSummaryStats: React.FC<BoothSummaryStatsProps> = ({ booths }) => {
    const { t } = useLanguage();

    const totalBooths = booths.length;
    const emptyBooths = booths.filter(b => b.attendeesCount === 0).length;

    // Booth status breakdown - matches visual color coding
    const fullBooths = booths.filter(b => b.attendeesCount >= b.capacity && b.capacity > 0).length; // Green
    const activeBooths = booths.filter(b => b.attendeesCount > 0 && b.attendeesCount < b.capacity).length; // Yellow/Amber

    // Calculate total attendees and total capacity
    const totalAttendees = booths.reduce((sum, b) => sum + b.attendeesCount, 0);
    const totalCapacity = booths.reduce((sum, b) => sum + b.capacity, 0);

    // Calculate average occupancy percentage (same logic as DataVisualizationPage avgOccupancy)
    // Only count booths with capacity > 0 for both numerator and denominator
    const boothsWithCapacity = booths.filter(b => b.capacity > 0);
    const totalOccupancy = boothsWithCapacity.reduce((sum, b) => {
        return sum + (b.attendeesCount / b.capacity) * 100;
    }, 0);
    const occupancyPercent = boothsWithCapacity.length > 0 ? Math.round(totalOccupancy / boothsWithCapacity.length) : 0;

    return (
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    {/* Overall Status */}
                    <div className="flex items-center gap-3">
                        <div className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-200">
                            {occupancyPercent}%
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t(localeKeys.occupancy)}</div>
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {totalAttendees}/{totalCapacity} {t(localeKeys.full)}
                            </div>
                        </div>
                    </div>

                    {/* Divider - Hidden on mobile */}
                    <div className="hidden sm:block h-12 w-px bg-slate-300 dark:bg-slate-600" />

                    {/* Booth Status Breakdown - Visual Color Coding */}
                    <div className="flex flex-wrap gap-2">
                        {/* Full Booths (Green) */}
                        {fullBooths > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {fullBooths} {fullBooths > 1 ? t(localeKeys.full) : t(localeKeys.full)}
                                </span>
                            </div>
                        )}

                        {/* Active Booths (Yellow/Amber) */}
                        {activeBooths > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                    {activeBooths} active
                                </span>
                            </div>
                        )}

                        {/* Empty Booths (Red) */}
                        {emptyBooths > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                    {emptyBooths} {emptyBooths > 1 ? t(localeKeys.empty).toLowerCase() + 's' : t(localeKeys.empty).toLowerCase()}
                                </span>
                            </div>
                        )}

                        {/* All Occupied Success Message */}
                        {emptyBooths === 0 && fullBooths === totalBooths && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                                <div className="text-green-600 dark:text-green-400 text-sm">✓</div>
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {t(localeKeys.allBoothsOccupied)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar - Full width on mobile */}
                <div className="w-full sm:w-48">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{t(localeKeys.progress)}</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${occupancyPercent >= 80 ? 'bg-green-500' :
                                occupancyPercent >= 50 ? 'bg-amber-500' :
                                    'bg-red-500'
                                }`}
                            style={{ width: `${occupancyPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
