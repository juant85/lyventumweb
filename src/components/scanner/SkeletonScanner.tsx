// src/components/scanner/SkeletonScanner.tsx
import React from 'react';
import { BuildingStorefrontIcon } from '../Icons';

interface SkeletonScannerProps {
    boothName?: string;
    showProgress?: boolean;
}

const SkeletonScanner: React.FC<SkeletonScannerProps> = ({
    boothName = 'Booth',
    showProgress = true
}) => {
    return (
        <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center gap-4">
                <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 animate-pulse"></div>
                <div className="flex gap-2">
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse"></div>
                </div>
            </div>

            {/* Booth Info Skeleton */}
            <div className="text-center">
                <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/50 inline-flex items-center gap-3">
                    <BuildingStorefrontIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <p className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                        Cargando {boothName}...
                    </p>
                </div>

                {showProgress && (
                    <div className="mt-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            <span className="ml-2">Preparando scanner...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Scanner Area Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="w-full max-w-sm mx-auto aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-slate-200 dark:bg-slate-600 rounded-lg mx-auto animate-pulse"></div>
                        <p className="text-slate-500 dark:text-slate-400 animate-pulse">
                            Inicializando cámara...
                        </p>
                    </div>
                </div>
            </div>

            {/* Manual Entry Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-4 animate-pulse"></div>
                <div className="flex gap-3">
                    <div className="flex-1 h-12 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse"></div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonScanner;
