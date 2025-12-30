import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { AppRoute } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { QrCodeIcon, ArrowPathIcon } from '../../components/Icons';
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

const ScannerLoginPage: React.FC = () => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setSelectedEventId } = useSelectedEvent();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!accessCode.trim()) {
      setError('Please enter an access code.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Verificando código de acceso...');

    try {
      // Step 1: Try booth access code first
      const { data: boothData, error: boothError } = await supabase.rpc('get_booth_by_access_code', {
        p_access_code: accessCode.trim()
      });

      if (boothError) {
        throw new Error(boothError.message);
      }

      const booth = (boothData as any)?.[0];

      if (booth) {
        // BOOTH MODE: Store booth authentication
        const authPayload = {
          type: 'booth' as const,
          boothId: booth.id,
          boothName: `${booth.company_name} (${booth.physical_id})`,
          eventId: booth.event_id,
        };

        localStorage.setItem('scannerAuth', JSON.stringify(authPayload));

        // Pre-load event
        toast.loading('Cargando datos del evento...', { id: toastId });
        setSelectedEventId(booth.event_id);

        await new Promise(resolve => setTimeout(resolve, 300));

        toast.success(`✓ Escáner de Stand: ${authPayload.boothName}`, { id: toastId });

        navigate(AppRoute.QRScanner, { replace: true });
        return;
      }

      // Step 2: If not a booth, try session access code
      const { data: sessionData, error: sessionError } = await supabase.rpc('get_session_by_access_code', {
        p_access_code: accessCode.trim()
      });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      const session = (sessionData as any)?.[0];

      if (session) {
        // SESSION MODE: Store session authentication
        const authPayload = {
          type: 'session' as const,
          sessionId: session.id,
          sessionName: session.name,
          eventId: session.event_id,
          sessionTimes: {
            start: session.start_time,
            end: session.end_time
          }
        };

        localStorage.setItem('scannerAuth', JSON.stringify(authPayload));

        // Pre-load event
        toast.loading('Cargando datos del evento...', { id: toastId });
        setSelectedEventId(session.event_id);

        await new Promise(resolve => setTimeout(resolve, 300));

        toast.success(`✓ Escáner de Sesión: ${authPayload.sessionName}`, { id: toastId });

        navigate(AppRoute.QRScanner, { replace: true });
        return;
      }

      // Step 3: No booth or session found
      throw new Error('Código de acceso inválido. Verifica el código e intenta nuevamente.');

    } catch (err: any) {
      toast.error(err.message || 'Error inesperado', { id: toastId });
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}
    >
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center mb-6 sm:mb-10">
          <Link to={AppRoute.Landing} className="inline-block group">
            <LyVentumLogo className="h-12 sm:h-20 w-auto filter drop-shadow-[0_4px_10px_rgba(59,130,246,0.25)] dark:drop-shadow-[0_5px_15px_rgba(96,165,250,0.25)] transition-transform duration-300 group-hover:scale-105" />
          </Link>
        </div>

        <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 backdrop-blur-md rounded-[22px] p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <QrCodeIcon className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-secondary-400 mb-2" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              Acceso al Escáner
            </h2>
            <p className="text-slate-400 mt-2 text-xs sm:text-sm">
              {t(localeKeys.accessCodePrompt)}
            </p>
          </div>
          {error && <Alert type="error" message={error} className="my-4" />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="access-code"
              label="Código de Acceso"
              type="text"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="e.g., INNO-A4B8"
              wrapperClassName="!mb-0"
              className="text-base sm:text-sm"
              disabled={isLoading}
            />
            <Button type="submit" variant="secondary" className="w-full !py-3" disabled={isLoading}>
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  {t(localeKeys.verifying)}
                </>
              ) : t(localeKeys.activateScanner)}
            </Button>
          </form>
        </BackgroundGradient>
        <div className="text-center">
          <Link to={AppRoute.Login} className="text-sm text-slate-400 hover:text-white hover:underline transition-colors">
            {t(localeKeys.areYouAnOrganizer)}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ScannerLoginPage;
