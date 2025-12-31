import React, { lazy, Suspense, ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EventDataProvider } from './contexts/EventDataContext';
import { SelectedEventProvider } from './contexts/SelectedEventContext';
import { EventTypeConfigProvider } from './contexts/EventTypeConfigContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { SimulationProvider } from './contexts/SimulationContext';
import { SessionProvider } from './contexts/sessions';
import { BoothProvider } from './contexts/booths';
import { AttendeeProvider } from './contexts/attendees';
import { ScanProvider } from './contexts/scans';
import Layout, { getHomePathForRole } from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import MobileErrorFallback from './components/mobile/MobileErrorFallback';
import MobileLoadingSkeleton from './components/mobile/MobileLoadingSkeleton';
import ProtectedRoute from './components/ProtectedRoute';
import { AppRoute, User } from './types';
import FeatureGuard from './components/FeatureGuard';
import { Feature } from './features';
import { LanguageProvider } from './contexts/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIsMobile } from './hooks/useIsMobile';

// DatePicker Styles - Global import for premium design
import 'react-datepicker/dist/react-datepicker.css';
import './styles/datepicker-custom.css';


// Lazy load all page components from their new directories
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const ClientPortalPage = lazy(() => import('./pages/public/ClientPortalPage'));
const EventSelectionPage = lazy(() => import('./pages/public/EventSelectionPage'));
const AttendeeLoginPage = lazy(() => import('./pages/public/AttendeeLoginPage'));
const AttendeeAccessPage = lazy(() => import('./pages/public/AttendeeAccessPage'));
const ScannerLoginPage = lazy(() => import('./pages/public/ScannerLoginPage'));
const SetPasswordPage = lazy(() => import('./pages/public/SetPasswordPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));
const EventSelectorForScannerPage = lazy(() => import('./pages/public/EventSelectorForScannerPage'));

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const QRScannerPage = lazy(() => import('./pages/admin/QRScannerPage'));
const DataVisualizationPage = lazy(() => import('./pages/admin/DataVisualizationPage'));
const SessionSettingsPage = lazy(() => import('./pages/admin/SessionSettingsPage'));
const TracksSettingsPage = lazy(() => import('./pages/admin/TracksSettingsPage'));
const DataEditorPage = lazy(() => import('./pages/admin/DataEditorPage'));
const RealTimeAnalyticsPage = lazy(() => import('./pages/admin/RealTimeAnalyticsPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const BoothSetupPage = lazy(() => import('./pages/admin/BoothSetupPage'));
const EmailSettingsPage = lazy(() => import('./pages/admin/EmailSettingsPage'));
const EmailCommunicationsPage = lazy(() => import('./pages/admin/EmailCommunicationsPage'));
const ChallengeSettingsPage = lazy(() => import('./pages/admin/ChallengeSettingsPage'));
const SuperAdminEventsPage = lazy(() => import('./pages/admin/SuperAdminEventsPage'));
const SuperAdminAttendeesPage = lazy(() => import('./pages/admin/SuperAdminAttendeesPage'));
const SuperAdminPlansPage = lazy(() => import('./pages/admin/SuperAdminPlansPage'));
const SuperAdminClientsPage = lazy(() => import('./pages/admin/SuperAdminClientsPage'));
const SuperAdminClientDetailPage = lazy(() => import('./pages/admin/SuperAdminClientDetailPage'));
const ChangePasswordPage = lazy(() => import('./pages/admin/ChangePasswordPage'));

// Non-admin pages that are still protected
const AttendeeRegistrationPage = lazy(() => import('./pages/admin/AttendeeRegistrationPage'));
const AttendeeProfilesPage = lazy(() => import('./pages/admin/AttendeeProfilesPage'));
const AccessCodesManagementPage = lazy(() => import('./pages/admin/AccessCodesManagementPage'));
const VendorProfilesPage = lazy(() => import('./pages/VendorProfilesPage'));
const AttendeeProfileDetailPage = lazy(() => import('./pages/admin/AttendeeProfileDetailPage'));
const MasterImportPage = lazy(() => import('./pages/MasterImportPage'));
const CheckInDeskPage = lazy(() => import('./pages/CheckInDeskPage'));
const AttendeeLocatorPage = lazy(() => import('./pages/AttendeeLocatorPage'));

const AttendeeLayout = lazy(() => import('./components/attendee/layout/AttendeeLayout'));
const AttendeeDashboard = lazy(() => import('./pages/attendee/AttendeeDashboard'));
const AttendeeAgenda = lazy(() => import('./pages/attendee/AttendeeAgenda'));
const AttendeeProfile = lazy(() => import('./pages/attendee/AttendeeProfile'));
const BoothChallenge = lazy(() => import('./pages/attendee/BoothChallenge'));
const AttendeeStats = lazy(() => import('./pages/attendee/AttendeeStats'));

const AttendeeDashboardPage = lazy(() => import('./pages/admin/AttendeeDashboardPage'));

// Temporary: Icon Test Page for verification
const IconTestPage = lazy(() => import('./pages/IconTestPage'));

const queryClient = new QueryClient();

// Smart loading fallback - uses skeleton on mobile, spinner on desktop
const LoadingFallback = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return <MobileLoadingSkeleton />;
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-slate-100 dark:bg-slate-900">
      <div className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md text-center">
        <svg className="animate-spin h-8 w-8 text-brandBlue mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-montserrat text-slate-600 dark:text-slate-300">Loading Page...</p>
      </div>
    </div>
  );
};


const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={AppRoute.Landing} element={<LandingPage />} />
      <Route path={AppRoute.Login} element={<LoginPage />} />
      <Route path={AppRoute.Pricing} element={<PricingPage />} />
      <Route path={AppRoute.ClientPortal} element={<ClientPortalPage />} />
      <Route path={AppRoute.EventSelection} element={<EventSelectionPage />} />
      <Route path={AppRoute.AttendeePortalLogin} element={<AttendeeLoginPage />} />
      <Route path="/access" element={<AttendeeAccessPage />} />
      <Route path="/attendee/access" element={<Navigate to="/access" replace />} />
      <Route path={AppRoute.BoothLogin} element={<ScannerLoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path={AppRoute.EventSelectorForScanner} element={<EventSelectorForScannerPage />} />

      {/* Temporary: Icon Test Page */}
      <Route path="/icon-test" element={<IconTestPage />} />

      {/* Booth-specific Scanner Route (now allows organizers too) */}
      <Route path={AppRoute.QRScanner} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']} boothAccessOrRoles={true}><QRScannerPage /></ProtectedRoute>} />

      {/* Protected Routes for Organizers/Admins */}
      <Route path={AppRoute.Dashboard} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><DashboardPage /></ProtectedRoute>} />
      <Route path={AppRoute.DataVisualization} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.DATA_VISUALIZATION}><DataVisualizationPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.SessionSettings} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.SESSION_SETTINGS}><SessionSettingsPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.TracksSettings} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.TRACKS}><TracksSettingsPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.DataEditor} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.DATA_EDITOR}><DataEditorPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.RealTimeAnalytics} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.REAL_TIME_ANALYTICS}><RealTimeAnalyticsPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.Reports} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.REPORTS}><ReportsPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.BoothSetup} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.BOOTH_SETUP}><BoothSetupPage /></FeatureGuard></ProtectedRoute>} />
      <Route path="/email-settings" element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><EmailSettingsPage /></ProtectedRoute>} />
      <Route path="/email-communications" element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><EmailCommunicationsPage /></ProtectedRoute>} />
      <Route path="/challenge-settings" element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.BOOTH_CHALLENGE}><ChallengeSettingsPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.AttendeeRegistration} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.ATTENDEE_REGISTRATION}><AttendeeRegistrationPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.AttendeeProfiles} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.ATTENDEE_PROFILES}><AttendeeProfilesPage /></FeatureGuard></ProtectedRoute>} />
      <Route path="/access-codes" element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><AccessCodesManagementPage /></ProtectedRoute>} />
      <Route path={AppRoute.AttendeeProfileDetail} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.ATTENDEE_PROFILES}><AttendeeProfileDetailPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.VendorProfiles} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.ATTENDEE_PROFILES}><VendorProfilesPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.MasterImport} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.MASTER_IMPORT}><MasterImportPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.CheckInDesk} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.CHECK_IN_DESK}><CheckInDeskPage /></FeatureGuard></ProtectedRoute>} />
      <Route path={AppRoute.AttendeeLocator} element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.ATTENDEE_LOCATOR}><AttendeeLocatorPage /></FeatureGuard></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><ChangePasswordPage /></ProtectedRoute>} />

      {/* Mobile-Friendly "Native" Routes */}
      <Route path="/sessions/new" element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.SESSION_SETTINGS}><SessionSettingsPage /></FeatureGuard></ProtectedRoute>} />
      <Route path="/sessions/:id" element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.SESSION_SETTINGS}><SessionSettingsPage /></FeatureGuard></ProtectedRoute>} />
      <Route path="/attendees/add" element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'superadmin']}><FeatureGuard featureKey={Feature.ATTENDEE_REGISTRATION}><AttendeeRegistrationPage /></FeatureGuard></ProtectedRoute>} />

      {/* SuperAdmin Routes */}
      <Route path={AppRoute.SuperAdminEvents} element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminEventsPage /></ProtectedRoute>} />
      <Route path="/admin/attendees" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminAttendeesPage /></ProtectedRoute>} />
      <Route path={AppRoute.SuperAdminPlans} element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminPlansPage /></ProtectedRoute>} />
      <Route path={AppRoute.SuperAdminClients} element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminClientsPage /></ProtectedRoute>} />
      <Route path={AppRoute.SuperAdminClientDetail} element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminClientDetailPage /></ProtectedRoute>} />

      {/* Protected Routes for Attendees - New Portal */}
      <Route path="/portal" element={<ProtectedRoute allowedRoles={['attendee']}><AttendeeLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AttendeeDashboard />} />
        <Route path="agenda" element={<AttendeeAgenda />} />
        <Route path="challenge" element={<FeatureGuard featureKey={Feature.BOOTH_CHALLENGE}><BoothChallenge /></FeatureGuard>} />
        <Route path="stats" element={<AttendeeStats />} />
        <Route path="profile" element={<AttendeeProfile />} />
      </Route>

      {/* Legacy Attendee Dashboard */}
      <Route path={AppRoute.AttendeePortalDashboard} element={<ProtectedRoute allowedRoles={['attendee']}><AttendeeDashboardPage /></ProtectedRoute>} />

      {/* Redirect root based on auth status */}
      <Route path="*" element={currentUser ? <Navigate to={getHomePathForRole(currentUser.role)} replace /> : <Navigate to={AppRoute.Landing} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <SelectedEventProvider>
              <EventTypeConfigProvider> {/* NEW: Event type feature flags */}
                <SimulationProvider>
                  <FeatureFlagProvider>
                    <QueryClientProvider client={queryClient}>
                      {/* New modular contexts */}
                      <SessionProvider>
                        <BoothProvider>
                          <AttendeeProvider>
                            <ScanProvider>
                              {/* Legacy EventDataProvider - keep for backward compatibility */}
                              <EventDataProvider>
                                <ChatProvider>
                                  <Layout>
                                    <ErrorBoundary>
                                      <Suspense fallback={<LoadingFallback />}>
                                        <AppRoutes />
                                      </Suspense>
                                    </ErrorBoundary>
                                  </Layout>
                                </ChatProvider>
                              </EventDataProvider>
                            </ScanProvider>
                          </AttendeeProvider>
                        </BoothProvider>
                      </SessionProvider>
                    </QueryClientProvider>
                  </FeatureFlagProvider>
                </SimulationProvider>
              </EventTypeConfigProvider>
            </SelectedEventProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;