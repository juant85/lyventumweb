// src/pages/admin/DashboardPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { useNavigate } from 'react-router-dom';
import { AppRoute, SessionRegistration, Booth, ScanRecord } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import SessionCountdown from '../../components/dashboard/SessionCountdown';
import DashboardCustomizer from '../../components/dashboard/DashboardCustomizer';
import AlertIndicators from '../../components/dashboard/AlertIndicators';
import FeaturesOverview from '../../components/features/FeaturesOverview';
import { useEventTypeConfig } from '../../contexts/EventTypeConfigContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileCard, MobileFAB, MobileEmptyState } from '../../components/mobile';
import SwipeableCarousel from '../../components/ui/SwipeableCarousel';
import QuickStatCard from '../../components/dashboard/QuickStatCard';
import { Calendar, Users } from 'lucide-react';
import OrganizerMobileDashboard from '../../components/mobile/dashboard/OrganizerMobileDashboard';
import SuperAdminMobileDashboard from '../../components/mobile/dashboard/SuperAdminMobileDashboard';
import EventManagementDashboard from '../../components/mobile/dashboard/EventManagementDashboard';
import { useAuth } from '../../contexts/AuthContext';

// --- Reusable Components for the new Dashboard ---

const Gauge: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const strokeWidth = 10;
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg className="absolute w-full h-full" viewBox="0 0 200 200">
        <circle
          className="text-slate-200 dark:text-slate-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
        />
        <circle
          className="text-primary-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{value}%</p>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
};

