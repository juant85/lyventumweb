// src/pages/admin/DataVisualizationPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { Session, ScanRecord, Booth, SessionRegistration, BoothLayoutConfig } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { TableCellsIcon, CheckCircleIcon, XMarkIcon, UserIcon, UserPlusIcon, ExclamationTriangleIcon } from '../../components/Icons';

import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAutoRefresh, getTimeAgoString, REFRESH_INTERVALS } from '../../hooks/useAutoRefresh';
import { ArrowPathIcon } from '../../components/Icons';
import { toast } from 'react-hot-toast';
import { AppRoute } from '../../types';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { Feature } from '../../features';
import { TrackFilter } from '../../features/tracks/components/TrackFilter';
import { useBoothCountsByTrack } from '../../features/tracks/hooks/useBoothCountsByTrack';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import { BoothMap } from '../../components/booths/BoothMap';
import { BoothSummaryStats } from '../../components/booths/BoothSummaryStats';
import { motion } from 'framer-motion';
import { Users, Store, CheckCircle, Percent, Inbox, Calendar } from 'lucide-react';
import { StatCardSkeleton, BoothCardSkeleton } from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';
import { useBoothCapacity } from '../../hooks/useBoothCapacity';

// Stats Card Component
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color: 'primary' | 'green' | 'amber' | 'purple';
  delay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, trend, color, delay = 0 }) => {
  const colorMap = {
    primary: 'from-primary-500/20 to-primary-600/10',
    green: 'from-green-500/20 to-green-600/10',
    amber: 'from-amber-500/20 to-amber-600/10',
    purple: 'from-purple-500/20 to-purple-600/10',
  };

  const iconColorMap = {
    primary: 'text-primary-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <div className={`p-6 rounded-xl bg-gradient-to-br ${colorMap[color]} border border-slate-700/50 hover:border-${color}-500/50 transition-all duration300`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400 mb-2">{label}</p>
            <motion.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: delay + 0.2 }}
              className="text-4xl font-bold text-white font-montserrat"
            >
              {value}
            </motion.p>
            {trend && (
              <p className="text-xs text-green-400 mt-2">
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-slate-800/50 ${iconColorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface BoothCardProps {
  booth: Booth;
  attendeesCount: number;
  capacity: number;
  sessionStatus: 'live' | 'past' | 'future';
  onClick: () => void;
}

const BoothDisplayCard: React.FC<BoothCardProps> = ({ booth, attendeesCount, capacity, sessionStatus, onClick }) => {
  const { t } = useLanguage();
  const isFuture = sessionStatus === 'future';
  const displayAttendees = isFuture ? 0 : attendeesCount;
  const occupancyPercentage = capacity > 0 ? (displayAttendees / capacity) * 100 : 0;
  const isAtCapacity = occupancyPercentage >= 99;

  // --- Live Session: Use BackgroundGradient ---
  if (sessionStatus === 'live') {
    let statusText = '';
    let dynamicStyles = ''; // for inner card bg and text
    let wrapperStyles = 'transition-transform duration-200 hover:scale-[1.03]';

    if (isAtCapacity) {
      dynamicStyles = 'bg-secondary-50 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-300'; // Green
      statusText = 'At Capacity';
    } else if (displayAttendees > 0) {
      dynamicStyles = 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'; // Yellow
      statusText = 'Active';
    } else {
      dynamicStyles = 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'; // Red
      statusText = 'Empty';
    }

    const progressBarColor = isAtCapacity ? 'bg-secondary-500' : displayAttendees > 0 ? 'bg-amber-500' : 'bg-red-500';

    return (
      <BackgroundGradient containerClassName={`${wrapperStyles} rounded-xl h-full`}>
        <button
          onClick={onClick}
          className={`w-full text-left p-4 rounded-[11px] h-full ${dynamicStyles}`}
          aria-label={`View details for booth ${booth.companyName}. Status: ${statusText}.`}
        >
          <div className="flex justify-between items-start">
            <h4 className="text-lg font-bold font-montserrat">{booth.companyName}</h4>
            <div className="text-xs font-semibold opacity-80">{booth.physicalId}</div>
          </div>
          <div className="mt-2">
            <p className="text-3xl sm:text-4xl font-bold">
              {displayAttendees}<span className="text-xl sm:text-2xl opacity-60">/{capacity}</span>
            </p>
            <p className="text-sm font-medium opacity-80">{statusText}</p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
            <div className={`h-2 rounded-full ${progressBarColor}`} style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}></div>
          </div>
        </button>
      </BackgroundGradient>
    );
  }

  // --- Past or Future Session: Use old style ---
  let baseCardStyles = 'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full text-left p-4 rounded-xl shadow-md border-2';
  let dynamicStyles = '';
  let statusText = '';
  let wrapperStyles = 'transition-transform duration-200';
  let progressBarColor = '';

  if (isFuture) {
    dynamicStyles = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400';
    statusText = 'Upcoming';
    progressBarColor = '!bg-slate-300 dark:!bg-slate-600';
    wrapperStyles += ' opacity-80';
  } else { // Past
    if (isAtCapacity) {
      dynamicStyles = 'border-secondary-400 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-300';
      statusText = "Was at Capacity";
      progressBarColor = 'bg-secondary-500';
    } else if (displayAttendees > 0) {
      dynamicStyles = 'border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300';
      statusText = "Had Activity";
      progressBarColor = 'bg-amber-500';
    } else {
      dynamicStyles = 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      statusText = "Was Empty";
      progressBarColor = 'bg-red-500';
    }
    wrapperStyles += ' filter grayscale opacity-80 hover:opacity-100 hover:filter-none';
  }

  return (
    <div className={wrapperStyles + ' h-full'}>
      <button
        onClick={onClick}
        className={`${baseCardStyles} ${dynamicStyles} h-full`}
        aria-label={`View details for booth ${booth.companyName}. Status: ${statusText}.`}
      >
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-bold font-montserrat">{booth.companyName}</h4>
          <div className="text-xs font-semibold opacity-80">{booth.physicalId}</div>
        </div>
        <div className="mt-2">
          <p className="text-3xl sm:text-4xl font-bold">
            {displayAttendees}<span className="text-xl sm:text-2xl opacity-60">/{capacity}</span>
          </p>
          <p className="text-sm font-medium opacity-80">{statusText}</p>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
          <div
            className={`h-2 rounded-full ${progressBarColor}`}
            style={{ width: `${isFuture ? 0 : Math.min(occupancyPercentage, 100)}%` }}
          ></div>
        </div>
      </button>
    </div>
  );
};

const AttendeeList = ({ title, attendees, icon, statusColor, type }: { title: string, attendees: (SessionRegistration | ScanRecord)[], icon: React.ReactNode, statusColor: string, type: 'reg' | 'scan' }) => {
  const { t } = useLanguage();
  return (
    <div>
      <h4 className={`text-md font-semibold font-montserrat mb-2 flex items-center ${statusColor}`}>
        {icon} <span className="ml-2">{title} ({attendees.length})</span>
      </h4>
      {attendees.length > 0 ? (
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 font-sans max-h-48 overflow-y-auto pr-2">
          {attendees.map(item => (
            <li key={item.id} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center">
              <UserIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span>{type === 'reg' ? (item as SessionRegistration).attendeeName : (item as ScanRecord).attendeeName || item.attendeeId}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500 dark:text-slate-300 font-sans italic px-2">{t(localeKeys.noneInCategory)}</p>}
    </div>
  );
};


const DataVisualizationPage: React.FC = () => {
  const { sessions, scans, getBoothById, getOperationalSessionDetails, getSessionRegistrationsForSession, fetchData } = useEventData();
  const { selectedEventId, currentEvent, fetchAvailableEvents, updateEvent } = useSelectedEvent();

  // Auto-refresh setup for real-time monitoring
  const [autoRefreshState, autoRefreshControls] = useAutoRefresh({
    enabled: true, // Start enabled by default
    intervalMs: REFRESH_INTERVALS.NORMAL, // 30 seconds
    onRefresh: async () => {
      await fetchData(false); // Silent refresh (no loader)
    },
    pauseOnHidden: true // Pause when tab hidden to save battery
  });

  // --- AUTO-SYNC EVENT DATES WITH SESSIONS ---
  // If the event metadata dates don't match the actual session range, update the event metadata.
  // This ensures "Manage Events" list always shows the correct range based on actual sessions.
  useEffect(() => {
    if (!currentEvent || !sessions || sessions.length === 0) return;

    const startDates = sessions.map(s => new Date(s.startTime).getTime());
    const endDates = sessions.map(s => new Date(s.endTime).getTime());

    if (startDates.length === 0) return;

    const minSessionDate = new Date(Math.min(...startDates));
    const maxSessionDate = new Date(Math.max(...endDates));

    const eventStart = currentEvent.startDate ? new Date(currentEvent.startDate) : null;
    const eventEnd = currentEvent.endDate ? new Date(currentEvent.endDate) : null;

    // Helper to compare dates (ignoring time)
    const isSameDay = (d1: Date | null, d2: Date) => {
      if (!d1) return false;
      return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
    };

    // Only update if the event dates are MISSING. 
    // Do NOT overwrite existing dates, as the user might have manually corrected them 
    // (e.g. if sessions were imported with wrong year 2001).
    const needsUpdate = (!eventStart || !eventEnd) && (minSessionDate && maxSessionDate);

    if (needsUpdate) {
      console.log('[DataVisualization] Auto-filling missing Event Dates from Sessions:',
        minSessionDate.toISOString().split('T')[0], 'to', maxSessionDate.toISOString().split('T')[0]);

      updateEvent(currentEvent.id, {
        startDate: minSessionDate.toISOString().split('T')[0],
        endDate: maxSessionDate.toISOString().split('T')[0]
      });
    }
  }, [sessions, currentEvent, updateEvent]);
  const { isFeatureEnabled } = useFeatureFlags();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<'physicalId' | 'companyName'>('physicalId');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoothForModal, setSelectedBoothForModal] = useState<Booth | null>(null);
  const [boothAttendeeDetails, setBoothAttendeeDetails] = useState<{ presentAndExpected: SessionRegistration[], presentButUnexpected: ScanRecord[], expectedButAbsent: SessionRegistration[] }>({ presentAndExpected: [], presentButUnexpected: [], expectedButAbsent: [] });
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>('all');

  const [registrationsForSession, setRegistrationsForSession] = useState<SessionRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>();

  // CRITICAL FIX: Calculate real-time booth capacities excluding vendors
  const { data: boothCountsByTrack } = useBoothCountsByTrack(selectedSessionId, selectedTrackId);

  // Feature gate for booth map
  const hasMapAccess = isFeatureEnabled(Feature.BOOTH_MAP);

  // Local state for booth layout - this is the source of truth for the current session
  // It updates immediately (optimistically) when user saves, then syncs with DB
  const [layoutConfig, setLayoutConfig] = useState<BoothLayoutConfig | undefined>(
    currentEvent?.boothLayoutConfig || undefined
  );

  // Sync layout config when event changes AND fetch from DB
  useEffect(() => {
    const fetchLayoutConfig = async () => {
      if (!selectedEventId) {
        setLayoutConfig(undefined);
        return;
      }

      console.log('🔍 DataViz useEffect - Fetching layout from DB for event:', selectedEventId);

      try {
        const { data, error } = await supabase
          .from('events')
          .select('booth_layout_config')
          .eq('id', selectedEventId)
          .single();

        if (error) {
          console.error('❌ Error fetching layout config:', error);
          setLayoutConfig(currentEvent?.boothLayoutConfig || undefined);
          return;
        }

        console.log('✅ Loaded layout from DB:', data?.booth_layout_config);
        setLayoutConfig(data?.booth_layout_config || undefined);
      } catch (err) {
        console.error('❌ Exception fetching layout:', err);
        setLayoutConfig(currentEvent?.boothLayoutConfig || undefined);
      }
    };

    fetchLayoutConfig();
  }, [selectedEventId]); // Fetch whenever selectedEventId changes (including on mount)

  const handleSaveLayout = async (newConfig: BoothLayoutConfig) => {
    if (!selectedEventId) return;

    console.log('🔍 DataViz handleSaveLayout - Received config:', newConfig);

    // 1. Optimistic update - update UI immediately
    setLayoutConfig(newConfig);

    try {
      // 2. Save to database
      const { error } = await supabase
        .from('events')
        .update({ booth_layout_config: newConfig })
        .eq('id', selectedEventId);

      if (error) throw error;

      console.log('✅ DataViz handleSaveLayout - Saved to DB successfully');
      toast.success(t(localeKeys.layoutSavedSuccess));
    } catch (err: any) {
      console.error('❌ DataViz handleSaveLayout - Error:', err);
      // 3. Rollback on error
      setLayoutConfig(currentEvent?.boothLayoutConfig || undefined);
      toast.error(t(localeKeys.layoutSaveError));
    }
  };



  const eventDays = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    const dates = new Set(sessions.map(s => new Date(s.startTime).toDateString()));
    return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [sessions]);

  const sessionsForDisplay = useMemo(() => {
    if (selectedDate === 'all') {
      return sessions;
    }
    return sessions.filter(s => new Date(s.startTime).toDateString() === selectedDate);
  }, [sessions, selectedDate]);


  useEffect(() => {
    const checkLiveSession = () => {
      const operationalDetails = getOperationalSessionDetails(new Date(), 5); // 5 min grace period
      if (operationalDetails.status === 'active' || operationalDetails.status === 'starting_soon' || operationalDetails.status === 'ending_soon') {
        setLiveSessionId(operationalDetails.session?.id || null);
      } else {
        setLiveSessionId(null);
      }
    };
    checkLiveSession();
    const interval = setInterval(checkLiveSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [getOperationalSessionDetails]);

  useEffect(() => {
    if (selectedSessionId && !sessionsForDisplay.some(s => s.id === selectedSessionId)) {
      setSelectedSessionId('');
    }

    const currentSelectedSessionIsValid = selectedSessionId && sessionsForDisplay.some(s => s.id === selectedSessionId);

    if (sessionsForDisplay.length > 0 && !currentSelectedSessionIsValid) {
      const liveId = liveSessionId;
      if (liveId && sessionsForDisplay.some(s => s.id === liveId)) {
        setSelectedSessionId(liveId);
      } else {
        const now = new Date();
        const currentSessionByTime = sessionsForDisplay.find(s => new Date(s.startTime) <= now && new Date(s.endTime) >= now);
        setSelectedSessionId(currentSessionByTime ? currentSessionByTime.id : sessionsForDisplay[0].id);
      }
    } else if (sessionsForDisplay.length === 0) {
      setSelectedSessionId('');
    }
  }, [sessionsForDisplay, selectedSessionId, liveSessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      setRegistrationsForSession([]);
      return;
    }
    setLoadingRegistrations(true);
    getSessionRegistrationsForSession(selectedSessionId)
      .then(result => {
        if (result.success) {
          setRegistrationsForSession(result.data);
        } else {
          setRegistrationsForSession([]);
        }
      })
      .finally(() => setLoadingRegistrations(false));

  }, [selectedSessionId, getSessionRegistrationsForSession, scans]);


  const selectedSession = useMemo(() => sessions.find(s => s.id === selectedSessionId), [sessions, selectedSessionId]);

  /**
   * Real-time booth capacity calculation
   * 
   * This hook queries session_registrations and counts only non-vendor attendees
   * for accurate capacity display on booth cards (the Y in "X/Y").
   * 
   * Why not use session_booth_capacities table?
   * - That table may have stale data from import
   * - This ensures we always show current, accurate counts
   * - Automatically excludes vendor staff via database query
   * 
   * @see /docs/BOOTH_CAPACITY_CALCULATION.md for full explanation
   */
  const { getCapacity: getBoothCapacity, loading: loadingBoothCapacities } = useBoothCapacity(selectedSession?.id || null);

  const sessionStatus = useMemo<'live' | 'past' | 'future' | 'none'>(() => {
    if (!selectedSession) return 'none';
    const now = new Date();
    const start = new Date(selectedSession.startTime);
    const end = new Date(selectedSession.endTime);
    if (now < start) return 'future';
    if (now > end) return 'past';
    return 'live';
  }, [selectedSession]);

  const { statusText, statusColor } = useMemo(() => {
    switch (sessionStatus) {
      case 'live': return { statusText: t(localeKeys.statusLive), statusColor: 'bg-secondary-100 text-secondary-800 border-secondary-300 dark:bg-secondary-500/20 dark:text-secondary-300 dark:border-secondary-500/30' };
      case 'past': return { statusText: t(localeKeys.statusFinished), statusColor: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' };
      case 'future': return { statusText: t(localeKeys.statusUpcoming), statusColor: 'bg-primary-100 text-primary-800 border-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:border-primary-500/30' };
      default: return { statusText: 'N/A', statusColor: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' };
    }
  }, [sessionStatus, t]);

  const scansForSelectedSession = useMemo(() => {
    if (!selectedSession) return [];
    return scans.filter(scan => scan.sessionId === selectedSession.id);
  }, [scans, selectedSession]);

  const boothCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    if (boothCountsByTrack && Array.isArray(boothCountsByTrack)) {
      boothCountsByTrack.forEach((item: any) => {
        map.set(item.booth_id, Number(item.total));
      });
    }
    return map;
  }, [boothCountsByTrack]);

  const boothsData = useMemo(() => {
    if (!selectedSession) return [];

    // FIXED: Get ALL booths configured for this session (via boothSettings/session_booth_capacities)
    // Previously only showed booths with registrations
    const boothsWithCapacity = selectedSession.boothSettings || [];

    if (boothsWithCapacity.length === 0) return [];

    return boothsWithCapacity.map(setting => {
      const boothDetails = getBoothById(setting.boothId);
      if (!boothDetails) return null;

      // Count actual scans for this booth in this session
      const attendeesScannedAtBooth = selectedTrackId
        ? (boothCountsMap.get(setting.boothId) || 0)
        : new Set(scansForSelectedSession.filter(s => s.boothId === setting.boothId).map(s => s.attendeeId)).size;

      /**
       * Capacity Calculation (Excludes Vendors)
       * 
       * Uses real-time query to count non-vendor registrations.
       * This is the "Y" in the "X/Y" display on booth cards.
       * 
       * The hook (useBoothCapacity) runs this SQL:
       *   SELECT ... FROM session_registrations
       *   WHERE session_id = ? AND is_vendor = false
       * 
       * Result: Accurate count of actual customer capacity
       */
      const capacity = getBoothCapacity(setting.boothId);
      // TODO: Replace with real-time query when we add state management

      return {
        booth: boothDetails,
        attendeesCount: attendeesScannedAtBooth,
        capacity: capacity,
      };
    })
      .filter((data): data is { booth: Booth; attendeesCount: number; capacity: number; } => data !== null)
      .sort((a, b) => {
        if (sortBy === 'companyName') {
          return a.booth.companyName.localeCompare(b.booth.companyName);
        }
        return a.booth.physicalId.localeCompare(b.booth.physicalId, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [selectedSession, scansForSelectedSession, getBoothById, sortBy, selectedTrackId, boothCountsMap, getBoothCapacity]);

  // Calculate stats metrics for dashboard cards
  const dashboardStats = useMemo(() => {
    if (!selectedSession) {
      return {
        totalAttendees: 0,
        activeBooths: 0,
        checkInRate: 0,
        avgOccupancy: 0,
      };
    }

    const totalAttendees = scansForSelectedSession.length;
    const activeBooths = boothsData.filter(b => b.attendeesCount > 0).length;
    const totalRegistrations = registrationsForSession.length;
    const checkInRate = totalRegistrations > 0 ? Math.round((totalAttendees / totalRegistrations) * 100) : 0;

    // Calculate average occupancy
    // Only count booths with capacity > 0 for both numerator and denominator
    const boothsWithCapacity = boothsData.filter(b => b.capacity > 0);
    const totalOccupancy = boothsWithCapacity.reduce((sum, b) => {
      return sum + (b.attendeesCount / b.capacity) * 100;
    }, 0);
    const avgOccupancy = boothsWithCapacity.length > 0 ? Math.round(totalOccupancy / boothsWithCapacity.length) : 0;

    return {
      totalAttendees,
      activeBooths,
      checkInRate,
      avgOccupancy,
    };
  }, [selectedSession, scansForSelectedSession, boothsData, registrationsForSession]);

  const handleOpenBoothModal = async (booth: Booth) => {
    console.log('🔍 handleOpenBoothModal called', {
      booth: booth.companyName,
      selectedSession: !!selectedSession,
      sessionStatus
    });

    if (!selectedSession) {
      console.log('⛔ Exiting handleOpenBoothModal early - no session selected');
      return;
    }

    console.log('✅ Opening modal for booth:', booth.companyName);
    setSelectedBoothForModal(booth);
    setIsModalOpen(true);
    setIsModalLoading(true);
    setModalError(null);
    setBoothAttendeeDetails({ presentAndExpected: [], presentButUnexpected: [], expectedButAbsent: [] });

    try {
      const allRegistrations = registrationsForSession;
      const scansForThisBooth = scansForSelectedSession.filter(s => s.boothId === booth.id);
      const presentAttendeeIds = new Set(scansForThisBooth.map(s => s.attendeeId));

      // For future sessions, everyone is "expected but absent"
      // For live/past sessions, we categorize based on scans
      const presentAndExpected = allRegistrations.filter(r => r.expectedBoothId === booth.id && presentAttendeeIds.has(r.attendeeId));
      const expectedButAbsent = allRegistrations.filter(r => r.expectedBoothId === booth.id && !presentAttendeeIds.has(r.attendeeId));
      const expectedAttendeeIdsForThisBooth = new Set(allRegistrations.filter(r => r.expectedBoothId === booth.id).map(r => r.attendeeId));
      const presentButUnexpected = scansForThisBooth.filter(s => !expectedAttendeeIdsForThisBooth.has(s.attendeeId));

      // DEBUG: Log detailed comparison
      const totalExpectedInModal = presentAndExpected.length + expectedButAbsent.length;
      const boothCapacityFromCard = boothsData.find(b => b.booth.id === booth.id)?.capacity || 0;

      console.log('🔍 DETAILED BOOTH ANALYSIS', {
        boothName: booth.companyName,
        capacityFromCard: boothCapacityFromCard,
        totalExpectedInModal,
        discrepancy: boothCapacityFromCard - totalExpectedInModal,
        breakdown: {
          presentAndExpected: presentAndExpected.length,
          expectedButAbsent: expectedButAbsent.length,
          presentButUnexpected: presentButUnexpected.length
        },
        totalRegistrationsInSession: allRegistrations.length,
        registrationsWithThisBootId: allRegistrations.filter(r => r.expectedBoothId === booth.id).length
      });

      setBoothAttendeeDetails({ presentAndExpected, presentButUnexpected, expectedButAbsent });
      console.log('📊 Booth details loaded', {
        presentAndExpected: presentAndExpected.length,
        presentButUnexpected: presentButUnexpected.length,
        expectedButAbsent: expectedButAbsent.length
      });
    } catch (e: any) {
      console.error('❌ Error loading booth details:', e);
      setModalError(e.message);
    } finally {
      setIsModalLoading(false);
    }
  };

  if (sessions.length === 0) {
    return <Card title={t(localeKeys.dataVisualizationTitle)}><p className="font-sans">No sessions configured. Please add sessions in Settings.</p></Card>;
  }

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${t(localeKeys.attendeeDetailsFor)} ${selectedBoothForModal?.companyName || ''} (${selectedBoothForModal?.physicalId})`}
        size="lg"
      >
        {isModalLoading ? (
          <div className="text-center p-8"><p>{t(localeKeys.loading)}</p></div>
        ) : modalError ? (
          <Alert type="error" message={modalError} />
        ) : (
          <div className="space-y-6 p-1">
            <AttendeeList title={t(localeKeys.presentAndExpected)} attendees={boothAttendeeDetails.presentAndExpected} icon={<CheckCircleIcon className="w-5 h-5" />} statusColor="text-secondary-600 dark:text-secondary-400" type="reg" />
            <AttendeeList title={t(localeKeys.presentButUnexpected)} attendees={boothAttendeeDetails.presentButUnexpected} icon={<UserPlusIcon className="w-5 h-5" />} statusColor="text-amber-600 dark:text-amber-400" type="scan" />
            <AttendeeList title={t(localeKeys.expectedButAbsent)} attendees={boothAttendeeDetails.expectedButAbsent} icon={<XMarkIcon className="w-5 h-5" />} statusColor="text-accent-600 dark:text-accent-400" type="reg" />
          </div>
        )}
      </Modal>

      <div className="space-y-6">
        {/* Header - Responsive layout */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat">
              <TableCellsIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-brandBlue" /> {t(localeKeys.dataVisualizationTitle)}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Deep dive into any session's performance with detailed booth-by-booth analysis
            </p>
          </div>

          {/* Controls - Stack on mobile, row on tablet+ */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center">
            {/* Auto-refresh indicator & controls */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={autoRefreshControls.toggle}
                className={`p-2 rounded transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${autoRefreshState.enabled
                  ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 active:bg-green-100 dark:active:bg-green-900/30'
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600'
                  }`}
                title={autoRefreshState.enabled ? 'Desactivar auto-refresh' : 'Activar auto-refresh'}
              >
                <ArrowPathIcon
                  className={`w-5 h-5 ${autoRefreshState.isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <div className="flex flex-col">
                <span className="text-xs sm:text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  {autoRefreshState.enabled ? '🔄 Auto-refresh' : 'Pausado'}
                </span>
                <span className="text-[10px] sm:text-[9px] text-slate-500 dark:text-slate-500">
                  {getTimeAgoString(autoRefreshState.lastRefreshTime)}
                </span>
              </div>
            </div>

            {/* Action buttons - Full width on mobile, inline on tablet+ */}
            <div className="flex gap-2">
              {isFeatureEnabled(Feature.SESSION_SETTINGS) && (
                <Button
                  onClick={() => navigate(AppRoute.SessionSettings)}
                  variant="neutral"
                  size="sm"
                  className="flex-1 sm:flex-none min-h-[44px]"
                >
                  {t(localeKeys.sessionSettings)}
                </Button>
              )}
              {isFeatureEnabled(Feature.REAL_TIME_ANALYTICS) && (
                <Button
                  onClick={() => navigate(AppRoute.RealTimeAnalytics)}
                  variant="neutral"
                  size="sm"
                  className="flex-1 sm:flex-none min-h-[44px]"
                >
                  {t(localeKeys.analytics)}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        {selectedSession ? (
          loadingRegistrations ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                icon={<Users className="w-6 h-6" />}
                label="Total Attendees"
                value={dashboardStats.totalAttendees}
                color="primary"
                delay={0}
              />
              <StatsCard
                icon={<Store className="w-6 h-6" />}
                label="Active Booths"
                value={`${dashboardStats.activeBooths}/${boothsData.length}`}
                color="green"
                delay={0.1}
              />
              <StatsCard
                icon={<CheckCircle className="w-6 h-6" />}
                label="Check-in Rate"
                value={`${dashboardStats.checkInRate}%`}
                color="amber"
                delay={0.2}
              />
              <StatsCard
                icon={<Percent className="w-6 h-6" />}
                label="Avg Occupancy"
                value={`${dashboardStats.avgOccupancy}%`}
                color="purple"
                delay={0.3}
              />
            </div>
          )
        ) : null}

        <Card>
          {eventDays.length > 1 && (
            <div className="flex flex-wrap gap-2 items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 font-montserrat self-center">{t(localeKeys.filterByDay)}</label>
              <Button onClick={() => setSelectedDate('all')} variant={selectedDate === 'all' ? 'primary' : 'neutral'} size="sm">{t(localeKeys.allDays)}</Button>
              {eventDays.map(day => (
                <Button key={day} onClick={() => setSelectedDate(day)} variant={selectedDate === day ? 'primary' : 'neutral'} size="sm">
                  {new Date(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Button>
              ))}
            </div>
          )}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-montserrat">{t(localeKeys.selectSession)}</label>
            <div className="flex flex-wrap gap-3 items-center">
              {sessionsForDisplay.length > 0 ? sessionsForDisplay.map(s => (
                <div key={s.id} className="relative">
                  <Button
                    onClick={() => setSelectedSessionId(s.id)}
                    variant={selectedSessionId === s.id ? 'primary' : 'neutral'}
                    className={liveSessionId === s.id ? 'ring-2 ring-offset-2 ring-secondary-500' : ''}
                  >
                    {s.name}
                  </Button>
                  {liveSessionId === s.id && (
                    <span className="absolute flex h-3 w-3 -top-1 -right-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500" title="Live Session"></span>
                    </span>
                  )}
                </div>
              )) : <p className="text-sm text-slate-500 dark:text-slate-300">No sessions scheduled for this day.</p>}
            </div>
          </div>

          {selectedSession && (
            <>
              {/* Booth Toolbar - Responsive layout */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center border-t border-slate-200 dark:border-slate-700 pt-6 mb-4 gap-4">
                {/* Title + Sort buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-slate-200 font-montserrat">
                    {t(localeKeys.boothOccupancy)}: {selectedSession.name}
                  </h2>

                  {/* Sort buttons - Separate row on mobile, inline with border on tablet+ */}
                  <div className="flex items-center gap-2 sm:border-l sm:border-slate-200 sm:dark:border-slate-700 sm:pl-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">
                      {t(localeKeys.sortBy)}
                    </span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 sm:hidden">
                      {t(localeKeys.sortBy)}:
                    </span>
                    <div className="flex gap-2 flex-1 sm:flex-none">
                      <Button
                        size="sm"
                        variant={sortBy === 'physicalId' ? 'primary' : 'neutral'}
                        onClick={() => setSortBy('physicalId')}
                        className="flex-1 sm:flex-none min-h-[40px]"
                      >
                        {t(localeKeys.location)}
                      </Button>
                      <Button
                        size="sm"
                        variant={sortBy === 'companyName' ? 'primary' : 'neutral'}
                        onClick={() => setSortBy('companyName')}
                        className="flex-1 sm:flex-none min-h-[40px]"
                      >
                        {t(localeKeys.company)}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div className={`px-3 py-1 text-sm font-bold rounded-full border self-start sm:self-center ${statusColor}`}>
                  {t(localeKeys.status)}: {statusText}
                </div>
              </div>

              {/* View Mode Toggle - Responsive */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button
                  variant={viewMode === 'cards' ? 'primary' : 'neutral'}
                  onClick={() => setViewMode('cards')}
                  size="sm"
                  className="min-w-[100px] min-h-[40px]"
                >
                  📊 {t(localeKeys.viewModeCards)}
                </Button>

                <Button
                  variant={viewMode === 'map' ? 'primary' : 'neutral'}
                  onClick={() => setViewMode('map')}
                  size="sm"
                  disabled={!hasMapAccess}
                  className="min-w-[100px] min-h-[40px]"
                >
                  🗺️ {t(localeKeys.viewModeMap)}
                  {!hasMapAccess && <span className="ml-1">🔒</span>}
                </Button>

                {!hasMapAccess && (
                  <span className="text-xs text-slate-500 w-full sm:w-auto sm:ml-2">
                    {t(localeKeys.upgradeForMap)}
                  </span>
                )}
              </div>
              {selectedEventId && isFeatureEnabled(Feature.TRACKS) && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 font-montserrat">Filter by Track</label>
                  <TrackFilter eventId={selectedEventId} value={selectedTrackId} onChange={setSelectedTrackId} />
                </div>
              )}

              {(loadingRegistrations) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                  <BoothCardSkeleton />
                  <BoothCardSkeleton />
                  <BoothCardSkeleton />
                  <BoothCardSkeleton />
                  <BoothCardSkeleton />
                  <BoothCardSkeleton />
                </div>
              ) : boothsData.length > 0 ? (
                viewMode === 'cards' ? (
                  <>
                    <BoothSummaryStats booths={boothsData} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                      {boothsData.map(data => {
                        if (sessionStatus === 'none') return null;
                        return <BoothDisplayCard key={data.booth.id} {...data} sessionStatus={sessionStatus} onClick={() => handleOpenBoothModal(data.booth)} />
                      })}
                    </div>
                  </>
                ) : (
                  <BoothMap
                    key={`booth-map-${selectedSessionId}`}
                    booths={boothsData}
                    config={layoutConfig}
                    onBoothClick={handleOpenBoothModal}
                    onSaveLayout={handleSaveLayout}
                  />
                )
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="No Booths Configured"
                  description="This session doesn't have any booths configured yet. Add booths to see them here."
                />
              )}
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default DataVisualizationPage;
