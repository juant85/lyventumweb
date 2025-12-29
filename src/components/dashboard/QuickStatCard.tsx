
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Store, CheckCircle, Percent } from 'lucide-react';

interface QuickStatCardProps {
    label: string;
    value: string | number;
    icon: 'users' | 'store' | 'checkCircle' | 'percent';
    color: 'blue' | 'green' | 'amber' | 'purple' | 'orange';
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ label, value, icon, color }) => {
    const colorMap = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        amber: 'from-amber-500 to-amber-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
    };

    const iconMap = {
        users: Users,
        store: Store,
        checkCircle: CheckCircle,
        percent: Percent,
    };

    const IconComponent = iconMap[icon];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.97 }}
            className={`relative p-5 rounded-2xl bg-gradient-to-br ${colorMap[color]} text-white shadow-lg overflow-hidden`}
        >
            {/* Decorative Background Circle */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />

            <div className="relative z-10 flex flex-col items-center text-center">
                <IconComponent className="w-8 h-8 mb-2 opacity-90" />
                <p className="text-3xl font-bold font-montserrat mb-1">
                    {value}
                </p>
                <p className="text-xs font-medium opacity-90 uppercase tracking-wide">
                    {label}
                </p>
            </div>
        </motion.div>
    );
};

export default QuickStatCard;
