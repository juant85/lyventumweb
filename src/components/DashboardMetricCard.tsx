import React, { ReactNode } from 'react';
import BackgroundGradient from './ui/BackgroundGradient';

interface DashboardMetricCardProps {
  title: string;
  value: ReactNode;
  subtitle: string;
  icon: ReactNode;
  iconClassName?: string;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({ title, value, subtitle, icon, iconClassName = 'bg-primary-100 text-primary-600' }) => {
  return (
    <BackgroundGradient containerClassName="rounded-xl h-full">
      <div className="bg-white dark:bg-slate-800 rounded-[11px] p-4 flex items-center h-full">
        <div className={`p-3 rounded-full mr-4 ${iconClassName}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
    </BackgroundGradient>
  );
};

export default DashboardMetricCard;