
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Icon } from '../ui/Icon';
import ThemeSwitcher from '../ThemeSwitcher';
import LanguageSwitcher from '../LanguageSwitcher';
import { AppRoute } from '../../types';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const { currentUser, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate(AppRoute.Login);
    };

    const menuItems = [
        {
            label: 'Analytics',
            icon: 'chart',
            path: '/admin/analytics',
            color: 'text-blue-500'
        },
        {
            label: 'Real-time',
            icon: 'activity',
            path: '/admin/analytics/realtime',
            color: 'text-green-500'
        },
        {
            label: 'My Profile',
            icon: 'user',
            path: '/admin/profile',
            color: 'text-purple-500'
        }
    ];

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
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                    {currentUser?.email?.[0].toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate">
                                        {currentUser?.email?.split('@')[0]}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                        {currentUser?.role}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                >
                                    <Icon name="close" className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg p-2 border border-slate-200 dark:border-slate-700 flex justify-center">
                                    <ThemeSwitcher />
                                </div>
                                <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg p-2 border border-slate-200 dark:border-slate-700 flex justify-center">
                                    <LanguageSwitcher />
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {menuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                >
                                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors ${item.color}`}>
                                        <Icon name={item.icon as any} className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                        {item.label}
                                    </span>
                                    <Icon name="chevronRight" className="w-4 h-4 text-slate-400 ml-auto" />
                                </button>
                            ))}
                        </div>

                        {/* Footer / Logout */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 pb-safe">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors font-semibold"
                            >
                                <Icon name="logout" className="w-5 h-5" />
                                Sign Out
                            </button>
                            <p className="text-center text-[10px] text-slate-400 mt-4">
                                LyVenTum &copy; {new Date().getFullYear()}
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
