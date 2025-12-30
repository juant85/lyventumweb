
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { AppRoute } from '../../types';
import { motion } from 'framer-motion';

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
            className="flex flex-col items-center justify-center w-16 h-full relative group"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
        >
            {/* Active Indicator */}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
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
            <span className={`text-[10px] font-medium mt-0.5 transition-colors ${active
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-500 dark:text-slate-400'
                }`}>
                {label}
            </span>
        </button>
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-2 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.24)] safe-area-bottom">

            {/* Home / Dashboard */}
            <NavButton
                icon="home"
                label="Home"
                onClick={() => navigate(AppRoute.Dashboard)}
                active={isActive([AppRoute.Dashboard, AppRoute.DataVisualization, '/sessions'])}
            />

            {/* Live / Analytics - Replaces Events to emphasize Real-Time */}
            <NavButton
                icon="activity"
                label="Live"
                onClick={() => navigate(AppRoute.RealTimeAnalytics)}
                active={isActive(AppRoute.RealTimeAnalytics)}
            />

            {/* QR Scanner FAB - Center */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(AppRoute.QRScanner)}
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-2xl flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all"
                aria-label="QR Scanner"
            >
                <Icon name="scan" className="w-7 h-7" />
                {/* Scan Badge */}
                {pendingScans > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5"
                    >
                        {pendingScans > 99 ? '99+' : pendingScans}
                    </motion.span>
                )}
            </motion.button>

            {/* Attendees */}
            <NavButton
                icon="users"
                label="People"
                onClick={() => navigate(AppRoute.AttendeeProfiles)}
                active={isActive([AppRoute.AttendeeProfiles, AppRoute.AttendeeRegistration, '/attendees'])}
            />

            {/* More / Menu */}
            <NavButton
                icon="menu"
                label="More"
                onClick={onMoreClick}
                active={false}
            />
        </nav>
    );
};

export default MobileBottomNav;
