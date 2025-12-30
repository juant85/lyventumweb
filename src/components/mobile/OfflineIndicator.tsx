import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiIcon, ArrowPathIcon, ExclamationTriangleIcon } from '../Icons';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import Button from '../ui/Button';

const OfflineIndicator: React.FC = () => {
    const { isOnline, isSyncing, queueCount, syncNow } = useOfflineSync();

    if (isOnline && queueCount === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            {(!isOnline || queueCount > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-16 left-0 right-0 z-40"
                >
                    <div className={`mx-4 md:mx-auto md:max-w-md rounded-lg shadow-lg border ${isOnline
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        }`}>
                        <div className="p-3 flex items-center gap-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 ${isOnline ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                {isSyncing ? (
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                ) : isOnline ? (
                                    <WifiIcon className="w-5 h-5" />
                                ) : (
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                )}
                            </div>

                            {/* Message */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isOnline ? 'text-blue-900 dark:text-blue-100' : 'text-amber-900 dark:text-amber-100'
                                    }`}>
                                    {isSyncing ? (
                                        'Syncing...'
                                    ) : isOnline ? (
                                        `${queueCount} pending action${queueCount !== 1 ? 's' : ''}`
                                    ) : (
                                        'You\'re offline'
                                    )}
                                </p>
                                <p className={`text-xs ${isOnline ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'
                                    }`}>
                                    {isSyncing ? (
                                        'Uploading changes to server'
                                    ) : isOnline ? (
                                        'Will sync when connection is restored'
                                    ) : (
                                        'Changes will be saved locally'
                                    )}
                                </p>
                            </div>

                            {/* Action */}
                            {isOnline && queueCount > 0 && !isSyncing && (
                                <Button
                                    size="sm"
                                    onClick={syncNow}
                                    variant="primary"
                                    className="flex-shrink-0"
                                >
                                    Sync Now
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineIndicator;
