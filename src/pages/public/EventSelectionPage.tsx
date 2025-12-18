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
                .select('*')
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
                        className="bg-slate-800/60 rounded-xl overflow-hidden shadow-lg border border-slate-700 transition-all duration-300 hover:shadow-primary-500/20 hover:border-primary-500/50"
                    >
                        <div className="flex flex-col sm:flex-row">
                            {/* Left side: Album Art */}
                            <div className="w-full sm:w-40 h-40 sm:h-auto bg-slate-700 flex items-center justify-center flex-shrink-0">
                                {event.eventLogoUrl ? (
                                    <img src={event.eventLogoUrl} alt={`${event.name} Logo`} className="w-full h-full object-cover" />
                                ) : (
                                    <BuildingStorefrontIcon className="w-16 h-16 text-slate-500" />
                                )}
                            </div>
                            {/* Right side: Details */}
                            <div className="flex flex-col justify-center p-4 sm:p-6 flex-grow">
                                <h3 className="text-2xl font-bold text-slate-100 font-montserrat">{event.name}</h3>
                                <p className="font-semibold text-slate-300 mt-1">{event.location || 'Location TBD'}</p>
                                <p className="text-sm text-slate-400 mt-1">{formatDateRange(event.startDate, event.endDate)}</p>
                            </div>
                        </div>
                        {/* Bottom part: Action Buttons */}
                        <div className="bg-slate-900/50 p-4 border-t border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                            <Button className="w-full sm:w-auto justify-center" onClick={() => handleLoginClick(event.id, AppRoute.Login)} variant="primary" leftIcon={<LoginIcon className="w-5 h-5" />}>{t(localeKeys.organizerLogin)}</Button>
                            <Button className="w-full sm:w-auto justify-center" onClick={() => handleLoginClick(event.id, AppRoute.AttendeePortalLogin)} variant="secondary" leftIcon={<UserIcon className="w-5 h-5" />}>{t(localeKeys.attendeePortalAccess)}</Button>
                            <Button className="w-full sm:w-auto justify-center" onClick={() => handleLoginClick(event.id, AppRoute.BoothLogin)} variant="neutral" leftIcon={<QrCodeIcon className="w-5 h-5" />}>{t(localeKeys.vendorBoothAccess)}</Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}>
            <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col justify-center">
                <header className="text-center mb-8 sm:mb-12 px-2">
                    <Link to={AppRoute.ClientPortal} className="text-sm text-slate-400 hover:text-white inline-flex items-center mb-6 transition-colors">
                        {t(localeKeys.backToCompanyList)}
                    </Link>
                    {company?.logo_url && (
                        <motion.img
                            src={company.logo_url}
                            alt={`${company.name} Logo`}
                            className="h-20 sm:h-24 w-auto mx-auto mb-4 rounded-md object-contain"
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
                        {t(localeKeys.companyEventsTitle, { companyName: company?.name || '...' })}
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