import React from 'react';
import { Icon, IconName } from '../components/ui';

// All available icons from the iconMap
const allIcons: IconName[] = [
    // Core
    'dashboard',
    'qr',
    'scan',
    'camera',
    'visualize',
    'grid',
    'settings',
    'table',
    'edit',
    'sponsor',
    'reports',
    'admin',

    // Pantallas adicionales
    'attendees',
    'profile',
    'registration',
    'booth',
    'analytics',
    'realtime',

    // Utilitarios
    'chevronUp',
    'chevronDown',

    // UI components
    'chat',
    'refresh',
    'signal',
    'checkCircle',
    'userMinus',
    'usersGroup',
    'store',
    'chartPie',
    'download',

    // Kiosk Mode
    'logout',
    'userCircle',
    'clock',

    // Fallback
    'fallback',
];

/**
 * IconTestPage - Visual test page to verify all icons render correctly
 * This page displays all available icons in a grid layout for easy verification
 * 
 * Usage: Navigate to /icon-test (route needs to be added temporarily)
 */
const IconTestPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Icon System Test
                    </h1>
                    <p className="text-slate-300">
                        Visual verification of all {allIcons.length} icons in the system
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                        Using Lucide React for professional, modern icons
                    </p>
                </div>

                {/* Icon Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {allIcons.map((iconName) => (
                        <div
                            key={iconName}
                            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-slate-700/50 hover:border-primary-500 transition-all duration-200 group"
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 flex items-center justify-center">
                                <Icon
                                    name={iconName}
                                    className="w-8 h-8 text-slate-300 group-hover:text-primary-400 transition-colors"
                                    strokeWidth={1.5}
                                />
                            </div>

                            {/* Icon Name */}
                            <div className="text-xs text-center">
                                <code className="text-slate-400 group-hover:text-slate-200 transition-colors">
                                    {iconName}
                                </code>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <div className="mt-12 bg-slate-800/30 border border-slate-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        ✅ Verification Checklist
                    </h2>
                    <ul className="space-y-2 text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>All icons should render without errors</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>Icons should be crisp and clear at all sizes</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>Hover effects should work smoothly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>Check browser console (F12) for any warnings or errors</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>If you see a "?" icon (CircleHelp), that icon is missing from the iconMap</span>
                        </li>
                    </ul>
                </div>

                {/* Console Log Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            console.log('📦 Available Icons:', allIcons);
                            console.log('✅ Total Icons:', allIcons.length);
                        }}
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
                    >
                        Log Icon List to Console
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IconTestPage;
