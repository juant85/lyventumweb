// src/pages/admin/QRScannerPage.tsx
import React, { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../../contexts/sessions';
import { useBooths } from '../../contexts/booths';
import { useScans } from '../../contexts/scans';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useEventTypeConfig } from '../../contexts/EventTypeConfigContext'; // NEW
import { useChat } from '../../contexts/ChatContext';
import { AppRoute, Booth, ScanResult } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { QrCodeIcon, UserIcon, CogIcon, ArrowPathIcon, ChatBubbleLeftRightIcon, BuildingStorefrontIcon } from '../../components/Icons';
import { Icon } from '../../components/ui/Icon';
import { toast } from 'react-hot-toast';
import { ActiveSessionReturn } from '../../utils/sessionUtils';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';
import Select from '../../components/ui/Select';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import KioskModeWrapper from '../../components/scanner/KioskModeWrapper';
import SkeletonScanner from '../../components/scanner/SkeletonScanner';
import ScanResultCard from '../../components/scanner/ScanResultCard';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileBoothSelector from '../../components/mobile/MobileBoothSelector';
import { haptics } from '../../utils/haptics';

declare var Html5QrcodeScanner: any;
declare var Html5QrcodeScanType: any;

const Html5QrcodeScannerState = {
  NOT_STARTED: 1,
  SCANNING: 2,
  PAUSED: 3,
  STOPPED: 4,
};

const OrganizerBoothSelector: React.FC<{
  booths: Booth[];
  onStartScanning: (boothId: string) => void;
}> = ({ booths, onStartScanning }) => {
  const [selectedBoothId, setSelectedBoothId] = useState<string>(booths[0]?.id || '');
  const { t } = useLanguage();

  useEffect(() => {
    if (booths.length > 0 && !selectedBoothId) {
      setSelectedBoothId(booths[0].id);
    }
  }, [booths, selectedBoothId]);

  const boothOptions = booths.map(b => ({ value: b.id, label: `${b.companyName} (${b.physicalId})` }));

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <Card title={t(localeKeys.selectBoothForScanningTitle)} icon={<CogIcon className="w-6 h-6" />}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{t(localeKeys.selectBoothPrompt)}</p>
          <Select
            label={t(localeKeys.availableBoothsLabel)}
            options={boothOptions}
            value={selectedBoothId}
            onChange={(e) => setSelectedBoothId(e.target.value)}
            disabled={booths.length === 0}
          />
          <Button onClick={() => onStartScanning(selectedBoothId)} className="w-full" disabled={!selectedBoothId}>
            {t(localeKeys.startScanningButton)}
          </Button>
        </div>
      </Card>
    </div>
  );
};


