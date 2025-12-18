// src/pages/public/ClientPortalPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowPathIcon, BuildingStorefrontIcon, ArrowRightIcon } from '../../components/Icons';
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { AppRoute } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

type Company = { id: string; name: string; logo_url: string | null; };

const ClientPortalPage: React.FC = () => {
    const { t } = useLanguage();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async () => {
        setLoading(true);

        try {
            // Get today's date in ISO format for comparison
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch all companies
            const { data: companiesData, error: companiesError } = await supabase
                .from('companies')
                .select('id, name, logo_url')
                .order('name');

            // 2. Fetch ACTIVE events (is_active AND not past)
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('company_id')
                .eq('is_active', true)
                .or(`end_date.gte.${today},end_date.is.null`);

            if (companiesError || eventsError) {
                console.error('❌ [ClientPortal] Error fetching data:', companiesError || eventsError);
                setCompanies([]);
                setLoading(false);
                return;
            }

            // 3. Create Set of company IDs that have active events
            const companyIdsWithActiveEvents = new Set(
                eventsData?.map(event => event.company_id).filter(Boolean) || []
            );

            // 4. Filter companies that have at least one active event
            const companiesWithActiveEvents = companiesData?.filter(company =>
                companyIdsWithActiveEvents.has(company.id)
            ) || [];

            setCompanies(companiesWithActiveEvents);
        } catch (error) {
            console.error('💥 [ClientPortal] Unexpected error:', error);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-400" />
                    <p className="ml-3 font-semibold text-slate-300">{t(localeKeys.loading)}</p>
                </div>
            );
        }

        if (companies.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-slate-100 font-semibold text-lg">No companies are hosting events at this time.</p>
                    <p className="text-sm text-slate-400 mt-2">Please check back later or contact an administrator.</p>
                    <Button onClick={fetchCompanies} variant="neutral" size="sm" className="mt-6" leftIcon={<ArrowPathIcon className="w-4 h-4" />}>
                        Refresh List
                    </Button>
                </div>
            );
        }

        // Single Company View
        if (companies.length === 1) {
            const company = companies[0];
            return (
                <div className="flex-grow flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="w-full max-w-lg"
                    >
                        <BackgroundGradient containerClassName="rounded-2xl">
                            <div className="bg-slate-900/80 backdrop-blur-sm rounded-[21px] p-6 sm:p-8 flex flex-col items-center text-center">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt={`${company.name} logo`} className="h-24 sm:h-32 w-auto max-w-[240px] sm:max-w-xs object-contain mb-4 sm:mb-6" />
                                ) : (
                                    <BuildingStorefrontIcon className="w-20 sm:w-24 h-20 sm:h-24 text-slate-500 mb-4 sm:mb-6" />
                                )}
                                <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 font-montserrat">{company.name}</h3>
                                <p className="text-sm sm:text-base text-slate-400 mt-2 mb-6 sm:mb-8">Welcome to the official event portal.</p>
                                <Link to={AppRoute.EventSelection.replace(':companyId', company.id)}>
                                    <Button size="lg" variant="primary" className="text-sm sm:text-base px-6 sm:px-8">
                                        View Events <ArrowRightIcon className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </BackgroundGradient>
                    </motion.div>
                </div>
            );
        }

        // Multiple Companies View
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {companies.map((company, index) => (
                    <motion.div
                        key={company.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                    >
                        <Link to={AppRoute.EventSelection.replace(':companyId', company.id)} className="block h-full group">
                            <BackgroundGradient containerClassName="rounded-xl h-full">
                                <div className="bg-slate-900/80 hover:bg-slate-800/90 transition-colors duration-300 backdrop-blur-sm rounded-[11px] p-5 sm:p-6 flex flex-col items-center justify-between text-center min-h-[14rem] sm:min-h-[16rem] h-auto">
                                    <div className="flex-grow flex items-center justify-center">
                                        {company.logo_url ? (
                                            <img src={company.logo_url} alt={`${company.name} logo`} className="h-16 sm:h-24 w-auto max-w-[10rem] sm:max-w-[12rem] object-contain" />
                                        ) : (
                                            <BuildingStorefrontIcon className="w-16 sm:w-20 h-16 sm:h-20 text-slate-500" />
                                        )}
                                    </div>
                                    <div className="w-full pt-3 sm:pt-4 border-t border-slate-700/50">
                                        <h3 className="text-lg sm:text-xl font-bold text-slate-100 font-montserrat truncate w-full">{company.name}</h3>
                                        <div className="flex items-center justify-center mt-2 text-xs sm:text-sm font-semibold text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            View Events <ArrowRightIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </BackgroundGradient>
                        </Link>
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}>
            <div className="w-full max-w-5xl mx-auto flex-grow flex flex-col justify-center">
                <header className="text-center mb-8 sm:mb-12">
                    <Link to={AppRoute.Landing} className="inline-block group mb-4">
                        <LyVentumLogo className="h-12 sm:h-16 w-auto mx-auto filter drop-shadow-[0_4px_10px_rgba(59,130,246,0.25)] dark:drop-shadow-[0_5px_15px_rgba(96,165,250,0.25)] transition-transform duration-300 group-hover:scale-105" />
                        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white font-montserrat">
                            LyVenTum
                        </p>
                    </Link>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 font-montserrat mt-4">{t(localeKeys.clientPortalTitle)}</h1>
                    <p className="text-base sm:text-lg text-slate-400 mt-2 max-w-2xl mx-auto px-4">{t(localeKeys.clientPortalSubtitle)}</p>
                </header>

                <main className="flex-grow flex flex-col">
                    {renderContent()}
                </main>
            </div>
            <footer className="w-full max-w-4xl mx-auto text-center py-4 flex-shrink-0">
                <Link to={AppRoute.Login} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {t(localeKeys.superAdminLogin)}
                </Link>
            </footer>
        </div>
    );
};

export default ClientPortalPage;