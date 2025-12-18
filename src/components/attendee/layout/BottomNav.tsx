import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Target, TrendingUp, User, QrCode, BarChart3 } from 'lucide-react';
import { useFeatureFlags } from '../../../contexts/FeatureFlagContext';
import { Feature } from '../../../features';
import { useBooths } from '../../../contexts/booths';
import type { Booth } from '../../../types';

export default function BottomNav() {
    const { isFeatureEnabled } = useFeatureFlags();
    const { booths } = useBooths();
    const location = useLocation();

    const isDashboard = location.pathname === '/portal/dashboard' || location.pathname === '/portal';

    // Get Silver sponsors for footer
    const silverSponsors = booths.filter((b: Booth) =>
        b.isSponsor && b.sponsorshipTier === 'silver'
    );

    // Function to scroll to section (for dashboard)
    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Dashboard scroll tabs
    const dashboardTabs = [
        { id: 'badge', icon: QrCode, label: 'Badge', color: 'primary' },
        { id: 'challenge', icon: Target, label: 'Challenge', color: 'secondary' },
        { id: 'agenda', icon: Calendar, label: 'Agenda', color: 'primary' },
        { id: 'stats', icon: BarChart3, label: 'Stats', color: 'primary' }
    ];

    // Route-based tabs for other pages
    const routeTabs: Array<{
        to: string;
        icon: any;
        label: string;
        alwaysShow: boolean;
        feature?: Feature;
    }> = [
            {
                to: '/portal/dashboard',
                icon: Home,
                label: 'Home',
                alwaysShow: true
            },
            {
                to: '/portal/agenda',
                icon: Calendar,
                label: 'Agenda',
                alwaysShow: true
            },
        ];

    const visibleTabs = routeTabs.filter(tab =>
        tab.alwaysShow || (tab.feature && isFeatureEnabled(tab.feature))
    );

    // Determine active section for dashboard
    const [activeSection, setActiveSection] = React.useState('badge');

    React.useEffect(() => {
        if (!isDashboard) return;

        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        dashboardTabs.forEach(tab => {
            const element = document.getElementById(tab.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [isDashboard]);

    const navItems = isDashboard ? (
        // Dashboard: Scroll-to-section tabs
        <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
            {dashboardTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => scrollToSection(tab.id)}
                        className={`flex flex-col items-center justify-center transition-colors ${isActive
                            ? tab.color === 'secondary'
                                ? 'text-secondary-600 dark:text-secondary-400'
                                : 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-400 dark:text-gray-600'
                            }`}
                    >
                        <Icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
                        <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    ) : (
        // Other pages: Route-based tabs
        <div className="max-w-7xl mx-auto flex justify-around items-center h-16">
            {visibleTabs.map(tab => {
                const Icon = tab.icon;

                return (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center flex-1 h-full
                            transition-colors duration-200
                            ${isActive
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-primary-500'
                            }
                        `}
                    >
                        <Icon className="w-6 h-6 mb-1" strokeWidth={2} />
                        <span className="text-xs font-medium">{tab.label}</span>
                    </NavLink>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Silver Sponsors Grid (NEW) */}
            {silverSponsors.length > 0 && (
                <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-4 mb-16">
                    <div className="max-w-7xl mx-auto px-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center mb-3 uppercase tracking-wide">
                            Thank you to our sponsors
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {silverSponsors.map((sponsor: Booth) => (
                                <a
                                    key={sponsor.id}
                                    href={sponsor.sponsorWebsiteUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    title={sponsor.companyName}
                                >
                                    {sponsor.sponsorLogoUrl ? (
                                        <img
                                            src={sponsor.sponsorLogoUrl}
                                            alt={sponsor.companyName}
                                            className="h-8 w-auto object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                                            {sponsor.companyName}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 z-50 safe-area-bottom">
                {navItems}
            </nav>
        </>
    );
}
