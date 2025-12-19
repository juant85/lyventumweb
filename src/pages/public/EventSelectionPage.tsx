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

        return (
            <div className="space-y-8">
                {companyEvents.map((event, index) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="bg-slate-900/50 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 transition-all duration-300 hover:border-primary-500/50 group"
                    >
                        <div className="p-5 sm:p-8 flex flex-col items-center text-center">
                            {/* Album Art / Logo - Responsive Size */}
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

                            {/* Action Buttons - Brand-aligned color hierarchy */}
                            <div className="w-full flex flex-col gap-3 items-center">
                                {/* Organizer - Blue gradient (authority/admin) */}
                                <button
                                    onClick={() => handleLoginClick(event.id, AppRoute.Login)}
                                    className="min-w-[260px] px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                                >
                                    <LoginIcon className="w-5 h-5" />
                                    <span>{t(localeKeys.organizerLogin)}</span>
                                </button>

                                {/* Attendee - Cyan gradient (accessible/users) */}
                                <button
                                    onClick={() => handleLoginClick(event.id, AppRoute.AttendeePortalLogin)}
                                    className="min-w-[260px] px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 flex items-center justify-center gap-2"
                                >
                                    <UserIcon className="w-5 h-5" />
                                    <span>{t(localeKeys.attendeePortalAccess)}</span>
                                </button>

                                {/* Vendor - Sky-Cyan gradient (commercial/distinctive) */}
                                <button
                                    onClick={() => handleLoginClick(event.id, AppRoute.BoothLogin)}
                                    className="min-w-[260px] px-8 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-sky-500/30 flex items-center justify-center gap-2"
                                >
                                    <QrCodeIcon className="w-5 h-5" />
                                    <span>{t(localeKeys.vendorBoothAccess)}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
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