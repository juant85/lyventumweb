import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../constants';
import { AppRoute, User } from '../types';
import { LoginIcon, WifiIcon, WifiSlashIcon, ArrowLeftIcon, ExclamationTriangleIcon, MenuIcon, XMarkIcon } from './Icons';
import { Toaster } from 'react-hot-toast';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import { useEventData } from '../contexts/EventDataContext';
import { useChat } from '../contexts/ChatContext';
import { ChatPanel } from './ChatPanel';
import Sidebar from './Sidebar';
import UserMenu from './UserMenu';
import PublicLayout from './PublicLayout';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { localeKeys } from '../i18n/locales';
import { useSimulation } from '../contexts/SimulationContext';
import { supabase } from '../supabaseClient';
import { Database } from '../database.types';
import { Icon } from './ui';
import TestModeBanner from './TestModeBanner';

type PlanRow = Database['public']['Tables']['plans']['Row'];

// Helper function to determine the home path based on user role
export const getHomePathForRole = (role: User['role']): AppRoute => {
  switch (role) {
    case 'superadmin':
      return AppRoute.SuperAdminEvents;
    case 'admin':
    case 'organizer':
      return AppRoute.Dashboard;
    case 'attendee':
      return AppRoute.AttendeePortalDashboard;
    default:
      return AppRoute.Dashboard;
  }
};

