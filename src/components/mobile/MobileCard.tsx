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
            onClick={onClick}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 ${onClick ? 'cursor-pointer active:shadow-md' : ''
                } ${className}`}
        >
            <div className="flex items-start gap-3">
                {icon && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                            {title}
                        </h3>
                        {badge}
                    </div>
                    {subtitle && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
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

export default MobileCard;