const MissingAttendeeList: React.FC<{ attendees: (SessionRegistration & { boothName?: string })[], onNavigate: (id: string) => void }> = ({ attendees, onNavigate }) => {
  const { t } = useLanguage();
  return (
    <Card title={t(localeKeys.missingInAction)} icon={<Icon name="userMinus" className="w-6 h-6 text-amber-500" />} bodyClassName="!p-0">
      {attendees.length === 0 ? (
        <p className="p-4 text-sm text-slate-500 dark:text-slate-400">{t(localeKeys.allAttendeesCheckedIn)}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {attendees.map(reg => (
            <li key={reg.id} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{reg.attendeeName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Expected at: {reg.boothName}</p>
              </div>
              <Button size="sm" variant="neutral" onClick={() => onNavigate(reg.attendeeId)}>View</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const BoothPerformanceList: React.FC<{ booths: { name: string, id: string, scans: number, capacity: number }[], title: string, icon: React.ReactNode }> = ({ booths, title, icon }) => (
  <Card title={title} icon={icon} bodyClassName="!p-0">
    {booths.length === 0 ? <p className="p-4 text-sm text-slate-500">No activity data.</p> : (
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {booths.map(booth => (
          <li key={booth.id} className="p-3 flex justify-between items-center">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{booth.name}</p>
            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{booth.scans}<span className="text-sm text-slate-400">/{booth.capacity}</span></p>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

const DashboardPage: React.FC = () => {
  const { scans, sessions, getOperationalSessionDetails, loadingData, dataError, fetchData, getSessionRegistrationsForSession, getBoothById } = useEventData();
  const { currentEvent, isInitializing } = useSelectedEvent();
  const { config, eventType, isVendorMeeting, isConference, isTradeShow } = useEventTypeConfig();
  const isMobile = useIsMobile(); // Mobile detection
  const navigate = useNavigate();
  const { t } = useLanguage();


  const [sessionRegistrations, setSessionRegistrations] = useState<(SessionRegistration & { boothName?: string })[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  // removed realLiveSession def since it's now liveSession above
  // ... kept clean


  const operationalDetails = useMemo(() => getOperationalSessionDetails(), [getOperationalSessionDetails]);
  const liveSession = useMemo(() => operationalDetails.session, [operationalDetails]);

  // Hook for registrations
  useEffect(() => {
    if (liveSession?.id) {
      // ... existing logic
      setLoadingRegistrations(true);
      getSessionRegistrationsForSession(liveSession.id)
        .then(result => {
          if (result.success) {
            setSessionRegistrations(result.data);
          } else {
            // 
          }
        })
        .finally(() => setLoadingRegistrations(false));
    } else {
      setSessionRegistrations([]);
    }
  }, [liveSession, getSessionRegistrationsForSession]);

  const liveMetrics = useMemo(() => {
    if (!liveSession || sessionRegistrations.length === 0) {
      return { meetingCompletion: 0, miaAttendees: [], topBooths: [], bottomBooths: [] };
    }

    const attendedCount = sessionRegistrations.filter(r => r.status === 'Attended').length;
    const meetingCompletion = sessionRegistrations.length > 0 ? Math.round((attendedCount / sessionRegistrations.length) * 100) : 0;

    const miaAttendees = sessionRegistrations
      .filter(r => r.status === 'Registered' && r.expectedBoothId);

    const scansInSession = scans.filter(s => s.sessionId === liveSession.id);
    const boothPerformance = liveSession.boothSettings.map(setting => {
      const boothScans = new Set(scansInSession.filter(s => s.boothId === setting.boothId).map(s => s.attendeeId)).size;
      return {
        id: setting.boothId,
        name: getBoothById(setting.boothId)?.companyName || 'Unknown',
        scans: boothScans,
        capacity: setting.capacity,
      };
    }).sort((a, b) => b.scans - a.scans);

    return {
      meetingCompletion,
      miaAttendees,
      topBooths: boothPerformance.slice(0, 5),
      bottomBooths: boothPerformance.filter(b => b.capacity > 0 && b.scans / b.capacity < 0.5).slice(-5).reverse(),
    };
  }, [liveSession, sessionRegistrations, scans, getBoothById]);

  // NEW: Walk-In Analytics (Vendor Meetings)
  const walkInStats = useMemo(() => {
    if (!liveSession || !config.showVendorAnalytics) {
      return { total: 0, rate: 0, byBooth: [] };
    }

    const scansInSession = scans.filter(s => s.sessionId === liveSession.id);
    const walkIns = scansInSession.filter(s => s.scanStatus === 'WALK_IN');

    const totalScans = scansInSession.length;
    const walkInCount = walkIns.length;
    const rate = totalScans > 0 ? Math.round((walkInCount / totalScans) * 100) : 0;

    // Walk-ins by booth
    const byBooth = liveSession.boothSettings.map(setting => {
      const boothWalkIns = walkIns.filter(s => s.boothId === setting.boothId);
      return {
        boothId: setting.boothId,
        boothName: getBoothById(setting.boothId)?.companyName || 'Unknown',
        walkIns: boothWalkIns.length
      };
    }).sort((a, b) => b.walkIns - a.walkIns);

    return { total: walkInCount, rate, byBooth };
  }, [liveSession, scans, config.showVendorAnalytics, getBoothById]);

  // NEW: Conference Analytics
  const conferenceStats = useMemo(() => {
    if (!liveSession || !config.showSessionAnalytics) {
      return { expected: 0, attended: 0, walkIns: 0, attendanceRate: 0, noShows: 0, noShowList: [] };
    }

    const expected = sessionRegistrations.length;
    const attended = sessionRegistrations.filter(r => r.status === 'Attended').length;

    // Walk-ins = scans without prior registration
    const scansInSession = scans.filter(s => s.sessionId === liveSession.id);
    const walkIns = scansInSession.filter(s => s.scanStatus === 'WALK_IN').length;

    const attendanceRate = expected > 0 ? Math.round((attended / expected) * 100) : 0;
    const noShows = expected - attended;

    // No-show attendees list
    const noShowList = sessionRegistrations
      .filter(r => r.status === 'Registered')
      .map(r => ({
        id: r.attendeeId,
        name: r.attendeeName || 'Unknown'
      }));

    return { expected, attended, walkIns, attendanceRate, noShows, noShowList };
  }, [liveSession, sessionRegistrations, scans, config.showSessionAnalytics]);

  // NEW: Trade Show Analytics
  const tradeShowStats = useMemo(() => {
    if (!liveSession || !config.showLeadCaptureMetrics) {
      return { uniqueLeads: 0, totalScans: 0, peakHour: 'N/A', peakHourCount: 0, returnRate: 0, leadsList: [] };
    }

    const scansInSession = scans.filter(s => s.sessionId === liveSession.id);

    // Unique leads
    const uniqueAttendeeIds = new Set(scansInSession.map(s => s.attendeeId));
    const uniqueLeads = uniqueAttendeeIds.size;
    const totalScans = scansInSession.length;

    // Return visitors (scanned 2+ times)
    const scanCounts = new Map<string, number>();
    scansInSession.forEach(s => {
      scanCounts.set(s.attendeeId, (scanCounts.get(s.attendeeId) || 0) + 1);
    });
    const returnVisitors = Array.from(scanCounts.values()).filter(count => count > 1).length;
    const returnRate = uniqueLeads > 0 ? Math.round((returnVisitors / uniqueLeads) * 100) : 0;

    // Peak hour
    const hourCounts: Record<string, number> = {};
    scansInSession.forEach(scan => {
      const hour = new Date(scan.timestamp).getHours();
      const hourStr = `${hour}:00-${hour + 1}:00`;
      hourCounts[hourStr] = (hourCounts[hourStr] || 0) + 1;
    });

    const peakEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakEntry ? peakEntry[0] : 'N/A';
    const peakHourCount = peakEntry ? peakEntry[1] : 0;

    // Leads list with details (for export)
    const leadsList = Array.from(uniqueAttendeeIds).map(attendeeId => {
      const attendeeScans = scansInSession.filter(s => s.attendeeId === attendeeId);
      const firstScan = attendeeScans.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
      return {
        id: attendeeId,
        name: firstScan?.attendeeName || 'Unknown',
        scanCount: attendeeScans.length,
        firstContact: firstScan?.timestamp || new Date().toISOString()
      };
    }).sort((a, b) => new Date(b.firstContact).getTime() - new Date(a.firstContact).getTime());

    return { uniqueLeads, totalScans, peakHour, peakHourCount, returnRate, leadsList };
  }, [liveSession, scans, config.showLeadCaptureMetrics]);



  // Show loading skeleton during initial event selection
  if (isInitializing || loadingData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t(localeKeys.dashboardTitle)}</h1>
        <Card title={t(localeKeys.error)} className="border-accent-600 bg-accent-50">
          <p className="text-accent-700 font-semibold">{dataError}</p>
          <Button onClick={() => fetchData(true)} size="md" variant="accent" leftIcon={<Icon name="refresh" className="w-4 h-4" />} className="mt-4">Try Again</Button>
        </Card>
      </div>
    );
  }


  // MOBILE VIEW - Use EventManagementDashboard (has all features)
  // This component handles both live and non-live sessions gracefully
  if (isMobile) {
    return <EventManagementDashboard />;
  }

  // DESKTOP VIEW - No Live Session
  if (!liveSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {currentEvent?.eventLogoUrl && <img src={currentEvent.eventLogoUrl} alt={`${currentEvent.companyName} logo`} className="h-12 w-auto object-contain bg-slate-200 dark:bg-slate-700 p-1 rounded-md" />}
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t(localeKeys.dashboardTitle)}</h1>
            <p className="text-lg text-slate-500 font-medium">{currentEvent?.name}</p>
          </div>
        </div>
        <Card title={t(localeKeys.sessionInProgress)}>
          <div className="text-center py-10">
            <Icon name="signal" className="w-12 h-12 mx-auto text-slate-400" />
            <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">{t(localeKeys.noActiveSession)}</h3>
            <p className="mt-1 text-slate-500">{t(localeKeys.dashboardWillActivate)}</p>
            <Button onClick={() => navigate(AppRoute.DataVisualization)} variant="primary" className="mt-6">{t(localeKeys.viewAllSessions)}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Event Type Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-montserrat flex items-center gap-3">
            <Icon name="dashboard" className="w-8 h-8 text-secondary-500" />
            {t(localeKeys.dashboardTitle) || 'Dashboard'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {currentEvent?.name || 'No Event Selected'}
          </p>
        </div>

        {/* NEW: Event Type Visual Badge */}
        <div className="flex items-center gap-3">
          {isVendorMeeting && (
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg flex items-center gap-2">
              <span className="text-2xl">🤝</span>
              <span className="font-semibold text-sm">Vendor Meetings</span>
            </div>
          )}
          {isConference && (
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-lg flex items-center gap-2">
              <span className="text-2xl">🎤</span>
              <span className="font-semibold text-sm">Conference</span>
            </div>
          )}
          {isTradeShow && (
            <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              <span className="font-semibold text-sm">Trade Show</span>
            </div>
          )}
          {!isVendorMeeting && !isConference && !isTradeShow && (
            <div className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full shadow-lg flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              <span className="font-semibold text-sm">Hybrid Event</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Icon name="calendar" className="w-5 h-5 text-secondary-500" />
          {currentEvent?.name || 'No Event Selected'}
        </p>
        <div className="flex items-center gap-3 mt-3 text-secondary-600 dark:text-secondary-400 font-semibold">
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-secondary-500"></span></span>
          <span className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded">LIVE</span>
            {t(localeKeys.sessionInProgress)}: {liveSession.name}
          </span>
        </div>
      </div>

      {/* Quick Actions and Countdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <DashboardCustomizer />
        <SessionCountdown session={liveSession} />
      </div>

      {/* Alert Indicators */}
      <AlertIndicators
        emptyBooths={liveMetrics.bottomBooths.filter(b => b.scans === 0).length}
        totalBooths={liveSession.boothSettings.length}
        checkInRate={liveMetrics.meetingCompletion}
        activeAttendees={sessionRegistrations.filter(r => r.status === 'Attended').length}
        expectedAttendees={sessionRegistrations.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Key Gauge and MIA List */}
        <div className="lg:col-span-1 space-y-6">
          <Card title={t(localeKeys.meetingCompletion)} icon={<Icon name="checkCircle" className="w-6 h-6 text-primary-500" />}>
            <div className="flex items-center justify-center py-4">
              <Gauge value={liveMetrics.meetingCompletion} label={t(localeKeys.fulfilled)} />
            </div>
          </Card>
          <MissingAttendeeList
            attendees={liveMetrics.miaAttendees}
            onNavigate={(id) => navigate(`/ attendee - profiles / ${id} `)}
          />
        </div>

        {/* Right Column: Booth Performance + Activity Feed - Only for event types with vendor features */}
        <div className="lg:col-span-2 space-y-6">
          {config.showVendorAnalytics && (
            <>
              {/* NEW: Walk-In Analytics Cards */}
              <Card title="🚶 Walk-In Leads Captured" icon={<Icon name="userPlus" className="w-6 h-6 text-blue-500" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{walkInStats.total}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total walk-ins</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">{walkInStats.rate}%</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Capture rate</p>
                  </div>
                </div>
              </Card>

              {/* Walk-In Booth Ranking */}
              {walkInStats.byBooth.length > 0 && (
                <Card title="🏆 Top Walk-In Performers">
                  <div className="space-y-2">
                    {walkInStats.byBooth.slice(0, 5).map((booth, idx) => (
                      <div key={booth.boothId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-slate-400'}`}>
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{booth.boothName}</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{booth.walkIns}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Existing Booth Performance */}
              <BoothPerformanceList title={t(localeKeys.mostActiveBooths)} icon={<Icon name="usersGroup" className="w-6 h-6 text-green-500" />} booths={liveMetrics.topBooths} />
              <BoothPerformanceList title={t(localeKeys.leastActiveBooths)} icon={<Icon name="store" className="w-6 h-6 text-red-500" />} booths={liveMetrics.bottomBooths} />
            </>
          )}

          {/* NEW: Conference Analytics - Detailed */}
          {config.showSessionAnalytics && isConference && (
            <>
              <Card title="📊 Attendance Analysis">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{conferenceStats.expected}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Expected</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{conferenceStats.attended}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Attended</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{conferenceStats.walkIns}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Walk-ins</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${conferenceStats.attendanceRate}%` }}
                    >
                      {conferenceStats.attendanceRate > 15 && (
                        <span className="text-xs font-bold text-white">{conferenceStats.attendanceRate}%</span>
                      )}
                    </div>
                  </div>
                  <p className="text-center text-sm mt-2 font-semibold text-slate-700 dark:text-slate-300">
                    {conferenceStats.attendanceRate}% attendance rate
                  </p>
                </div>
              </Card>

              {/* No-Show List */}
              {conferenceStats.noShowList.length > 0 && (
                <Card title="❌ No-Shows">
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {conferenceStats.noShowList.map(attendee => (
                      <div key={attendee.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{attendee.name}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    {conferenceStats.noShows} registered but didn't attend
                  </p>
                </Card>
              )}
            </>
          )}

          {/* Trade Show - Full Analytics */}
          {config.showLeadCaptureMetrics && isTradeShow && (
            <>
              <Card title="🏢 Lead Capture Performance">
                {/* Primary Metric */}
                <div className="text-center mb-6">
                  <p className="text-6xl font-bold text-green-600 dark:text-green-400">{tradeShowStats.uniqueLeads}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Unique leads captured</p>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Peak Hour</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{tradeShowStats.peakHour}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{tradeShowStats.peakHourCount} scans</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Return Rate</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{tradeShowStats.returnRate}%</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">High interest</p>
                  </div>
                </div>
              </Card>

              {/* Leads List - Ready for Export */}
              {tradeShowStats.leadsList.length > 0 && (
                <Card title="📋 Captured Leads">
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {tradeShowStats.leadsList.map((lead, idx) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-400">#{idx + 1}</span>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{lead.name}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            First contact: {new Date(lead.firstContact).toLocaleString()}
                          </p>
                        </div>
                        {lead.scanCount > 1 && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded">
                              {lead.scanCount}× return
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-4 text-center">
                    💡 Export this list from Reports page for full contact details
                  </p>
                </Card>
              )}
            </>
          )}

          {/* Activity Feed */}
          <Card>
            <ActivityFeed
              scans={scans.filter(s => s.sessionId === liveSession.id)}
              registrations={sessionRegistrations}
              maxItems={15}
            />
          </Card>
        </div>
      </div>

      {/* Features Overview Section */}
      <div className="mt-6">
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <span>{showFeatures ? '▼' : '▶'}</span>
          <span>Your Active Features</span>
        </button>

        {showFeatures && (
          <div className="mt-4">
            <FeaturesOverview />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
