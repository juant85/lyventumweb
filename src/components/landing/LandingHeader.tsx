import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, User } from 'lucide-react';

import { AppRoute } from '../../types';
import { APP_NAME } from '../../constants';
import LyVentumLogo from '../Logo';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import LanguageSwitcher from '../LanguageSwitcher';

// Navigation Links Data
const NAV_LINKS = [
    { href: '#features', labelKey: localeKeys.footerLinkFeatures },
    { href: '#how-it-works', labelKey: localeKeys.howItWorksTitle },
    { href: '#pricing', labelKey: localeKeys.footerLinkPricing },
    { href: '#faq', labelKey: 'FAQ' },
];

export const LandingHeader: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [navigate]);

    const handleLogoClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full ${isScrolled
                    ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 shadow-xl'
                    : 'bg-transparent border-b border-transparent'
                    }`}
            >
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20 relative">

                        {/* MOBILE: Hamburger (Left) */}
                        <div className="flex items-center lg:hidden z-20">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 -ml-2 text-slate-300 hover:text-white focus:outline-none"
                                aria-label="Open menu"
                            >
                                <Menu className="w-7 h-7" />
                            </button>
                        </div>

                        {/* LOGO (Center Mobile / Left Desktop) */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 lg:flex lg:items-center lg:gap-3 cursor-pointer z-10"
                            onClick={handleLogoClick}
                        >
                            <LyVentumLogo variant="gradient" className="h-8 w-32 md:h-10 md:w-40" />
                            <span className={`text-xl font-bold font-montserrat tracking-tight text-white hidden lg:block ${isScrolled ? 'opacity-100' : 'opacity-90'}`}>
                                {APP_NAME}
                            </span>
                        </div>

                        {/* DESKTOP NAVIGATION (Center) */}
                        <nav className="hidden lg:flex items-center gap-8">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                >
                                    {link.labelKey === 'FAQ' ? 'FAQ' : t(link.labelKey)}
                                </a>
                            ))}
                        </nav>

                        {/* DESKTOP ACTIONS (Right) */}
                        <div className="hidden lg:flex items-center gap-4">
                            <LanguageSwitcher />
                            <Link to={AppRoute.Login} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                {t(localeKeys.footerLinkOrganizerLogin)}
                            </Link>
                            <button
                                onClick={() => navigate(AppRoute.ClientPortal)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                            >
                                <Calendar className="w-4 h-4" />
                                {t(localeKeys.eventAccess)}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '-100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '-100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-slate-950/98 backdrop-blur-xl flex flex-col lg:hidden"
                    >
                        {/* Menu Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                            <div className="flex items-center gap-2" onClick={handleLogoClick}>
                                <LyVentumLogo variant="gradient" className="h-8 w-32" />
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-slate-400 hover:text-white focus:outline-none bg-white/5 rounded-full"
                                aria-label="Close menu"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Menu Links */}
                        <div className="flex-1 overflow-y-auto py-8 px-6 flex flex-col gap-6">

                            {/* Language Switcher */}
                            <div className="flex items-center justify-between py-2 border-b border-white/5 mb-4">
                                <span className="text-slate-400 text-sm font-medium">Language / Idioma</span>
                                <LanguageSwitcher />
                            </div>

                            {/* Nav Links */}
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-2xl font-semibold text-slate-300 hover:text-white transition-colors block py-2"
                                >
                                    {link.labelKey === 'FAQ' ? 'FAQ' : t(link.labelKey)}
                                </a>
                            ))}

                            {/* CTA Buttons */}
                            <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
                                {/* Event Access - PRIMARY (First) */}
                                <button
                                    onClick={() => {
                                        navigate(AppRoute.ClientPortal);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center justify-between w-full py-4 px-4 text-base font-medium text-slate-100 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
                                >
                                    <span className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-primary-400" />
                                        {t(localeKeys.eventAccess)}
                                    </span>
                                    <span className="text-slate-500">→</span>
                                </button>

                                {/* Organizer Login - Secondary */}
                                <Link
                                    to={AppRoute.Login}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-between w-full py-4 px-4 text-base font-medium text-slate-100 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
                                >
                                    <span className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-slate-400" />
                                        {t(localeKeys.footerLinkOrganizerLogin)}
                                    </span>
                                    <span className="text-slate-500">→</span>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