const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedEventId, selectedEventId } = useSelectedEvent();
  // New modular contexts
  const { getOperationalSessionDetails, sessions, loading: sessionsLoading } = useSessions();
  const { booths, getBoothById, loading: boothsLoading } = useBooths();
  const { addScan, isSyncing, pendingScans } = useScans();

  const eventContextLoading = sessionsLoading || boothsLoading;
  const { openChatPanel } = useChat();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { config, isVendorMeeting, isConference, isTradeShow } = useEventTypeConfig(); // NEW

  const [activeBooth, setActiveBooth] = useState<Booth | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null); // For session scanner mode
  const [isOrganizerMode, setIsOrganizerMode] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [scannerMode, setScannerMode] = useState<'booth' | 'session' | null>(null);

  const [attendeeId, setAttendeeId] = useState('');
  const [isLoadingManualSubmit, setIsLoadingManualSubmit] = useState(false);
  const [operationalSessionInfo, setOperationalSessionInfo] = useState<ActiveSessionReturn | null>(null);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string; attendeeName?: string } | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null); // Smart scan result for card display

  // Mobile detection
  const isMobile = useIsMobile();

  // Stats for kiosk mode
  const [todayScans, setTodayScans] = useState(0);
  const [sessionScans, setSessionScans] = useState(0);

  const scannerRef = useRef<any>(null);
  const isProcessingAutoScanRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const deviceIdRef = useRef<string>(`device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const scannerAuthData = localStorage.getItem('scannerAuth');
    if (currentUser && ['admin', 'organizer', 'superadmin'].includes(currentUser.role)) {
      setIsOrganizerMode(true);
    } else if (scannerAuthData) {
      setIsOrganizerMode(false);
      try {
        const authData = JSON.parse(scannerAuthData);
        setSelectedEventId(authData.eventId);
        setScannerMode(authData.type); // 'booth' or 'session'

        if (authData.type === 'session') {
          setActiveSessionId(authData.sessionId);
        }
      } catch (e) {
        toast.error("Invalid authentication. Please log in again.");
        navigate(AppRoute.BoothLogin);
      }
    }
  }, [currentUser, navigate, setSelectedEventId]);

  useEffect(() => {
    if (!isOrganizerMode && !eventContextLoading && !activeBooth && scannerMode === 'booth') {
      const scannerAuthData = localStorage.getItem('scannerAuth');
      if (scannerAuthData) {
        const authData = JSON.parse(scannerAuthData);

        if (authData.type === 'booth') {
          const { boothId } = authData;

          // Wait for booths to be loaded
          if (booths.length > 0) {
            const booth = getBoothById(boothId);
            if (booth) {
              setActiveBooth(booth);
              console.log('[QRScanner] ✓ Booth loaded:', booth.companyName);
            } else {
              console.error('[QRScanner] ✗ Booth not found:', boothId);
              toast.error(`Associated booth not found. Logging out.`, { duration: 4000 });
              localStorage.removeItem('scannerAuth');
              navigate(AppRoute.BoothLogin);
            }
          }
          // If booths.length === 0, wait for next render when booths load
        }
      }
    }
  }, [isOrganizerMode, eventContextLoading, activeBooth, booths, getBoothById, navigate, selectedEventId, scannerMode]);


  // Improved Audio Context for Success/Error sounds
  const playSound = useCallback((success: boolean) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        // High pitch "ding"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        // Low pitch "buzz"
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }, []);

  useEffect(() => {
    if (!sessions || sessions.length === 0) return;
    const details = getOperationalSessionDetails(new Date());
    setOperationalSessionInfo(details);
    const intervalId = setInterval(() => {
      setOperationalSessionInfo(getOperationalSessionDetails(new Date()));
    }, 30000);
    return () => clearInterval(intervalId);
  }, [sessions, getOperationalSessionDetails]);



  const vibrateDevice = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(200);
  }, []);

  const handleSubmitScan = useCallback(async (scannedIdValue: string, isManualSubmit: boolean) => {
    if (isManualSubmit) setIsLoadingManualSubmit(true);

    // Check if we have either booth or session active
    if (!activeBooth && !activeSessionId) {
      toast.error('No booth or session is active. Scan not recorded.');
      if (isManualSubmit) setIsLoadingManualSubmit(false);
      return;
    }

    try {
      // Pass booth ID if in booth mode, sessionId if in session mode
      const result = await addScan(
        scannedIdValue.trim(),
        activeBooth?.id || undefined, // Booth ID (undefined for session mode)
        activeSessionId || undefined,  // Session ID (undefined for booth mode)
        deviceIdRef.current
      );

      // === SMART SCANNING: Show visual result card ===
      setScanResult(result);

      // Pause scanner to show result
      if (scannerRef.current?.pause) {
        try {
          scannerRef.current.pause(true);
        } catch (e) {
          console.warn('Scanner pause failed:', e);
        }
      }

      // Store result for Kiosk Mode (backward compatibility)
      setLastScanResult({
        success: result.success,
        message: result.message,
        attendeeName: result.scan?.attendeeName
      });

      // Legacy toast notifications (only show for failures now)
      if (!result.success) {
        toast.error(result.message, { duration: 5000 });
      }

      // Update stats and haptic feedback
      if (result.success) {
        setTodayScans(prev => prev + 1);
        setSessionScans(prev => prev + 1);
        haptics.light(); // Quick tap on successful scan
        playSound(true); // Audio feedback
      } else {
        haptics.error(); // Error vibration on failed scan
        playSound(false); // Error audio
      }

    } catch (error) {
      console.error("Error in handleSubmitScan:", error);
      toast.error('Unexpected error processing scan.');
      playSound(false); // Fail sound
    } finally {
      if (isManualSubmit) setIsLoadingManualSubmit(false);
    }
  }, [activeBooth, activeSessionId, addScan, deviceIdRef, setScanResult, scannerRef, setLastScanResult, setTodayScans, setSessionScans]);

  const onScanSuccess = useCallback(async (decodedText: string, decodedResult: any) => {
    if (isProcessingAutoScanRef.current) return;
    isProcessingAutoScanRef.current = true;
    try {
      vibrateDevice();
      setAttendeeId(decodedText);
      // Play success sound is handled inside handleSubmitScan if successful, 
      // but we play a preliminary "read" sound here
      playSound(true);
      await handleSubmitScan(decodedText, false);
    } catch (error) {
      console.error("Error in onScanSuccess:", error);
      toast.error("Error handling scan result.");
    }
    // NOTE: isProcessingAutoScanRef stays TRUE until handleNextScan is called
    // This prevents the scanner from immediately re-scanning the same QR
  }, [playSound, vibrateDevice, handleSubmitScan]);

  useEffect(() => {
    // Only initialize scanner when either booth or session is active
    if (!activeBooth && !activeSessionId) return;

    // If showing scan result (and not in kiosk mode), don't init scanner (it's unmounted from DOM)
    if (scanResult && !isKioskMode) return;

    // Clean up existing scanner when changing modes or booth
    if (scannerRef.current) {
      scannerRef.current.clear().catch((err: any) => console.warn('Failed to clear scanner before reinit', err));
      scannerRef.current = null;
    }

    const qrReaderElement = document.getElementById('qr-scanner-container');
    if (!qrReaderElement) {
      console.warn('QR scanner container not found in DOM');
      return;
    }

    if (typeof Html5QrcodeScanner === "undefined") {
      qrReaderElement.innerHTML = '<p class="text-red-400">QR Scanner library not loaded.</p>';
      return;
    }

    qrReaderElement.innerHTML = '';
    const newScanner = new Html5QrcodeScanner(
      'qr-scanner-container',
      {
        fps: 5,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.7);
          return { width: qrboxSize, height: qrboxSize };
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      false
    );
    newScanner.render(onScanSuccess, (error: string) => { });
    scannerRef.current = newScanner;
    console.log('QR Scanner initialized successfully');

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err: any) => console.warn('Failed to clear scanner on unmount', err));
        scannerRef.current = null;
      }
    };
  }, [activeBooth, activeSessionId, onScanSuccess, isKioskMode, scanResult]); // Re-init when scanner context changes

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!attendeeId) {
      toast.error('Please enter an Attendee ID.');
      return;
    }
    handleSubmitScan(attendeeId, true);
  };

  // Handler for "Scan Next" button in ScanResultCard
  const handleNextScan = useCallback(() => {
    // Clear result to hide card
    setScanResult(null);
    setAttendeeId('');
    setLastScanResult(null);

    // Reset processing flag to allow next scan
    isProcessingAutoScanRef.current = false;

    // Scanner will be re-initialized by useEffect when scanResult becomes null
  }, []);

  const handleStartScanning = (boothId: string) => {
    const selected = booths.find(b => b.id === boothId);
    if (selected) {
      setActiveBooth(selected);
    } else {
      toast.error("Selected booth could not be found.");
    }
  };

  const handleChangeBooth = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((err: any) => console.warn('Failed to clear scanner on change', err));
      scannerRef.current = null;
    }
    setActiveBooth(null);
  };

  const handleToggleKioskMode = () => {
    // Clean scanner before mode change to force re-initialization
    if (scannerRef.current) {
      scannerRef.current.clear().catch((err: any) => console.warn('Failed to clear scanner on mode change', err));
      scannerRef.current = null;
    }

    setIsKioskMode(prev => !prev);

    if (!isKioskMode) {
      // Entering kiosk mode
      toast.success('Modo Kiosk activado - Fullscreen habilitado');
    } else {
      // Exiting kiosk mode
      toast('Modo Kiosk desactivado');
    }
  };

  const handleLogout = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((err: any) => console.warn('Failed to clear scanner on logout', err));
      scannerRef.current = null;
    }

    // Clear scanner auth
    localStorage.removeItem('scannerAuth');

    // Navigate based on user type
    if (currentUser && ['admin', 'organizer', 'superadmin'].includes(currentUser.role)) {
      navigate(AppRoute.Dashboard);
    } else {
      navigate(AppRoute.BoothLogin);
    }

    toast.success('Logged out successfully');
  };

  if (eventContextLoading && !activeBooth && !activeSessionId) {
    return (
      <SkeletonScanner
        boothName={scannerMode === 'session' ? 'tu sesión' : 'tu booth'}
        showProgress
      />
    );
  }

  if (isOrganizerMode && !activeBooth && !activeSessionId) {
    // Use mobile-optimized selector for mobile devices
    if (isMobile) {
      return <MobileBoothSelector booths={booths} onSelect={handleStartScanning} />;
    }
    return <OrganizerBoothSelector booths={booths} onStartScanning={handleStartScanning} />;
  }

  // Show skeleton if neither booth nor session is ready
  if (!activeBooth && !activeSessionId) {
    return (
      <SkeletonScanner
        boothName="verificando acceso..."
        showProgress
      />
    );
  }

  // Get scanner header info (booth or session)
  const scannerTitle = activeBooth
    ? `${activeBooth.companyName} (${activeBooth.physicalId})`
    : ''; // Session name will be obtained from scannerAuth if needed

  // ══════════════════════════════════════════════════════════════════════════
  // KIOSK MODE RENDER  
  // ══════════════════════════════════════════════════════════════════════════
  if (isKioskMode && activeBooth) {
    return (
      <>
        <KioskModeWrapper
          activeBooth={activeBooth}
          lastScanResult={lastScanResult}
          onExitKiosk={handleToggleKioskMode}
          stats={{
            todayScans,
            sessionScans,
            pendingScans: pendingScans.length
          }}
        >
          <div id="qr-scanner-container"></div>
        </KioskModeWrapper>

        {/* === SMART SCAN RESULT CARD (Kiosk Mode) === */}
        {scanResult && (
          <ScanResultCard
            result={scanResult}
            onNext={handleNextScan}
            autoCloseDelay={3000} // Auto-close after 3s in kiosk mode
          />
        )}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VENDOR MODE RENDER (Default)
  // ══════════════════════════════════════════════════════════════════════════


  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE OPTIMIZED RENDER
  // ══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Camera View */}
        <div className="relative h-full flex flex-col">
          {/* Compact Header */}
          <div className="bg-gradient-to-b from-black/80 to-transparent p-4 safe-area-top">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h1 className="text-lg font-bold text-white truncate">
                  {activeBooth?.companyName || 'QR Scanner'}
                </h1>
                {activeBooth && (
                  <p className="text-sm text-white/80">Booth {activeBooth.physicalId}</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 min-h-[44px] min-w-[44px] bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Close"
              >
                <Icon name="close" size={24} />
              </button>
            </div>

            {/* Pending Scans Badge */}
            {pendingScans.length > 0 && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 flex items-center gap-2">
                <ArrowPathIcon className={`w-4 h-4 text-yellow-300 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-semibold text-yellow-100">
                  {pendingScans.length} pending
                </span>
              </div>
            )}
          </div>

          {/* Scanner Container */}
          {scanResult ? (
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-transparent to-black/40">
              <ScanResultCard
                result={scanResult}
                onNext={handleNextScan}
                autoCloseDelay={0}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Scan Frame with Animated Corners */}
              <div className="relative w-full max-w-sm aspect-square">
                {/* Scanner injection container */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <style>{`
                    #qr-scanner-container { 
                      width: 100% !important; 
                      height: 100% !important; 
                      display: flex !important; 
                      justify-content: center; 
                      align-items: center; 
                    }
                    #qr-scanner-container video { 
                      object-fit: cover !important; 
                      width: 100% !important; 
                      height: 100% !important; 
                    }
                    #qr-scanner-container__scan_region { 
                      width: 100% !important; 
                      min-height: 100% !important; 
                    }
                    #qr-scanner-container__dashboard_section_csr span { 
                      display: none !important; 
                    }
                  `}</style>
                  <div id="qr-scanner-container" className="w-full h-full"></div>
                </div>

                {/* Animated Corner Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top-left */}
                  <div className="absolute top-0 left-0 w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-transparent rounded-tl-3xl animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-transparent rounded-tl-3xl animate-pulse"></div>
                  </div>
                  {/* Top-right */}
                  <div className="absolute top-0 right-0 w-16 h-16">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary-500 to-transparent rounded-tr-3xl animate-pulse"></div>
                    <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary-500 to-transparent rounded-tr-3xl animate-pulse"></div>
                  </div>
                  {/* Bottom-left */}
                  <div className="absolute bottom-0 left-0 w-16 h-16">
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-transparent rounded-bl-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-t from-primary-500 to-transparent rounded-bl-3xl animate-pulse"></div>
                  </div>
                  {/* Bottom-right */}
                  <div className="absolute bottom-0 right-0 w-16 h-16">
                    <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-primary-500 to-transparent rounded-br-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-1 h-full bg-gradient-to-t from-primary-500 to-transparent rounded-br-3xl animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <p className="mt-8 text-center text-white text-lg font-semibold px-4 drop-shadow-lg">
                📱 Point camera at QR code
              </p>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="bg-gradient-to-t from-black/90 to-transparent p-4 pb-8 safe-area-bottom relative z-10">
            {/* Manual Entry Form */}
            <form onSubmit={handleManualSubmit} className="space-y-3 max-w-md mx-auto">
              <Input
                label=""
                id="manual-attendee-id-mobile"
                value={attendeeId}
                onChange={(e) => setAttendeeId(e.target.value)}
                placeholder="Manual entry: Attendee ID"
                wrapperClassName="!mb-0"
                className="text-base bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/60"
              />
              <button
                type="submit"
                disabled={!activeBooth || isLoadingManualSubmit}
                className="w-full min-h-[56px] bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl font-bold text-lg shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingManualSubmit ? t(localeKeys.submitting) : 'Submit Manually'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP VENDOR MODE RENDER (Original)
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header with logout and kiosk toggle */}
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-montserrat">{t(localeKeys.navLinkScanner)}</h1>
        <div className="flex gap-2">
          {activeBooth && (
            <Button
              onClick={handleToggleKioskMode}
              variant="secondary"
              size="md"
              leftIcon={<Icon name="grid" size={20} />}
            >
              Modo Kiosk
            </Button>
          )}
          <Button
            onClick={handleLogout}
            variant="neutral"
            size="md"
            leftIcon={<Icon name="logout" size={20} />}
          >
            {t(localeKeys.logout) || 'Salir'}
          </Button>
        </div>

        {/* NEW: Event Type Context Hint */}
        <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {isVendorMeeting && (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              💼 <strong>Vendor Meetings Mode</strong> - Verify pre-assigned attendees and capture walk-ins
            </p>
          )}
          {isConference && (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              🎤 <strong>Conference Mode</strong> - Track session attendance and welcome walk-ins
            </p>
          )}
          {isTradeShow && (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              🏢 <strong>Trade Show Mode</strong> - Open lead capture - all scans welcome!
            </p>
          )}
          {!isVendorMeeting && !isConference && !isTradeShow && (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              🔄 <strong>Hybrid Event</strong> - Supporting all event features
            </p>
          )}
        </div>
      </div>

      {/* Active Scanner Info (Booth or Session) */}
      <div className="text-center">
        <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/50 inline-flex flex-col sm:flex-row items-center gap-3">
          {activeBooth ? (
            <>
              <p className="text-lg font-semibold text-primary-800 dark:text-primary-200 flex items-center gap-2">
                <BuildingStorefrontIcon className="w-5 h-5" />
                <span>{t(localeKeys.scanningFor)}: {activeBooth.companyName} ({activeBooth.physicalId})</span>
              </p>
              {isOrganizerMode && (
                <Button onClick={handleChangeBooth} size="sm" variant="secondary">{t(localeKeys.changeBoothButton)}</Button>
              )}
            </>
          ) : activeSessionId ? (
            <p className="text-lg font-semibold text-primary-800 dark:text-primary-200 flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5" />
              <span>Escáner de Sesión Activo</span>
            </p>
          ) : null}
        </div>

        {/* Pending Scans Indicator */}
        {pendingScans.length > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 inline-flex items-center gap-2">
            <ArrowPathIcon className={`w-4 h-4 text-yellow-700 dark:text-yellow-300 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {pendingScans.length} scan{pendingScans.length > 1 ? 's' : ''} offline {isSyncing ? '(syncing...)' : '(pending)'}
            </span>
          </div>
        )}
      </div>

      {/* === SMART SCAN RESULT CARD (Vendor Mode) === */}
      {scanResult && !isKioskMode ? (
        <ScanResultCard
          result={scanResult}
          onNext={handleNextScan}
          autoCloseDelay={0} // Manual close in vendor mode
        />
      ) : (
        <>
          <Card>
            <div className="w-full max-w-sm mx-auto aspect-square overflow-hidden rounded-lg border-2 border-slate-200 dark:border-slate-700">
              <div id="qr-scanner-container" className="w-full h-full"></div>
            </div>
            <div className="text-center mt-2 text-sm text-slate-500">Point your camera at a QR code.</div>
          </Card>
        </>
      )}

      {operationalSessionInfo && (
        <Alert type={operationalSessionInfo.status === 'active' ? 'success' : 'info'} message={operationalSessionInfo.message} />
      )}

      <Card title={t(localeKeys.manualEntryTitle)} icon={<UserIcon className="w-6 h-6" />}>
        <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row items-end gap-3">
          <Input
            label={t(localeKeys.attendeeIdLabel)}
            id="manual-attendee-id"
            value={attendeeId}
            onChange={(e) => setAttendeeId(e.target.value)}
            placeholder="Enter ID from badge"
            wrapperClassName="flex-grow !mb-0"
            disabled={!activeBooth}
          />
          <Button type="submit" variant="secondary" disabled={!activeBooth || isLoadingManualSubmit}>
            {isLoadingManualSubmit ? t(localeKeys.submitting) : t(localeKeys.submitManuallyButton)}
          </Button>
        </form>
      </Card>

      {activeBooth && (
        <Card title={t(localeKeys.chatWithSupervisorTitle)}>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{t(localeKeys.chatWithSupervisorPrompt)}</p>
          <Button
            onClick={() => openChatPanel({ boothId: activeBooth.id, deviceId: deviceIdRef.current })}
            leftIcon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
          >
            {t(localeKeys.openChatButton)}
          </Button>
        </Card>
      )}

    </div>
  );
};

export default QRScannerPage;