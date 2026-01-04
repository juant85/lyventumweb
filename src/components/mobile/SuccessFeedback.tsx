import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle } from 'lucide-react';
import haptics from '../../utils/haptics';

export type FeedbackType = 'success' | 'error' | 'warning';

interface SuccessFeedbackProps {
    isVisible: boolean;
    type?: FeedbackType;
    message?: string;
    onComplete?: () => void;
    duration?: number;
}

/**
 * Premium success/error/warning feedback animation
 * Shows a fullscreen animated overlay with icon and optional message
 */
const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
    isVisible,
    type = 'success',
    message,
    onComplete,
    duration = 1500
}) => {
    // Trigger haptic feedback when shown
    React.useEffect(() => {
        if (isVisible) {
            if (type === 'success') {
                haptics.success();
            } else if (type === 'error') {
                haptics.error();
            } else {
                haptics.medium();
            }

            // Auto-hide after duration
            const timer = setTimeout(() => {
                onComplete?.();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, type, duration, onComplete]);

    const config = {
        success: {
            icon: Check,
            bg: 'from-green-500 to-emerald-600',
            iconBg: 'bg-white/20',
            text: message || 'Success!'
        },
        error: {
            icon: X,
            bg: 'from-red-500 to-rose-600',
            iconBg: 'bg-white/20',
            text: message || 'Error'
        },
        warning: {
            icon: AlertTriangle,
            bg: 'from-amber-500 to-orange-600',
            iconBg: 'bg-white/20',
            text: message || 'Warning'
        }
    };

    const { icon: Icon, bg, iconBg, text } = config[type];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br ${bg}`}
                >
                    {/* Icon with scale animation */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 15,
                            delay: 0.1
                        }}
                        className={`w-24 h-24 rounded-full ${iconBg} flex items-center justify-center mb-6`}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.2 }}
                        >
                            <Icon className="w-12 h-12 text-white" strokeWidth={3} />
                        </motion.div>
                    </motion.div>

                    {/* Message */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="text-2xl font-bold text-white text-center px-8"
                    >
                        {text}
                    </motion.p>

                    {/* Pulse rings */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{
                            duration: 1,
                            repeat: 2,
                            repeatDelay: 0.2
                        }}
                        className="absolute w-24 h-24 rounded-full border-4 border-white/30"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SuccessFeedback;
