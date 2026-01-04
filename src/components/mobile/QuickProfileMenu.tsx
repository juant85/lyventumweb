import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../ui/Icon';
import Avatar from '../ui/Avatar';
import { AppRoute } from '../../types';
import { haptics } from '../../utils/haptics';

interface QuickProfileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenFullMenu: () => void;
}

/**
 * Quick Profile Menu - Premium iOS-style popover
 * Shows quick actions related to user profile
 */
const QuickProfileMenu: React.FC<QuickProfileMenuProps> = ({
    isOpen,
    onClose,
    onOpenFullMenu
}) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleAction = (action: () => void) => {
        haptics.light();
        action();
        onClose();
    };

    const handleLogout = async () => {
        haptics.medium();
        await logout();
        navigate(AppRoute.Login);
        onClose();
    };

    const menuItems = [
        {
            icon: 'user' as const,
            label: 'My Profile',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            onClick: () => navigate('/profile'),
        },
        {
            icon: 'settings' as const,
            label: 'Settings',
            color: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-slate-100 dark:bg-slate-800',
            onClick: () => navigate('/settings'),
        },
        {
            icon: 'menu' as const,
            label: 'Full Menu',
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-900/30',
            onClick: onOpenFullMenu,
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Invisible backdrop to catch taps */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50"
                    />

                    {/* Menu Popover */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-16 right-4 z-50 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                        {/* User Info Header */}
                        <div className="p-4 bg-gradient-to-br from-slate-50 to-primary-50/30 dark:from-slate-800 dark:to-primary-900/20 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={currentUser?.username || currentUser?.email || 'User'}
                                    size="md"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                                        {currentUser?.username || currentUser?.email?.split('@')[0] || 'User'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                                        {currentUser?.role || 'Guest'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="p-2 space-y-1">
                            {menuItems.map((item, index) => (
                                <motion.button
                                    key={item.label}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAction(item.onClick)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
                                        <Icon name={item.icon} className={`w-4 h-4 ${item.color}`} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {item.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Logout */}
                        <div className="p-2 pt-0 border-t border-slate-100 dark:border-slate-700 mt-1">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                                    <Icon name="logout" className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                    Sign Out
                                </span>
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default QuickProfileMenu;
