// src/components/scanner/KioskModeWrapper.tsx
import React, { useEffect, useState } from 'react';
import { Booth } from '../../types';
import Button from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BuildingStorefrontIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

interface KioskModeWrapperProps {
    activeBooth: Booth;
    lastScanResult: {
        success: boolean;
        message: string;
        attendeeName?: string;
    } | null;
    onExitKiosk: () => void;
    children: React.ReactNode;
    stats?: {
        todayScans: number;
        sessionScans: number;
        pendingScans: number;
    };
}

const SuccessOverlay: React.FC<{ attendeeName: string; boothName: string; timestamp: string }> = ({
    attendeeName,
    boothName,
    timestamp
}) => {
    const { t } = useLanguage();

    return (
        <div className="animate-fade-in">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-3xl p-12 shadow-2xl max-w-2xl mx-auto border-4 border-green-400 dark:border-green-600">
                {/* Checkmark animado */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                            <Icon name="checkCircle" size={80} className="text-white" />
                        </div>
                        {/* Círculo pulsante */}
                        <div className="absolute inset-0 w-32 h-32 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                </div>

                {/* Mensaje principal */}
                <div className="text-center space-y-4">
                    <h2 className="text-5xl font-bold text-green-700 dark:text-green-300 mb-6">
                        ✓ {t(localeKeys.kioskCheckInSuccess)}
                    </h2>

                    <div className="space-y-3 text-2xl">
                        <p className="flex items-center justify-center gap-3 text-slate-700 dark:text-slate-200">
                            <Icon name="userCircle" size={32} />
                            <span className="font-semibold">{attendeeName}</span>
                        </p>

                        <p className="flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
                            <Icon name="store" size={28} />
                            <span>{boothName}</span>
                        </p>

                        <p className="flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400 text-xl">
                            <Icon name="clock" size={24} />
                            <span>{timestamp}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KioskModeWrapper: React.FC<KioskModeWrapperProps> = ({
    activeBooth,
    lastScanResult,
    onExitKiosk,
    children,
    stats = { todayScans: 0, sessionScans: 0, pendingScans: 0 }
}) => {
    const { t } = useLanguage();
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState<{ name: string; time: string } | null>(null);

    // Auto-reset después de scan exitoso
    useEffect(() => {
        if (lastScanResult?.success) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            });

            setSuccessData({
                name: lastScanResult.attendeeName || 'Asistente',
                time: timeStr
            });
            setShowSuccess(true);

            const timer = setTimeout(() => {
                setShowSuccess(false);
                setSuccessData(null);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [lastScanResult]);

    // Fullscreen al entrar
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                await document.documentElement.requestFullscreen();
            } catch (err) {
                console.warn('Fullscreen not supported or denied:', err);
            }
        };

        enterFullscreen();

        // Exit fullscreen al desmontar
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        };
    }, []);

    // Keep screen awake (usando Wake Lock API si está disponible)
    useEffect(() => {
        let wakeLock: any = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('Wake Lock acquired');
                }
            } catch (err) {
                console.warn('Wake Lock not supported:', err);
            }
        };

        requestWakeLock();

        return () => {
            if (wakeLock) {
                wakeLock.release().then(() => {
                    console.log('Wake Lock released');
                });
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
            {/* Header con stats */}
            <div className="h-28 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 text-white shadow-xl">
                <div className="h-full px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <BuildingStorefrontIcon className="w-12 h-12" />
                        <div>
                            <h1 className="text-4xl font-bold">{activeBooth.companyName}</h1>
                            <p className="text-lg text-primary-100">{t(localeKeys.booth)} {activeBooth.physicalId}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 text-center">
                        <div>
                            <p className="text-5xl font-bold">{stats.todayScans}</p>
                            <p className="text-sm text-primary-100">{t(localeKeys.kioskScansToday)}</p>
                        </div>
                        <div>
                            <p className="text-5xl font-bold">{stats.sessionScans}</p>
                            <p className="text-sm text-primary-100">{t(localeKeys.kioskThisSession)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="h-[calc(100vh-14rem)] flex items-center justify-center px-6">
                {showSuccess && successData ? (
                    <SuccessOverlay
                        attendeeName={successData.name}
                        boothName={activeBooth.companyName}
                        timestamp={successData.time}
                    />
                ) : (
                    <div className="text-center w-full max-w-2xl mx-auto">
                        {/* Scanner container - Tamaño balanceado */}
                        <div className="mb-6">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border-4 border-primary-500/20">
                                {/* Scanner - proporción elegante */}
                                <div className="mx-auto" style={{ maxWidth: '580px' }}>
                                    {children}
                                </div>
                            </div>
                        </div>

                        {/* Instrucciones */}
                        <div className="space-y-3">
                            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                                👋 {t(localeKeys.kioskWelcome)}
                            </h2>
                            <p className="text-2xl text-slate-600 dark:text-slate-300 font-medium">
                                {t(localeKeys.kioskScanPrompt)}
                            </p>
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <Icon name="qr" size={36} className="text-primary-500 animate-pulse" />
                                <span className="text-xl text-slate-500 dark:text-slate-400">
                                    {t(localeKeys.kioskPointCamera)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Footer con botón logout y estado */}
            <div className="h-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="h-full px-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Status indicator */}
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-lg font-medium text-slate-700 dark:text-slate-200">
                                {t(localeKeys.kioskSystemActive)}
                            </span>
                        </div>

                        {/* Pending scans warning */}
                        {stats.pendingScans > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                <Icon name="refresh" size={20} className="text-yellow-600 dark:text-yellow-400 animate-spin" />
                                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                    {stats.pendingScans} {t(localeKeys.kioskPendingScans)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Botón de salir */}
                    <Button
                        onClick={onExitKiosk}
                        variant="neutral"
                        size="lg"
                        leftIcon={<Icon name="logout" size={24} />}
                    >
                        {t(localeKeys.exitKioskMode)}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default KioskModeWrapper;
