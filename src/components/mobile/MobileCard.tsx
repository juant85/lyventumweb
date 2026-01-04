import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MobileCardProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    badge?: ReactNode;
    onClick?: () => void;
    actions?: ReactNode;
    className?: string;
}

const MobileCard: React.FC<MobileCardProps> = ({
    title,
    subtitle,
    icon,
    badge,
    onClick,
    actions,
    className = ''
}) => {
    return (
        <motion.div
            whileTap={{ scale: onClick ? 0.98 : 1 }}
            transition={{ duration: 0.15 }}
            onClick={onClick}
            className={`
                bg-white dark:bg-slate-800 
                rounded-2xl 
                p-5 
                shadow-mobile-md 
                overflow-hidden
                ${onClick ? 'cursor-pointer touch-feedback active:shadow-mobile-lg' : ''}
                ${className}
            `}
        >
            <div className="flex items-start gap-3">
                {icon && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                        <h3 className="font-semibold text-base leading-snug text-slate-900 dark:text-white truncate break-words">
                            {title}
                        </h3>
                        {badge}
                    </div>
                    {subtitle && (
                        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 truncate break-words">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                    {actions}
                </div>
            )}
        </motion.div>
    );
};

// Memoize to prevent unnecessary re-renders in lists
export default React.memo(MobileCard);

