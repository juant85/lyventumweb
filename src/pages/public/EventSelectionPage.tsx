// src/pages/public/EventSelectionPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { AppRoute, Event } from '../../types';
import Button from '../../components/ui/Button';
import { ArrowPathIcon, LoginIcon, UserIcon, QrCodeIcon, BuildingStorefrontIcon } from '../../components/Icons';
import LyVentumLogo from '../../components/Logo';
import Alert from '../../components/ui/Alert';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

type Company = { id: string; name: string; logo_url: string | null; };

const EventSelectionPage: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const { getActiveEventsByCompany, setSelectedEventId, fetchAvailableEvents, loadingEvents } = useSelectedEvent();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [company, setCompany] = useState<Company | null>(null);

    useEffect(() => {
        fetchAvailableEvents();

        const fetchCompany = async () => {
            if (!companyId) return;
            const { data, error } = await supabase
                .from('companies')
                .select('id, name, logo_url')
                .eq('id', companyId)
                .single();
            if (data) setCompany(data);
            else console.error("Could not fetch company:", error);
        };
        fetchCompany();
    }, [companyId, fetchAvailableEvents]);

    const companyEvents = getActiveEventsByCompany(companyId || '');

    const handleLoginClick = (eventId: string, route: AppRoute) => {
        setSelectedEventId(eventId);
        navigate(route);
    };

    const formatDateRange = (start?: string | null, end?: string | null): string => {
        if (!start) return 'Date TBD';
        const startDate = new Date(start + 'T00:00:00');
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        if (!end || start === end) {
            return startDate.toLocaleDateString(undefined, options);
        }
        const endDate = new Date(end + 'T00:00:00');
        return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
    };

    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

    // Toggle view mode automatically based on screen size (optional default)
    // useEffect(() => { if (window.innerWidth < 640) setViewMode('list'); }, []);

    const renderContent = () => {
        if (loadingEvents) {
            return (
                <div className="flex justify-center items-center py-10">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-400" />
                    <p className="ml-3 font-semibold text-slate-300">{t(localeKeys.loading)}</p>
                </div>
            );
        }

        if (companyEvents.length === 0) {
            return (
                <Alert type="info" message={
                    <div>
                        <p>No events found for "{company?.name}".</p>
                        <Button onClick={() => fetchAvailableEvents()} size="sm" variant="link" className="mt-2">Refresh</Button>
                    </div>
                } />
            );
        }

        // --- View Mode Toggle Control ---
        const ToggleControl = () => (
            <div className="flex justify-end mb-4 px-2">
                <div className="bg-slate-800/50 p-1 rounded-lg flex items-center gap-1 border border-white/10">
                    <button
                        onClick={() => setViewMode('card')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        aria-label="Card View"
                    >
                        <BuildingStorefrontIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        aria-label="List View"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        );

        return (
            <div className="w-full">
                <ToggleControl />

                <div className={viewMode === 'card' ? "space-y-8" : "bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden"}>
                    {companyEvents.map((event, index) => (
                        viewMode === 'card' ? (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="bg-slate-900/50 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 transition-all duration-300 hover:border-primary-500/50 group mb-8 last:mb-0"
                            >
                                <div className="p-5 sm:p-8 flex flex-col items-center text-center">
                                    {/* Album Art / Logo */}
                                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-slate-800/50 rounded-xl flex items-center justify-center mb-4 sm:mb-6 border border-white/5">
                                        {event.eventLogoUrl ? (
                                            <img src={event.eventLogoUrl} alt={`${event.name} Logo`} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <BuildingStorefrontIcon className="w-12 h-12 text-slate-600" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <h3 className="text-2xl font-bold text-slate-100 font-montserrat tracking-tight mb-2">{event.name}</h3>
                                    <p className="font-medium text-slate-300 mb-1">{event.location || 'Location TBD'}</p>
                                    <p className="text-sm text-slate-500 mb-8">{formatDateRange(event.startDate, event.endDate)}</p>

                                    {/* Action Buttons - Card Mode */}
                                    <div className="w-full flex flex-col gap-3 items-center">
                                        <button onClick={() => handleLoginClick(event.id, AppRoute.Login)} className="w-full max-w-[280px] px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                                            <LoginIcon className="w-5 h-5" /> <span>{t(localeKeys.organizerLogin)}</span>
                                        </button>
                                        <button onClick={() => handleLoginClick(event.id, AppRoute.AttendeePortalLogin)} className="w-full max-w-[280px] px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                                            <UserIcon className="w-5 h-5" /> <span>{t(localeKeys.attendeePortalAccess)}</span>
                                        </button>
                                        <button onClick={() => handleLoginClick(event.id, AppRoute.BoothLogin)} className="w-full max-w-[280px] px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                                            <QrCodeIcon className="w-5 h-5" /> <span>{t(localeKeys.vendorBoothAccess)}</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // --- LIST VIEW MODE (Compact) ---
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 group last:border-0"
                            >
                                {/* Left: Logo & Core Info */}
                                <div className="flex items-center gap-4 flex-grow">
                                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center border border-white/10">
                                        {event.eventLogoUrl ? (
                                            <img src={event.eventLogoUrl} alt={event.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <BuildingStorefrontIcon className="w-6 h-6 text-slate-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-slate-100 truncate pr-2">{event.name}</h3>
                                        <p className="text-xs text-slate-400">{formatDateRange(event.startDate, event.endDate)}</p>
                                    </div>
                                </div>

                                {/* Right: Compact Actions */}
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                                    <button
                                        onClick={() => handleLoginClick(event.id, AppRoute.Login)}
                                        className="flex-1 sm:flex-none px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20 whitespace-nowrap"
                                    >
                                        Organizer
                                    </button>
                                    <button
                                        onClick={() => handleLoginClick(event.id, AppRoute.AttendeePortalLogin)}
                                        className="flex-1 sm:flex-none px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-xs font-bold rounded-lg border border-cyan-500/20 whitespace-nowrap"
                                    >
                                        Attendee
                                    </button>
                                    <button
                                        onClick={() => handleLoginClick(event.id, AppRoute.BoothLogin)}
                                        className="flex-1 sm:flex-none px-3 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 text-xs font-bold rounded-lg border border-sky-500/20 whitespace-nowrap"
                                    >
                                        Vendor
                                    </button>
                                </div>
                            </motion.div>
                        )
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 px-4 sm:px-6" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}>
            <div className="w-full max-w-2xl mx-auto flex-grow flex flex-col justify-center">
                <header className="text-center mb-8 sm:mb-12 px-2">
                    <Link to={AppRoute.ClientPortal} className="text-sm text-slate-400 hover:text-white inline-flex items-center mb-6 transition-colors">
                        {t(localeKeys.backToCompanyList)}
                    </Link>
                    {company?.logo_url && (
                        <motion.img
                            src={company.logo_url}
                            alt={`${company.name} Logo`}
                            className="h-16 sm:h-20 w-auto mx-auto mb-4 rounded-md object-contain"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        />
                    )}
                    <motion.h1
                        className="text-3xl sm:text-5xl font-bold text-slate-100 font-montserrat mt-2 px-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {company?.name ? t(localeKeys.companyEventsTitle, { companyName: company.name }) : 'Events'}
                    </motion.h1>
                    <motion.p
                        className="text-base sm:text-lg text-slate-400 mt-4 px-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {t(localeKeys.companyEventsSubtitle)}
                    </motion.p>
                </header>

                <main>
                    {renderContent()}
                </main>
            </div>
            <footer className="w-full max-w-4xl mx-auto text-center py-4 flex-shrink-0">
                <Link to={AppRoute.Login} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {t(localeKeys.organizerLogin)}
                </Link>
            </footer>
        </div>
    );
};

export default EventSelectionPage;