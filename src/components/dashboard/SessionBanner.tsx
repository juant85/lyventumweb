
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { useLanguage } from '../../contexts/LanguageContext';
import { Session } from '../../types';

interface SessionBannerProps {
    session?: Session | null;
    eventName?: string;
}

const SessionBanner: React.FC<SessionBannerProps> = ({ session, eventName }) => {
    const { t } = useLanguage();

    if (!session) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mx-0 p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center"
            >
                <p className="text-slate-500 font-medium text-sm">No Active Session</p>
                <p className="text-xs text-slate-400 mt-1">Select an event to view data</p>
            </motion.div>
        );
    }

    // Determine status color
    const isLive = new Date() >= new Date(session.startTime) && new Date() <= new Date(session.endTime);
    const isPast = new Date() > new Date(session.endTime);

    let gradient = 'from-blue-500 to-indigo-600';
    let statusText = 'UPCOMING';
    let shadowColor = 'shadow-blue-500/20';

    if (isLive) {
        gradient = 'from-green-500 to-emerald-600';
        statusText = 'LIVE NOW';
        shadowColor = 'shadow-green-500/30';
    } else if (isPast) {
        gradient = 'from-slate-600 to-slate-800';
        statusText = 'COMPLETED';
        shadowColor = 'shadow-slate-500/20';
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative mx-0 p-6 rounded-[2rem] bg-gradient-to-br ${gradient} text-white shadow-xl ${shadowColor} overflow-hidden`}
        >
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    {isLive && <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>}
                    <span className="text-[10px] font-bold tracking-widest">{statusText}</span>
                </div>

                {/* Session Name */}
                <h2 className="text-xl font-bold font-montserrat leading-tight mb-1">
                    {session.name}
                </h2>
                {eventName && <p className="text-xs text-white/80 font-medium mb-4">{eventName}</p>}

                {/* Time info */}
                <div className="flex items-center gap-4 text-xs font-medium bg-white/10 px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-1.5">
                        <Icon name="clock" className="w-3.5 h-3.5 opacity-80" />
                        <span>
                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="w-px h-3 bg-white/20"></div>
                    <div className="flex items-center gap-1.5">
                        <Icon name="users" className="w-3.5 h-3.5 opacity-80" />
                        <span>{session.boothSettings?.length || 0} Booths</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SessionBanner;
