
import React, { ReactNode, useState } from 'react';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useScrollY } from '../../hooks/useScrollY';
import MobileBottomNav from './MobileBottomNav';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../../types';
import MobileMenu from './MobileMenu';
import MobileErrorBoundary from './MobileErrorBoundary';
import GlobalSearch from './GlobalSearch';

interface MobileLayoutProps {
    children: ReactNode;
}

type HeaderMode = 'expanded' | 'compact' | 'hidden';

const ExpandedHeader: React.FC<{ currentEvent: any; currentUser: any; onMenuClick: () => void }> = ({ currentEvent, currentUser }) => (
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
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[250px]">
                    {currentEvent?.name || 'Lyventum'}
                </h1>
                <span className="text-[10px] uppercase tracking-wide font-semibold text-primary-600 dark:text-primary-400">
                    {currentUser?.role || 'Guest'}
                </span>
            </div>
        </div>
        {/* User button removed to avoid redundancy with Bottom Nav "More" */}
    </motion.div>
);

const CompactHeader: React.FC<{ currentEvent: any; onMenuClick: () => void }> = ({ currentEvent }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center w-full"
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
        {/* Menu button removed to avoid redundancy with Bottom Nav "More" */}
    </motion.div>
);

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const { currentEvent } = useSelectedEvent();
    const scrollDirection = useScrollDirection();
    const scrollY = useScrollY();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

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
        setIsMenuOpen(true);
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
                        <ExpandedHeader key="expanded" currentEvent={currentEvent} currentUser={currentUser} />
                    )}
                    {headerMode === 'compact' && (
                        <CompactHeader key="compact" currentEvent={currentEvent} />
                    )}
                </AnimatePresence>
                <div className="flex items-center gap-2 ml-auto">
                    {/* Global Search Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
                        aria-label="Search attendees"
                    >
                        <Icon name="search" className="w-5 h-5" />
                    </button>

                    {/* Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
                        aria-label="Open menu"
                    >
                        <Icon name="menu" className="w-6 h-6" />
                    </button>
                </div>
            </motion.header>

            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname} // Triggers animation on route change
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="transition-all duration-300"
                    style={{ paddingTop: `${headerHeight + 16}px` }}
                >
                    <MobileErrorBoundary>
                        {children}
                    </MobileErrorBoundary>
                </motion.main>
            </AnimatePresence>

            <MobileBottomNav
                onScanClick={handleScanClick}
                onMoreClick={handleMoreClick}
                pendingScans={0}
            />

            {/* Mobile Menu */}
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Global Search */}
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
};

export default MobileLayout;
