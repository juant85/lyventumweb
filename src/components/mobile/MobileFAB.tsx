import React from 'react';
import { motion } from 'framer-motion';
import { Icon, IconName } from '../ui/Icon';

interface MobileFABProps {
    icon: IconName;
    onClick: () => void;
    label?: string;
    position?: 'bottom-right' | 'bottom-center';
    color?: 'primary' | 'secondary' | 'success';
}

const MobileFAB: React.FC<MobileFABProps> = ({
    icon,
    onClick,
    label,
    position = 'bottom-right',
    color = 'primary'
}) => {
    const colorMap = {
        primary: 'from-primary-600 to-primary-700',
        secondary: 'from-secondary-600 to-secondary-700',
        success: 'from-green-600 to-green-700'
    };

    const positionMap = {
        'bottom-right': 'bottom-24 right-4',
        'bottom-center': 'bottom-24 left-1/2 -translate-x-1/2'
    };

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={`fixed ${positionMap[position]} z-40 bg-gradient-to-br ${colorMap[color]} text-white rounded-full shadow-lg hover:shadow-xl transition-shadow ${label ? 'px-6 py-4' : 'w-14 h-14'
                } flex items-center justify-center gap-2`}
        >
            <Icon name={icon} className="w-6 h-6" />
            {label && <span className="font-semibold whitespace-nowrap">{label}</span>}
        </motion.button>
    );
};

export default MobileFAB;
