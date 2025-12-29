
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon'; // Assuming generic Icon component exists
import { AppRoute } from '../../types';

interface MobileBottomNavProps {
    onScanClick: () => void;
    onMoreClick: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onScanClick, onMoreClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-4 z-50 shadow-lg-up safe-area-bottom">
            {/* Home / Dashboard */}
            <button
                onClick={() => navigate(AppRoute.Dashboard)}
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${isActive(AppRoute.Dashboard) || isActive(AppRoute.DataVisualization) ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
            >
                <Icon name="home" className="w-6 h-6" />
                <span className="text-[10px] font-medium">Home</span>
            </button>

            {/* Scan Action (Floating FAB Effect) */}
            <button
                onClick={onScanClick}
                className="relative -top-5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-transform active:scale-95 border-4 border-slate-100 dark:border-slate-950"
            >
                <Icon name="qrCode" className="w-6 h-6" />
            </button>

            {/* Stats / Analytics */}
            <button
                onClick={() => navigate(AppRoute.DataVisualization)}
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${isActive(AppRoute.DataVisualization) ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
            >
                <Icon name="chartPie" className="w-6 h-6" />
                <span className="text-[10px] font-medium">Stats</span>
            </button>

            {/* More / Menu */}
            <button
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center w-16 h-full space-y-1 text-slate-500 dark:text-slate-400"
            >
                <Icon name="menu" className="w-6 h-6" />
                <span className="text-[10px] font-medium">More</span>
            </button>
        </div>
    );
};

export default MobileBottomNav;
