
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { Icon } from '../ui/Icon';
import ThemeSwitcher from '../ThemeSwitcher';
import LanguageSwitcher from '../LanguageSwitcher';
import { AppRoute } from '../../types';
import { NAVIGATION_LINKS } from '../../constants';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const { currentUser, logout } = useAuth();
    const { t } = useLanguage();
    const { currentEvent } = useSelectedEvent();
    const { isFeatureEnabled, isLoading } = useFeatureFlags();
    const navigate = useNavigate();
    const location = useLocation();
    const [openSections, setOpenSections] = useState<Set<string>>(new Set());

    const handleLogout = async () => {
        await logout();
        navigate(AppRoute.Login);
    };

    // Same logic as desktop Sidebar - filter by feature flags and role
    const visibleNavigationLinks = useMemo(() => {
        if (isLoading) return [];

        return NAVIGATION_LINKS
            .filter(group => {
                const categoryName = group.category;
                const isSuperAdminCategory = categoryName === 'navCategorySuperAdmin';
                if (isSuperAdminCategory) {
                    return currentUser?.role === 'superadmin';
                }
                return true;
            })
            .map(group => ({
                ...group,
                links: group.links.filter(link => 'featureKey' in link ? isFeatureEnabled(link.featureKey) : true)
            }))
            .filter(group => group.links.length > 0);
    }, [isFeatureEnabled, isLoading, currentUser]);

    const toggleSection = (category: string) => {
        setOpenSections(prevSections => {
            const newSections = new Set(prevSections);
            if (newSections.has(category)) {
                newSections.delete(category);
            } else {
                newSections.add(category);
            }
            return newSections;
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
                        role="navigation"
                        aria-label="Main navigation menu"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 to-primary-50/30 dark:from-slate-800/50 dark:to-primary-900/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg ring-2 ring-white dark:ring-slate-800">
                                    {currentUser?.email?.[0].toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate text-sm">
                                        {currentUser?.email?.split('@')[0]}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest">
                                        {currentUser?.role}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    aria-label="Close menu"
                                >
                                    <Icon name="close" size={24} className="text-slate-600 dark:text-slate-300" />
                                </button>
                            </div>

                            {/* Current Event Indicator */}
                            {currentEvent && (
                                <div className="mb-3 bg-white/80 dark:bg-slate-950/40 backdrop-blur-sm border border-primary-200 dark:border-primary-800/50 rounded-xl p-2.5 flex items-center gap-2 shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                                    <span className="text-xs font-bold text-primary-700 dark:text-primary-300 truncate flex-1">
                                        {currentEvent.name}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <div className="flex-1 bg-white/70 dark:bg-slate-950/30 backdrop-blur-sm rounded-lg p-1.5 border border-slate-200 dark:border-slate-700/50 flex justify-center">
                                    <ThemeSwitcher />
                                </div>
                                <div className="flex-1 bg-white/70 dark:bg-slate-950/30 backdrop-blur-sm rounded-lg p-1.5 border border-slate-200 dark:border-slate-700/50 flex justify-center">
                                    <LanguageSwitcher />
                                </div>
                            </div>
                        </div>

                        {/* Menu Items - Desktop Sidebar Structure */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                visibleNavigationLinks.map(group => {
                                    const categoryName = t(group.category);
                                    const isSingleLink = group.links.length === 1;

                                    if (isSingleLink) {
                                        const link = group.links[0];
                                        const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));

                                        return (
                                            <div key={link.path} className="space-y-1">
                                                <p className="px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                                    {categoryName}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        navigate(link.path);
                                                        onClose();
                                                    }}
                                                    className={`
                                                        relative w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all
                                                        ${isActive
                                                            ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 text-primary-700 dark:text-primary-300 shadow-sm'
                                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                                        }
                                                    `}
                                                >
                                                    {isActive && (
                                                        <div className="absolute left-0 h-8 w-1 bg-primary-500 rounded-r-full" />
                                                    )}
                                                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                        <Icon name={link.icon} className={`w-4 h-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                                                    </div>
                                                    <span className="font-medium text-sm">{t(link.labelKey)}</span>
                                                </button>
                                            </div>
                                        );
                                    }

                                    const isOpen = openSections.has(categoryName);

                                    return (
                                        <div key={categoryName} className="space-y-1">
                                            <button
                                                onClick={() => toggleSection(group.category)}
                                                className="w-full flex items-center justify-between py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                                aria-expanded={openSections.has(group.category)}
                                                aria-controls={`menu-section-${group.category}`}
                                            >
                                                <span>{categoryName}</span>
                                                <motion.div
                                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Icon name="chevronDown" className="w-3 h-3" />
                                                </motion.div>
                                            </button>

                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="space-y-0.5 overflow-hidden"
                                                    >
                                                        {group.links.map(link => {
                                                            const isActive = (link.path === '/dashboard' ? location.pathname === link.path : location.pathname.startsWith(link.path));

                                                            return (
                                                                <button
                                                                    key={link.path}
                                                                    onClick={() => {
                                                                        navigate(link.path);
                                                                        onClose();
                                                                    }}
                                                                    className={`
                                                                        relative w-full flex items-center gap-2.5 px-4 py-3 ml-2 rounded-lg transition-all min-h-[44px]
                                                                        ${isActive
                                                                            ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 text-primary-700 dark:text-primary-300 shadow-sm'
                                                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                                                        }
                                                                    `}
                                                                >
                                                                    {isActive && (
                                                                        <div className="absolute left-0 h-6 w-0.5 bg-primary-500 rounded-r-full" />
                                                                    )}
                                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${isActive ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                                        <Icon name={link.icon} className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                                                                    </div>
                                                                    <span className="font-medium text-sm truncate">{t(link.labelKey)}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer / Logout */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-gradient-to-t from-slate-50/30 to-transparent dark:from-slate-800/30 pb-safe">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/10 dark:to-red-900/5 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-red-200/50 dark:hover:from-red-900/20 dark:hover:to-red-900/10 transition-all font-semibold text-sm shadow-sm border border-red-100 dark:border-red-900/20"
                            >
                                <Icon name="logout" className="w-4 h-4" />
                                Sign Out
                            </button>
                            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
                                LyVenTum © {new Date().getFullYear()}
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
