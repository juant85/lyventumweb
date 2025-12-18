import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LyVentumLogo from '../Logo';
import { Icon } from '../ui';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const DashboardPreview: React.FC = () => {
    // Simulated Live Data State
    const [activeAttendees, setActiveAttendees] = useState(124);
    const [checkIns, setCheckIns] = useState(85);
    const [scanCount, setScanCount] = useState(432);

    // Simulate live data updates
    useEffect(() => {
        const interval = setInterval(() => {
            // Randomly increment stats to simulate activity
            if (Math.random() > 0.6) setCheckIns(prev => Math.min(prev + 1, 100)); // Cap at 100%
            if (Math.random() > 0.4) setActiveAttendees(prev => prev + Math.floor(Math.random() * 3));
            if (Math.random() > 0.3) setScanCount(prev => prev + Math.floor(Math.random() * 5));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-6xl mx-auto rounded-xl overflow-hidden shadow-2xl shadow-primary-500/20 border border-slate-800 bg-slate-950 flex flex-col md:flex-row h-[600px] md:h-[700px]">

            {/* --- SIMULATED SIDEBAR --- */}
            <div className="hidden md:flex w-64 bg-[#0B1120] border-r border-white/5 flex-col p-4 z-20">
                {/* Brand */}
                <div className="flex flex-col items-center gap-2 mb-8 mt-2">
                    <LyVentumLogo className="h-8 w-auto text-white" />
                    <span className="text-sm font-bold text-white tracking-widest font-montserrat">LYVENTUM</span>
                </div>

                {/* Nav Links */}
                <div className="space-y-2">
                    {/* Dashboard */}
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-primary-600/10 text-primary-400 border border-primary-500/20`}>
                        <Icon name="dashboard" className="w-5 h-5" />
                        Dashboard
                    </div>
                    {/* Other Links */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400">
                        <Icon name="analytics" className="w-5 h-5" />
                        Statistics
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400">
                        <Icon name="attendees" className="w-5 h-5" />
                        Attendees
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400">
                        <Icon name="calendar" className="w-5 h-5" />
                        Sessions
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400">
                        <Icon name="booth" className="w-5 h-5" />
                        Booths
                    </div>
                </div>

                {/* Bottom User Profile */}
                <div className="mt-auto p-3 bg-slate-900/50 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        JD
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">John Doe</div>
                        <div className="text-[10px] text-slate-400 truncate">Organizer</div>
                    </div>
                </div>
            </div>

            {/* --- SIMULATED MAIN CONTENT --- */}
            <div className="flex-1 bg-slate-900/50 flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-white">Event Dashboard</h2>
                        <p className="text-xs text-slate-400">TechSummit 2025 • Live Monitoring</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-green-400 uppercase tracking-wider">System Online</span>
                    </div>
                </div>

                {/* Dashboard Content */}
                <motion.div
                    className="p-6 overflow-y-auto"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <motion.div variants={itemVariants} className="p-4 rounded-xl bg-slate-800/50 border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400"><Icon name="refresh" className="w-5 h-5" /></div>
                                <span className="text-xs text-green-400 font-mono">+12%</span>
                            </div>
                            <div className="text-2xl font-bold text-white font-mono">{scanCount}</div>
                            <div className="text-xs text-slate-400">Total Booth Scans</div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="p-4 rounded-xl bg-slate-800/50 border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400"><Icon name="users" className="w-5 h-5" /></div>
                                <span className="text-xs text-green-400 font-mono">LIVE</span>
                            </div>
                            <div className="text-2xl font-bold text-white font-mono">{activeAttendees}</div>
                            <div className="text-xs text-slate-400">Attendees on Floor</div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="p-4 rounded-xl bg-slate-800/50 border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400"><Icon name="checkCircle" className="w-5 h-5" /></div>
                                <span className="text-xs text-slate-400 font-mono">Target: 95%</span>
                            </div>
                            <div className="text-2xl font-bold text-white font-mono">{checkIns}%</div>
                            <div className="text-xs text-slate-400">Meeting Completion</div>
                        </motion.div>
                    </div>

                    {/* Main Chart Area (Simulated) */}
                    <motion.div variants={itemVariants} className="p-6 rounded-xl bg-slate-800/30 border border-white/5 mb-6 h-64 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-300">Traffic Analysis</h3>
                            <div className="flex gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                            </div>
                        </div>
                        {/* CSS-only Bar Chart */}
                        <div className="flex items-end justify-between h-full gap-2 px-2">
                            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                                <motion.div
                                    key={i}
                                    className="w-full bg-primary-500/20 rounded-t-sm relative group"
                                    initial={{ height: 0 }}
                                    whileInView={{ height: `${height}%` }}
                                    transition={{ duration: 1, delay: i * 0.05 }}
                                >
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary-500/40 h-[30%] group-hover:h-full transition-all duration-300 rounded-t-sm" />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Activity Feed */}
                    <motion.div variants={itemVariants} className="p-4 rounded-xl bg-slate-800/30 border border-white/5">
                        <h3 className="text-sm font-bold text-slate-300 mb-4">Live Feed</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                                <Icon name="checkCircle" className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-slate-300 flex-1">Sarah checked in at Booth A1</span>
                                <span className="text-[10px] text-slate-500">Just now</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                                <Icon name="users" className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-slate-300 flex-1">New lead captured by TechCorp</span>
                                <span className="text-[10px] text-slate-500">2m ago</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                                <Icon name="clock" className="w-4 h-4 text-amber-400" />
                                <span className="text-xs text-slate-300 flex-1">Keynote Session starting</span>
                                <span className="text-[10px] text-slate-500">5m ago</span>
                            </div>
                        </div>
                    </motion.div>

                </motion.div>

                {/* Decorative Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none h-20 bottom-0 top-auto"></div>

            </div>
        </div>
    );
};

export default DashboardPreview;
