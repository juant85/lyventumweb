// src/pages/public/EventSelectorForScannerPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { AppRoute } from '../../types';
import Button from '../../components/ui/Button';
import { BuildingStorefrontIcon, ArrowPathIcon, QrCodeIcon } from '../../components/Icons';
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

const EventSelectorForScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { availableEvents, loadingEvents, fetchAvailableEvents } = useSelectedEvent();
  const { t } = useLanguage();

  useEffect(() => {
    fetchAvailableEvents();
  }, [fetchAvailableEvents]);

  const handleSelectEvent = (eventId: string) => {
    localStorage.setItem('scannerLockedEventId', eventId);
    navigate(AppRoute.QRScanner);
  };

  const renderContent = () => {
    if (loadingEvents) {
      return (
        <div className="flex justify-center items-center py-10">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-400" />
          <p className="ml-3 font-semibold text-slate-300">{t(localeKeys.loading)}</p>
        </div>
      );
    }

    if (availableEvents.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-slate-100 font-semibold text-lg">{t(localeKeys.noEvents)}</p>
          <p className="text-sm text-slate-400 mt-2">Please contact an administrator to create an event.</p>
          <Button onClick={() => fetchAvailableEvents()} variant="neutral" size="sm" className="mt-6" leftIcon={<ArrowPathIcon className="w-4 h-4"/>}>
            Refresh List
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {availableEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => handleSelectEvent(event.id)}
            className="w-full text-left p-4 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 flex items-center shadow-sm"
          >
            <BuildingStorefrontIcon className="w-8 h-8 mr-4 text-primary-400 flex-shrink-0" />
            <div className="flex-grow">
              <p className="font-bold text-lg text-slate-100">{event.name}</p>
              {event.location && <p className="text-sm text-slate-300">{event.location}</p>}
              {event.startDate && <p className="text-xs text-slate-400 mt-1">{new Date(event.startDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div 
        className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}
    >
      <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
             <Link to={AppRoute.Landing} className="inline-block group">
                <LyVentumLogo className="h-16 w-auto transition-transform duration-300 group-hover:scale-105" />
                <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white font-montserrat">
                    LyVenTum
                </p>
             </Link>
          </div>
        
        <BackgroundGradient containerClassName="rounded-2xl" className="bg-zinc-900/80 backdrop-blur-md rounded-[22px] p-6 md:p-8 space-y-6">
            <div className="text-center">
                <QrCodeIcon className="w-12 h-12 mx-auto text-primary-400 mb-3" />
                <h1 className="text-2xl font-bold text-slate-100 font-montserrat">{t(localeKeys.scannerSetupTitle)}</h1>
            </div>
            <p className="text-slate-300 mb-6 text-center text-md leading-relaxed">
                {t(localeKeys.scannerSetupSubtitle)}
            </p>
            <div className="mt-4">
                {renderContent()}
            </div>
        </BackgroundGradient>
      </div>
    </div>
  );
};

export default EventSelectorForScannerPage;