interface LayoutProps {
  children: ReactNode;
}

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { pendingScans, isSyncing } = useEventData();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  let message = 'You are currently offline. Scans will be saved locally.';
  let bgColor = 'bg-amber-500';
  let icon = <WifiSlashIcon className="w-5 h-5 mr-2" />;

  if (isOnline) {
    if (isSyncing) {
      message = `Syncing ${pendingScans.length} offline scan(s)...`;
      bgColor = 'bg-primary-500';
      icon = <WifiIcon className="w-5 h-5 mr-2 animate-pulse" />;
    } else if (pendingScans.length > 0) {
      message = `Online. ${pendingScans.length} scan(s) waiting to sync.`;
      bgColor = 'bg-amber-500';
      icon = <WifiIcon className="w-5 h-5 mr-2" />;
    } else {
      return null;
    }
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-2 text-white text-center text-sm font-semibold z-50 flex items-center justify-center ${bgColor}`}>
      {icon}
      {message}
    </div>
  );
};


const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, loadingAuth, profileWarning } = useAuth();
  const { availableEvents, selectedEventId, setSelectedEventId, loadingEvents, currentEvent } = useSelectedEvent();
  const { t } = useLanguage();
  const { isSimulating, simulatedPlanName, setSimulatedPlan, simulatedPlanId } = useSimulation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allPlans, setAllPlans] = useState<PlanRow[]>([]);

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      supabase.from('plans').select('*').then(({ data }) => {
        if (data) setAllPlans(data);
      });
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate(AppRoute.Landing);
  };

  const publicRoutes = [
    AppRoute.Landing,
    AppRoute.Login,
    AppRoute.AttendeePortalLogin,
    AppRoute.BoothLogin,
    AppRoute.EventSelectorForScanner,
    AppRoute.Pricing,
    AppRoute.ClientPortal,
    AppRoute.EventSelection,
  ];

  const isPublicRoute = publicRoutes.includes(location.pathname as AppRoute) || location.pathname.startsWith('/events/');

  const showAppShell = !isPublicRoute && currentUser;

  if (!showAppShell) {
    // For Landing Page, we want to control the header/layout manually (specifically to avoid the fixed LanguageSwitcher)
    if (location.pathname === AppRoute.Landing) {
      return (
        <>
          <Toaster position="top-center" reverseOrder={false} />
          {children}
        </>
      );
    }
    return <PublicLayout>{children}</PublicLayout>;
  }

  const isAttendeePortal = currentUser?.role === 'attendee';
  const isManagingEventAsSuperAdmin = currentUser?.role === 'superadmin' && location.pathname !== AppRoute.SuperAdminEvents;

  const handleSimulatePlan = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planId = e.target.value;
    if (!planId) {
      setSimulatedPlan(null, null);
    } else {
      const plan = allPlans.find(p => p.id === planId);
      setSimulatedPlan(planId, plan?.name || null);
    }
  };

  let headerTopOffset = 0;
  if (isSimulating) headerTopOffset += 40;
  if (profileWarning) headerTopOffset += 36;


  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      {!isAttendeePortal && <ChatPanel />}

      {!isAttendeePortal && <Sidebar isOpen={isSidebarOpen} currentUser={currentUser} />}

      {/* Mobile/Tablet Overlay */}
      {isSidebarOpen && !isAttendeePortal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <div className={!isAttendeePortal ? "lg:ml-64 flex flex-col min-h-screen" : "flex flex-col min-h-screen"}>
        {isSimulating && (
          <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 p-2 text-center text-sm font-semibold flex items-center justify-center shadow-md">
            <span className="flex items-center gap-2">
              🧪 <strong>Testing Features:</strong> {simulatedPlanName}
              <span className="hidden sm:inline text-xs font-normal opacity-90 ml-1">
                (Event's real plan unchanged)
              </span>
            </span>
            <button
              onClick={() => setSimulatedPlan(null, null)}
              className="ml-4 px-3 py-1 bg-slate-900/20 hover:bg-slate-900/30 rounded font-bold transition-colors text-xs"
            >
              Stop Testing
            </button>
          </div>
        )}
        {profileWarning && (
          <div className="sticky z-50 bg-amber-400 text-black p-2 text-center text-sm font-semibold flex items-center justify-center shadow-md" role="alert" style={{ top: isSimulating ? '40px' : '0' }}>
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{profileWarning}</span>
          </div>
        )}

        {/* Main App Header - Hidden for Attendee Portal */}
        {!isAttendeePortal && (
          <header className={`bg-white dark:bg-slate-800 shadow-sm sticky z-40 border-b border-slate-200 dark:border-slate-700`} style={{ top: `${headerTopOffset}px` }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center h-auto min-h-16 flex-wrap">
              <div className="flex items-center">
                {!isAttendeePortal && (
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden mr-4"
                    aria-controls="sidebar"
                    aria-expanded={isSidebarOpen}
                  >
                    <span className="sr-only">Open sidebar</span>
                    {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                  </button>
                )}
                {isManagingEventAsSuperAdmin && (
                  <Link
                    to={AppRoute.SuperAdminEvents}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 ring-1 ring-inset ring-slate-200 dark:ring-slate-600"
                    title="Return to the list of all events"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">{t(localeKeys.allEvents)}</span>
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 py-1">
                {/* Settings Group */}
                <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                </div>

                {/* Separator */}
                {currentUser.role === 'superadmin' && (
                  <div className="hidden sm:block h-6 w-px bg-slate-300 dark:bg-slate-600" />
                )}

                {/* SuperAdmin: Plan Simulation */}
                {currentUser.role === 'superadmin' && (
                  <div className="relative group">
                    <select
                      id="plan-simulator"
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 
                               text-slate-700 dark:text-slate-200 font-medium py-2 pl-3 pr-9 rounded-md 
                               transition-all duration-150 text-sm appearance-none 
                               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                               border border-slate-200 dark:border-slate-700
                               cursor-pointer shadow-sm hover:shadow"
                      value={simulatedPlanId || ''}
                      onChange={handleSimulatePlan}
                      title="Simulate features from different pricing plans for testing purposes. Your event's actual plan will not be affected."
                    >
                      <option value="">🧪 Test Features: None</option>
                      {allPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          🧪 Test Features: {plan.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
                      <Icon name="chevronDown" className="w-4 h-4" stroke="2" />
                    </div>

                    {/* Tooltip on hover */}
                    <div className="invisible group-hover:visible absolute -bottom-12 left-1/2 -translate-x-1/2 
                                  bg-slate-900 dark:bg-slate-700 text-white text-xs rounded px-3 py-1.5 
                                  whitespace-nowrap z-50 shadow-lg opacity-0 group-hover:opacity-100 
                                  transition-opacity duration-200 pointer-events-none">
                      Simulate plan features for testing
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" />
                    </div>
                  </div>
                )}

                {/* Separator */}
                <div className="hidden sm:block h-6 w-px bg-slate-300 dark:bg-slate-600" />

                {/* Event Selection */}
                <div className="relative flex items-center bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all shadow-sm hover:shadow">
                  {currentEvent?.eventLogoUrl && (
                    <img src={currentEvent.eventLogoUrl} alt="Event Logo" className="h-6 w-auto ml-2 rounded-sm object-contain" />
                  )}
                  <select
                    id="event-selector"
                    className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold py-2 pl-3 pr-9 rounded-md transition-colors text-sm appearance-none focus:outline-none cursor-pointer min-w-[140px]"
                    value={selectedEventId || ''}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    disabled={loadingEvents || availableEvents.length === 0}
                    aria-label={t(localeKeys.selectAnEvent)}
                    title="Switch between your available events"
                  >
                    {loadingEvents && <option>{t(localeKeys.loading)}</option>}
                    {!loadingEvents && availableEvents.length === 0 && <option>{t(localeKeys.noEvents)}</option>}
                    {availableEvents.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
                    <Icon name="chevronDown" className="w-4 h-4" stroke="2" />
                  </div>
                </div>

                {/* Separator */}
                <div className="hidden sm:block h-6 w-px bg-slate-300 dark:bg-slate-600" />

                {/* User Menu */}
                {currentUser && <UserMenu />}
              </div>
            </div>
          </header>
        )}

        <main className="flex-grow p-4 sm:p-6 md:p-8 pb-16">
          <TestModeBanner />
          {children}
        </main>
      </div>

      {!isAttendeePortal && <OfflineIndicator />}
    </div>
  );
};

export default Layout;