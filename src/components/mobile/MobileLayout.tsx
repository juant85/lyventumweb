
import React, { ReactNode, useState } from 'react';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useScrollY } from '../../hooks/useScrollY';
import MobileBottomNav from './MobileBottomNav';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import MobileMenu from './MobileMenu';

interface MobileLayoutProps {
    children: ReactNode;
}

type HeaderMode = 'expanded' | 'compact' | 'hidden';

const ExpandedHeader: React.FC<{ currentEvent: any; currentUser: any; onMenuClick: () => void }> = ({ currentEvent, currentUser, onMenuClick }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between w-full"
    >
        <div className="flex items-center gap-3">
            {currentEvent?.eventLogoUrl ? (
                <img src={currentEvent.eventLogoUrl} alt="Event" className="h-8 w-8 rounded-lg object-contain bg-slate-100 dark:bg-slate-800" />
            ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                    {currentEvent?.name?.[0] || 'L'}
                </div>
            )}

            <div className="flex flex-col">
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[200px]">
                    {currentEvent?.name || 'Lyventum'}
                </h1>
                <span className="text-[10px] uppercase tracking-wide font-semibold text-primary-600 dark:text-primary-400">
                    {currentUser?.role || 'Guest'}
                </span>
            </div>
        </div>

        <button
            onClick={onMenuClick}
            className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
        >
            <Icon name="user" className="w-4 h-4" />
        </button>
    </motion.div>
);

const CompactHeader: React.FC<{ currentEvent: any; onMenuClick: () => void }> = ({ currentEvent, onMenuClick }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between w-full"
    >
        <div className="flex items-center gap-2">
            {currentEvent?.eventLogoUrl ? (
                <img src={currentEvent.eventLogoUrl} alt="Event" className="h-6 w-6 rounded-md object-contain" />
            ) : (
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xs">
                    {currentEvent?.name?.[0] || 'L'}
                </div>
            )}
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {currentEvent?.name || 'Lyventum'}
            </span>
        </div>

        <button
            onClick={onMenuClick}
            className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
        >
            <Icon name="menu" className="w-4 h-4" />
        </button>
    </motion.div>
);

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const { currentEvent } = useSelectedEvent();
    const scrollDirection = useScrollDirection();
    const scrollY = useScrollY();
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const getHeaderMode = (): HeaderMode => {
        if (scrollY < 50) return 'expanded';
        if (scrollDirection === 'down') return 'hidden';
        return 'compact';
    };

    const headerMode = getHeaderMode();
    const headerHeight = headerMode === 'expanded' ? 64 : headerMode === 'compact' ? 48 : 0;
    const headerTranslateY = headerMode === 'hidden' ? -48 : 0;

    const handleScanClick = () => {
        navigate(AppRoute.QRScanner);
    };

    const handleMoreClick = () => {
        setIsDrawerOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <motion.header
                animate={{
                    height: `${headerHeight}px`,
                    y: headerTranslateY
                }}
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                }}
                className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 flex items-center safe-area-top overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {headerMode === 'expanded' && (
                        <ExpandedHeader key="expanded" currentEvent={currentEvent} currentUser={currentUser} onMenuClick={handleMoreClick} />
                    )}
                    {headerMode === 'compact' && (
                        <CompactHeader key="compact" currentEvent={currentEvent} onMenuClick={handleMoreClick} />
                    )}
                </AnimatePresence>
            </motion.header>

            <main
                className="transition-all duration-300"
                style={{ paddingTop: `${headerHeight + 16}px` }}
            >
                {children}
            </main>

            <MobileBottomNav
                onScanClick={handleScanClick}
                onMoreClick={handleMoreClick}
                pendingScans={0}
            />

            {isDrawerOpen && (
                <MobileMenu isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
            )}
        </div>
    );
};

export default MobileLayout;
