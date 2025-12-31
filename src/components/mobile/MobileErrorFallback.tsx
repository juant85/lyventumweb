import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '../Icons';

const MobileErrorFallback: React.FC<{ error?: Error; resetError?: () => void }> = ({ error, resetError }) => {
    const handleReload = () => {
        if (resetError) {
            resetError();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 text-center">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring' }}
                        className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                    >
                        <ExclamationTriangleIcon className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                        Oops! Something went wrong
                    </h2>

                    {/* Description */}
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Don't worry, your data is safe. Try reloading the page to continue.
                    </p>

                    {/* Action Button */}
                    <button
                        onClick={handleReload}
                        className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        Reload Page
                    </button>

                    {/* Dev Mode Error Details */}
                    {process.env.NODE_ENV === 'development' && error && (
                        <details className="mt-6 text-left">
                            <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                                🐛 Error Details (Dev Mode)
                            </summary>
                            <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                                <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                                    {error.name}: {error.message}
                                </p>
                                {error.stack && (
                                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-auto max-h-32">
                                        {error.stack}
                                    </pre>
                                )}
                            </div>
                        </details>
                    )}

                    {/* Contact Support */}
                    <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                        If this problem persists, please contact support
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default MobileErrorFallback;
