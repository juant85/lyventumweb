// src/pages/admin/FeaturesPage.tsx
import React from 'react';
import { useFeatureAccess, FeaturePackageKey } from '../../hooks/useFeatureAccess';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { Icon, IconName } from '../../components/ui/Icon';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '../../components/Icons';
import { Lock } from 'lucide-react';

// Feature package metadata
const FEATURE_PACKAGES: Record<FeaturePackageKey, {
    name: string;
    description: string;
    icon: IconName;
    color: string;
}> = {
    booth_management_suite: {
        name: 'Booth Management',
        description: 'Create and manage booths with QR codes and visitor tracking',
        icon: 'booth',
        color: 'bg-blue-500'
    },
    session_conference_tools: {
        name: 'Session Tools',
        description: 'Create sessions with schedules, speakers, and capacity limits',
        icon: 'calendar',
        color: 'bg-purple-500'
    },
    lead_capture_pro: {
        name: 'Lead Capture Pro',
        description: 'Advanced lead capture with notes and export capabilities',
        icon: 'fileText',
        color: 'bg-green-500'
    },
    analytics_reporting: {
        name: 'Analytics & Reporting',
        description: 'Real-time dashboards and detailed event reports',
        icon: 'chart',
        color: 'bg-orange-500'
    },
    attendee_portal_standard: {
        name: 'Attendee Portal',
        description: 'Self-service portal for attendees to view their schedules',
        icon: 'user',
        color: 'bg-cyan-500'
    },
    gamification_engagement: {
        name: 'Gamification',
        description: 'Badges, leaderboards, and engagement features',
        icon: 'award',
        color: 'bg-yellow-500'
    },
    live_operations: {
        name: 'Live Operations',
        description: 'Real-time scanning, alerts, and operational tools',
        icon: 'qrCode',
        color: 'bg-red-500'
    },
    communication_tools: {
        name: 'Communication',
        description: 'Push notifications and email communication',
        icon: 'mail',
        color: 'bg-indigo-500'
    },
    sponsorship_management: {
        name: 'Sponsorship',
        description: 'Sponsor profiles, branding, and analytics',
        icon: 'sponsor',
        color: 'bg-pink-500'
    }
};

const ALL_PACKAGE_KEYS: FeaturePackageKey[] = Object.keys(FEATURE_PACKAGES) as FeaturePackageKey[];

const FeaturesPage: React.FC = () => {
    const { allowedPackages, isLoading } = useFeatureAccess();
    const { selectedEventId } = useSelectedEvent();

    const activeCount = allowedPackages?.length || 0;
    const totalCount = ALL_PACKAGE_KEYS.length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading features...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-24">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <Icon name="settings" className="w-8 h-8 text-primary-600" />
                        Feature Configuration
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        View the features available in your current plan.
                    </p>
                </div>

                {/* Plan Summary Card */}
                <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                                Your Plan
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                {activeCount} of {totalCount} feature packages active
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-primary-600">
                                {Math.round((activeCount / totalCount) * 100)}%
                            </div>
                            <div className="text-sm text-slate-500">features active</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(activeCount / totalCount) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Feature Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ALL_PACKAGE_KEYS.map((key, index) => {
                        const pkg = FEATURE_PACKAGES[key];
                        const isActive = allowedPackages?.includes(key);

                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                                    relative overflow-hidden rounded-xl border transition-all duration-300
                                    ${isActive
                                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 opacity-60'
                                    }
                                `}
                            >
                                <div className="p-4 flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl ${pkg.color} flex items-center justify-center flex-shrink-0`}>
                                        <Icon name={pkg.icon} className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                                                {pkg.name}
                                            </h3>
                                            {isActive ? (
                                                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                            {pkg.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Status indicator */}
                                <div className={`
                                    absolute top-0 right-0 px-3 py-1 text-xs font-medium rounded-bl-lg
                                    ${isActive
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }
                                `}>
                                    {isActive ? 'Active' : 'Locked'}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Upgrade CTA */}
                {activeCount < totalCount && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-center p-6 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-2xl border border-primary-200 dark:border-primary-800"
                    >
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                            Unlock More Features
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Upgrade your plan to access {totalCount - activeCount} additional feature package{totalCount - activeCount > 1 ? 's' : ''}.
                        </p>
                        <button className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                            Contact Sales
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default FeaturesPage;
