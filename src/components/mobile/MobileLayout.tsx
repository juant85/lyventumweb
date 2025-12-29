
import React, { ReactNode, useState } from 'react';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useScrollY } from '../../hooks/useScrollY';
import MobileBottomNav from './MobileBottomNav';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';

interface MobileLayoutProps {
    children: ReactNode;
}

// Header state type
type HeaderMode = 'expanded' | 'compact' | 'hidden';

// Expanded Header Component
const ExpandedHeader: React.FC<{ currentEvent: any; currentUser: any }> = ({ currentEvent, currentUser }) => (
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

        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Icon name="user" className="w-4 h-4" />
        </div>
    </motion.div>
);

// Compact Header Component
const CompactHeader: React.FC<{ currentEvent: any }> = ({ currentEvent }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between w-full"
    >
        <div className="flex items-center gap-2">
            {currentEvent?.eventLogoUrl ? (
                <img src={currentEvent.eventLogoUrl} alt="Event" className="h-7 w-7 rounded-full object-cover ring-2 ring-primary-500/20" />
            ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-primary-500/20">
                    {currentEvent?.name?.[0] || 'L'}
                </div>
            )}
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {currentEvent?.name?.split(' ')[0] || 'Event'}
            </span>
        </div>

        <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Icon name="user" className="w-3 h-3 text-slate-600 dark:text-slate-300" />
        </div>
    </motion.div>
);

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    const scrollDirection = useScrollDirection();
    const scrollY = useScrollY();
    const { currentEvent } = useSelectedEvent();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Determine header mode based on scroll position and direction
    const getHeaderMode = (): HeaderMode => {
        if (scrollY < 20) return 'expanded'; // At top
        if (scrollDirection === 'down') return 'hidden'; // Scrolling down
        return 'compact'; // Scrolling up
    };

    const headerMode = getHeaderMode();

    // Header height based on mode
    const headerHeight = headerMode === 'expanded' ? 64 : headerMode === 'compact' ? 48 : 0;
    const headerTranslateY = headerMode === 'hidden' ? -48 : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Smart 3-State Header */}
            <motion.header
                animate={{
                    height: `${headerHeight}px`,
                    y: headerTranslateY,
                }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 flex items-center safe-area-top overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {headerMode === 'expanded' && (
                        <ExpandedHeader key="expanded" currentEvent={currentEvent} currentUser={currentUser} />
                    )}
                    {headerMode === 'compact' && (
                        <CompactHeader key="compact" currentEvent={currentEvent} />
                    )}
                </AnimatePresence>
            </motion.header>

            {/* Main Content Area - Dynamic padding based on header state */}
            <main
                className="px-4 transition-all duration-300"
                style={{ paddingTop: `${headerHeight + 16}px` }}
            >
                {children}
            </main>

            {/* Bottom Navigation */}
            <MobileBottomNav
                onScanClick={() => navigate('/admin/scanner')}
                onMoreClick={() => setIsMenuOpen(true)}
            />

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-y-0 right-0 w-[80%] max-w-sm bg-white dark:bg-slate-900 z-50 shadow-2xl"
                        >
                            <div className="p-4 h-full overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold">Menu</h2>
                                    <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        <Icon name="close" className="w-5 h-5" />
                                    </button>
                                </div>
                                <Sidebar isOpen={true} currentUser={currentUser} isMobileDrawer={true} onClose={() => setIsMenuOpen(false)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileLayout;
