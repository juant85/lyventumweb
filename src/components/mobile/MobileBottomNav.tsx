
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { AppRoute } from '../../types';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

interface MobileBottomNavProps {
    onScanClick: () => void;
    onMoreClick: () => void;
    pendingScans?: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    onScanClick,
    onMoreClick,
    pendingScans = 0
}) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (paths: string | string[]) => {
        const pathArray = Array.isArray(paths) ? paths : [paths];
        return pathArray.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
    };

    const NavButton = ({
        icon,
        label,
        onClick,
        active,
        badge
    }: {
        icon: string;
        label: string;
        onClick: () => void;
        active: boolean;
        badge?: number;
    }) => (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-16 h-full relative group transition-all ${active ? 'bg-primary-50/50 dark:bg-primary-950/30' : ''
                }`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
        >
            {/* Active Indicator - Top Bar */}
            {active && (
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full shadow-lg shadow-primary-500/50"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
            )}

            {/* Icon Container */}
            <div className="relative">
                <Icon
                    name={icon as any}
                    className={`w-6 h-6 transition-all duration-200 ${active
                        ? 'text-primary-600 dark:text-primary-400 scale-110'
                        : 'text-slate-500 dark:text-slate-400 group-active:scale-95'
                        }`}
                />

                {/* Badge */}
                {badge !== undefined && badge > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1"
                    >
                        {badge > 99 ? '99+' : badge}
                    </motion.span>
                )}
            </div>

            {/* Label */}
            <span
                className={`text-[10px] font-medium mt-0.5 transition-colors ${active
                    ? 'text-primary-600 dark:text-primary-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                    }`}
            >
                {label}
            </span>
        </button>
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 flex justify-around items-center px-2 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] safe-area-bottom">

            {/* Home / Dashboard */}
            <NavButton
                icon="home"
                label={t(localeKeys.home)}
                onClick={() => navigate(AppRoute.Dashboard)}
                active={isActive([AppRoute.Dashboard, AppRoute.DataVisualization, '/sessions'])}
            />

            {/* Live / Analytics */}
            <NavButton
                icon="activity"
                label={t(localeKeys.live)}
                onClick={() => navigate(AppRoute.RealTimeAnalytics)}
                active={isActive(AppRoute.RealTimeAnalytics)}
            />

            {/* Attendees */}
            <NavButton
                icon="users"
                label={t(localeKeys.people)}
                onClick={() => navigate(AppRoute.AttendeeProfiles)}
                active={isActive([AppRoute.AttendeeProfiles, AppRoute.AttendeeRegistration, '/attendees'])}
            />

            {/* QR Scanner */}
            <NavButton
                icon="scan"
                label="Scan"
                onClick={() => navigate(AppRoute.QRScanner)}
                active={isActive(AppRoute.QRScanner)}
                badge={pendingScans}
            />
        </nav>
    );
};

export default MobileBottomNav;
