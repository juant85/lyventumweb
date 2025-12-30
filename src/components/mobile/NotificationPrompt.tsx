import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BellAlertIcon, XMarkIcon } from '../Icons';
import Button from '../ui/Button';
import haptics from '../../utils/haptics';

const NotificationPrompt: React.FC = () => {
    const {
        isSupported,
        hasPermission,
        isSubscribed,
        isLoading,
        requestPermission,
        subscribe
    } = useNotifications();

    const [showPrompt, setShowPrompt] = React.useState(false);
    const [isDismissed, setIsDismissed] = React.useState(false);

    useEffect(() => {
        // Show prompt if supported, no permission yet, and not dismissed
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (isSupported && !hasPermission && !dismissed) {
            // Delay showing prompt to not be intrusive
            const timer = setTimeout(() => setShowPrompt(true), 5000);
            return () => clearTimeout(timer);
        }
    }, [isSupported, hasPermission]);

    const handleEnable = async () => {
        haptics.light();
        const granted = await requestPermission();

        if (granted) {
            haptics.success();
            const subscribed = await subscribe();
            if (subscribed) {
                setShowPrompt(false);
            }
        } else {
            haptics.error();
        }
    };

    const handleDismiss = () => {
        haptics.light();
        setShowPrompt(false);
        setIsDismissed(true);
        localStorage.setItem('notification-prompt-dismissed', 'true');
    };

    if (!isSupported || hasPermission || isSubscribed || isDismissed) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:max-w-sm"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                <BellAlertIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                    Enable Notifications
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                    Get real-time alerts when sessions start, VIPs arrive, or booths reach capacity
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleEnable}
                                        disabled={isLoading}
                                        className="flex-1"
                                    >
                                        {isLoading ? 'Enabling...' : 'Enable'}
                                    </Button>
                                    <button
                                        onClick={handleDismiss}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        Later
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationPrompt;
