// src/components/scanner/ScanResultCard.tsx
import React, { useEffect } from 'react';
import { ScanResult } from '../../types';
import { Icon } from '../ui/Icon';
import Button from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import { playFullScanFeedback } from '../../utils/soundEffects';
import { UserPlusIcon } from '../Icons';

interface ScanResultCardProps {
    result: ScanResult;
    onNext: () => void;
    autoCloseDelay?: number; // milliseconds, default 0 (no auto-close)
}

const ScanResultCard: React.FC<ScanResultCardProps> = ({
    result,
    onNext,
    autoCloseDelay = 0
}) => {
    const { t } = useLanguage();

    // Play audio + vibration feedback on mount
    useEffect(() => {
        playFullScanFeedback(result.status);
    }, []); // Only on mount

    // Auto-close timer
    useEffect(() => {
        if (autoCloseDelay > 0 && result.success) {
            const timer = setTimeout(onNext, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [autoCloseDelay, onNext, result.success]);

    // Color scheme by status
    const colorScheme = {
        EXPECTED: {
            bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
            icon: 'checkCircle' as const,
            iconColor: 'text-white',
            textColor: 'text-white',
            borderColor: 'border-green-400'
        },
        WRONG_BOOTH: {
            bg: 'bg-gradient-to-br from-orange-500 to-amber-600',
            icon: 'visualize' as const, // Using visualize as warning/alert icon
            iconColor: 'text-white',
            textColor: 'text-white',
            borderColor: 'border-orange-400'
        },
        WALK_IN: {
            bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            icon: 'attendees' as const, // Using attendees as walk-in/person icon
            iconColor: 'text-white',
            textColor: 'text-white',
            borderColor: 'border-blue-400'
        },
        OUT_OF_SCHEDULE: {
            bg: 'bg-gradient-to-br from-slate-500 to-gray-600',
            icon: 'clock' as const,
            iconColor: 'text-white',
            textColor: 'text-white',
            borderColor: 'border-slate-400'
        }
    };

    const colors = colorScheme[result.status];

    // Title by status
    const getTitle = (): string => {
        switch (result.status) {
            case 'EXPECTED':
                return t(localeKeys.scanStatusExpected);
            case 'WRONG_BOOTH':
                return t(localeKeys.scanStatusWrongBooth);
            case 'WALK_IN':
                return t(localeKeys.scanStatusWalkIn);
            case 'OUT_OF_SCHEDULE':
                return t(localeKeys.scanStatusOutOfSchedule);
        }
    };

    // Subtitle by status
    const getSubtitle = (): string => {
        switch (result.status) {
            case 'EXPECTED':
                return t(localeKeys.expectedSubtitle);
            case 'WRONG_BOOTH':
                return result.details?.expectedBoothName
                    ? t(localeKeys.wrongBoothSubtitle).replace('{boothName}', result.details.expectedBoothName)
                    : t(localeKeys.wrongBoothSubtitle);
            case 'WALK_IN':
                return t(localeKeys.walkInSubtitle);
            case 'OUT_OF_SCHEDULE':
                return t(localeKeys.outOfScheduleSubtitle);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="max-w-md w-full mx-4 animate-[slideInUp_0.3s_ease-out]">
                {/* Main Card */}
                <div className={`${colors.bg} rounded-3xl shadow-2xl border-4 ${colors.borderColor} overflow-hidden`}>

                    {/* Icon Header */}
                    <div className="flex justify-center pt-12 pb-8">
                        <div className="relative">
                            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center animate-[bounce_0.6s_ease-in-out]">
                                <Icon name={colors.icon} size={80} className={colors.iconColor} />
                            </div>
                            {/* Pulse ring */}
                            <div className="absolute inset-0 w-32 h-32 bg-white/30 rounded-full animate-ping"></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`px-8 pb-8 ${colors.textColor}`}>
                        {/* Title */}
                        <h2 className="text-4xl font-bold text-center mb-4">
                            {getTitle()}
                        </h2>

                        {/* Attendee Name */}
                        <div className="text-center mb-6">
                            {result.details?.attendeePhoto && (
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/30">
                                    <img
                                        src={result.details.attendeePhoto}
                                        alt="Attendee"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <p className="text-3xl font-semibold">
                                {result.scan?.attendeeName || 'Asistente'}
                            </p>
                            {result.details?.sessionName && (
                                <p className="text-lg opacity-90 mt-2">
                                    {result.details.sessionName}
                                </p>
                            )}

                            {/* Walk-in Badge - NEW */}
                            {result.status === 'WALK_IN' && (
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full border-2 border-white/40 backdrop-blur-sm">
                                    <UserPlusIcon className="w-5 h-5 text-white" />
                                    <span className="text-sm font-bold uppercase tracking-wider">
                                        Lead Capturado
                                    </span>
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                </div>
                            )}
                        </div>

                        {/* Subtitle/Message */}
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-center text-lg leading-relaxed">
                                {getSubtitle()}
                            </p>

                            {/* Wrong booth direction */}
                            {result.status === 'WRONG_BOOTH' && result.details?.expectedBoothName && (
                                <div className="mt-4 flex items-center justify-center gap-2 bg-white/20 rounded-lg p-3">
                                    <span className="text-2xl">→</span>
                                    <span className="font-bold text-xl">
                                        {result.details.expectedBoothName}
                                    </span>
                                </div>
                            )}
                            {/* Offline indicator */}
                            {result.wasOffline && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-sm opacity-75">
                                    <Icon name="refresh" size={16} />
                                    <span>Guardado offline</span>
                                </div>
                            )}
                        </div>

                        {/* Timestamp */}
                        {result.scan?.timestamp && (
                            <p className="text-center text-sm opacity-75 mt-4">
                                {new Date(result.scan.timestamp).toLocaleTimeString('es-MX', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="px-8 pb-8">
                        <Button
                            onClick={onNext}
                            variant="neutral"
                            size="lg"
                            className="w-full !bg-white !text-slate-900 hover:!bg-slate-100 !py-4 !text-xl font-bold"
                        >
                            {t(localeKeys.scanNext)} →
                        </Button>
                    </div>
                </div>

                {/* Auto-close indicator */}
                {autoCloseDelay > 0 && result.success && (
                    <div className="text-center mt-4 text-white/70 text-sm animate-pulse">
                        Auto-cerrando en {Math.ceil(autoCloseDelay / 1000)}s...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanResultCard;
