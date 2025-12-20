// src/pages/public/LandingPage.tsx
import React, { useEffect, useState } from 'react';
import DashboardPreview from '../../components/marketing/DashboardPreview';
import { Link, useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import { APP_NAME } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

// Keep Heroicons for UI elements (arrows, checks)
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  CursorArrowRaysIcon
} from '../../components/Icons';

// Lucide React for feature/step icons (modern, minimalist)
import {
  BarChart3,
  ScanLine,
  Calendar,
  Store,
  RefreshCw,
  FileDown,
  FileText,
  QrCode,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

import { getHomePathForRole } from '../../components/Layout';
import { LandingHeader } from '../../components/landing/LandingHeader';
import LyVentumLogo from '../../components/Logo';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ContactFormModal } from '../../components/landing/ContactFormModal';
import Button from '../../components/ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 sm:p-4 md:p-5 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/10 hover:border-primary-500/50 transition-all duration-300 text-left group"
      >
        <div className="flex justify-start items-start gap-2">
          <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-primary-100 transition-colors tracking-tight">
            {question}
          </h3>
          <ChevronDown
            className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-400' : 'text-white'
              }`}
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <p className="mt-4 text-slate-300 leading-relaxed">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
};

// Optimized animation constants
const BLOB_ANIMATION_PRIMARY = {
  scale: [1, 1.2, 1],
  rotate: [0, 90, 0],
  transition: { duration: 20, repeat: Infinity, ease: "easeInOut" as const }
};

const BLOB_ANIMATION_SECONDARY = {
  scale: [1, 1.1, 1],
  x: [0, 50, 0],
  transition: { duration: 15, repeat: Infinity, ease: "easeInOut" as const }
};

const GRADIENT_PULSE = {
  scale: [1, 1.2, 1],
  opacity: [0.15, 0.25, 0.15],
  transition: { duration: 10, repeat: Infinity, ease: "easeInOut" as const }
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loadingAuth } = useAuth();
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll detection for progress bar and back-to-top
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowBackToTop(window.scrollY > 300);

          // Calculate scroll progress
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = Math.min((window.scrollY / totalHeight) * 100, 100);
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!loadingAuth && currentUser) {
      const homePath = getHomePathForRole(currentUser.role);
      navigate(homePath, { replace: true });
    }
  }, [currentUser, loadingAuth, navigate]);

  if (loadingAuth || currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="p-8 text-center">
          <svg className="animate-spin h-8 w-8 text-white mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-montserrat text-white">{t(localeKeys.loading)}</p>
        </div>
      </div>
    );
  }

  const motionProps = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.8, ease: "easeInOut" as const },
  });

  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" strokeWidth={1.5} absoluteStrokeWidth />,
      title: t(localeKeys.featureAnalyticsTitle),
      description: t(localeKeys.featureAnalyticsDesc)
    },
    {
      icon: <ScanLine className="w-8 h-8" strokeWidth={1.5} absoluteStrokeWidth />,
      title: t(localeKeys.featureQRTitle),
      description: t(localeKeys.featureQRDesc)
    },
    {
      icon: <Calendar className="w-8 h-8" strokeWidth={1.5} absoluteStrokeWidth />,
      title: t(localeKeys.featureSessionsTitle),
      description: t(localeKeys.featureSessionsDesc)
    },
    {
      icon: <Store className="w-8 h-8" strokeWidth={1.5} absoluteStrokeWidth />,
      title: t(localeKeys.featureBoothsTitle),
      description: t(localeKeys.featureBoothsDesc)
    },
    {
      icon: <RefreshCw className="w-8 h-8" strokeWidth={1.5} absoluteStrokeWidth />,
      title: t(localeKeys.featureSyncTitle),
      description: t(localeKeys.featureSyncDesc)
    },
    {
      icon: <FileDown className="w-8 h-8" strokeWidth={1.5} absoluteStrokeWidth />,
      title: t(localeKeys.featureExportTitle),
      description: t(localeKeys.featureExportDesc)
    }
  ];

  const steps = [
    {
      number: 1,
      title: t(localeKeys.step1Title),
      description: t(localeKeys.step1Desc),
      icon: <FileText className="w-8 h-8" strokeWidth={1.5} />
    },
    {
      number: 2,
      title: t(localeKeys.step2Title),
      description: t(localeKeys.step2Desc),
      icon: <Store className="w-8 h-8" strokeWidth={1.5} />
    },
    {
      number: 3,
      title: t(localeKeys.step3Title),
      description: t(localeKeys.step3Desc),
      icon: <QrCode className="w-8 h-8" strokeWidth={1.5} />
    },
    {
      number: 4,
      title: t(localeKeys.step4Title),
      description: t(localeKeys.step4Desc),
      icon: <BarChart3 className="w-8 h-8" strokeWidth={1.5} />
    }
  ];

  const defaultPlans = [
    {
      name: t(localeKeys.plans.basic.name),
      price: t(localeKeys.plans.basic.price),
      priceSubtitle: t(localeKeys.plans.basic.subtitle),
      description: t(localeKeys.plans.basic.description),
      features: [
        { text: t(localeKeys.plans.features[0]), included: true },
        { text: t(localeKeys.plans.features[1]), included: true },
        { text: t(localeKeys.plans.features[2]), included: true },
        { text: t(localeKeys.plans.features[3]), included: true },
        { text: t(localeKeys.plans.features[4]), included: false },
        { text: t(localeKeys.plans.features[5]), included: false },
        { text: t(localeKeys.plans.features[6]), included: false },
      ],
      cta: t(localeKeys.plans.basic.cta),
    },
    {
      name: t(localeKeys.plans.professional.name),
      price: t(localeKeys.plans.professional.price),
      priceSubtitle: t(localeKeys.plans.professional.subtitle),
      description: t(localeKeys.plans.professional.description),
      features: [
        { text: t(localeKeys.plans.features[0]), included: true },
        { text: t(localeKeys.plans.features[1]), included: true },
        { text: t(localeKeys.plans.features[2]), included: true },
        { text: t(localeKeys.plans.features[3]), included: true },
        { text: t(localeKeys.plans.features[4]), included: true },
        { text: t(localeKeys.plans.features[5]), included: true },
        { text: t(localeKeys.plans.features[6]), included: true },
      ],
      cta: t(localeKeys.plans.professional.cta),
      isPopular: true,
    },
    {
      name: t(localeKeys.plans.enterprise.name),
      price: t(localeKeys.plans.enterprise.price),
      priceSubtitle: t(localeKeys.plans.enterprise.subtitle),
      description: t(localeKeys.plans.enterprise.description),
      features: [
        { text: t(localeKeys.plans.features[0]), included: true },
        { text: t(localeKeys.plans.features[1]), included: true },
        { text: t(localeKeys.plans.features[2]), included: true },
        { text: t(localeKeys.plans.features[3]), included: true },
        { text: t(localeKeys.plans.features[4]), included: true },
        { text: t(localeKeys.plans.features[5]), included: true },
        { text: t(localeKeys.plans.features[6]), included: true },
        { text: t(localeKeys.plans.features[7]), included: true },
        { text: t(localeKeys.plans.features[8]), included: true },
        { text: t(localeKeys.plans.features[9]), included: true },
        { text: t(localeKeys.plans.features[10]), included: true },
      ],
      cta: t(localeKeys.plans.enterprise.cta),
    },
  ];

  const [plans, setPlans] = useState(defaultPlans);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase.from('plans').select('*').order('name');

        if (error || !data || data.length === 0) {
          return; // Keep defaults
        }

        // Merge DB data with defaults (preserving pricing/features which aren't in DB yet)
        const mergedPlans = data.map(dbPlan => {
          // Try to find a matching default plan to inherit pricing/features
          // Normalize names for comparison (Basic vs basic)
          const match = defaultPlans.find(p =>
            p.name.toLowerCase().includes(dbPlan.name.toLowerCase()) ||
            dbPlan.name.toLowerCase().includes(p.name.toLowerCase())
          );

          if (match) {
            return {
              ...match,
              name: dbPlan.name,
              // Prioritize translated description if available (from fallback/match), otherwise use DB description
              description: match.description || dbPlan.description,
            };
          }

          // If no match found (new plan in DB), use a generic structure
          return {
            name: dbPlan.name,
            price: t(localeKeys.plans.fallback.price),
            priceSubtitle: t(localeKeys.plans.fallback.subtitle),
            description: dbPlan.description || t(localeKeys.plans.fallback.description),
            features: [
              { text: t(localeKeys.plans.fallback.feature1), included: true },
              { text: t(localeKeys.plans.fallback.feature2), included: true },
            ],
            cta: t(localeKeys.plans.fallback.cta),
            isPopular: false
          };
        });

        // Ensure we always have at least the "Enterprise" tailored plan if DB is weird
        // (Optional safety net, but "mergedPlans" should be enough)

        setPlans(mergedPlans);
      } catch (err) {
        console.error('Failed to fetch pricing plans:', err);
        // Fallback is automatic since state init with defaults
      }
    };

    fetchPlans();
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden"
      style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.15) 1px, transparent 0)`, backgroundSize: '40px 40px' }}>

      {/* UNIFIED HEADER COMPONENT */}
      <LandingHeader />

      {/* SCROLL PROGRESS BAR */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-green-500 z-50 transition-all duration-300 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to main content
      </a>
      {/* HERO SECTION */}
      <section
        id="hero"
        aria-label="Sección principal con descripción del producto LyVenTum"
        className="relative min-h-[100vh] md:min-h-[90vh] flex items-center pt-20 md:pt-24 pb-12 px-5 sm:px-6 md:px-8 overflow-hidden safe-area-top safe-area-bottom"
      >
        {/* Anchor for Skip Link */}
        <div id="main-content" className="sr-only"></div>

        {/* Animated background blobs - Optimized */}
        <motion.div
          animate={BLOB_ANIMATION_PRIMARY}
          className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] md:w-[70vw] md:h-[70vw] bg-primary-900/10 rounded-full blur-[60px] md:blur-[100px] -z-10"
        />
        <motion.div
          animate={BLOB_ANIMATION_SECONDARY}
          className="absolute top-[15%] -right-[15%] w-[70vw] h-[70vw] md:w-[60vw] md:h-[60vw] bg-blue-900/10 rounded-full blur-[60px] md:blur-[100px] -z-10"
        />

        <div className="max-w-7xl mx-auto w-full flex flex-col items-center gap-12 lg:gap-16 pt-8">

          {/* Text Content - Centered */}
          <div className="flex flex-col items-center text-center z-10 order-1 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              {/* Hero Branding - Centered */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 md:mb-8"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest brand-gradient-text">
                  {APP_NAME}
                </h2>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-montserrat mb-6 md:mb-8 tracking-tight leading-[1.1] text-white">
                <span dangerouslySetInnerHTML={{ __html: t(localeKeys.landingTitle) }} />
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
                {t(localeKeys.landingSubtitle)}
              </p>
              <div className="flex justify-center w-full">
                <Button
                  onClick={() => navigate(AppRoute.ClientPortal)}
                  variant="primary"
                  size="lg"
                  className="text-sm md:text-base px-6 py-2.5 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all flex items-center justify-center font-bold rounded-full w-auto"
                >
                  {/* Changed to 'Event Access' pointing to Client Portal (Company Events) */}
                  {t(localeKeys.eventAccess)}
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Hero Image - Centered Below */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-0 order-2 w-full max-w-5xl mx-auto"
          >
            <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl shadow-slate-950/50 bg-slate-900/50 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-blue-500/10 mix-blend-overlay"></div>
              <img
                src="/images/landing/hero-booth.png"
                alt="Profesionales interactuando en un stand de evento usando la plataforma LyVenTum para gestión de asistentes"
                className="w-full h-full object-cover opacity-90"
                loading="eager"
                width="1200"
                height="800"
              />
              {/* Subtle overlay to integrate with dark theme */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

            </div>
          </motion.div>

        </div>
      </section >

      {/* FEATURES SECTION */}
      <section id="features" className="relative pt-16 md:pt-24 pb-24 md:pb-32 px-5 sm:px-6 md:px-8 overflow-hidden" >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-green-600/5" />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-montserrat brand-gradient-text mb-4">
              {t(localeKeys.featuresTitle)}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {t(localeKeys.featuresSubtitle)}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  mass: 1,
                  delay: index * 0.1
                }}
                className="group relative p-6 md:p-8 rounded-3xl
                           bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40
                           backdrop-blur-xl border border-slate-700/50
                           hover:border-primary-500/50
                           transition-all duration-300
                           lg:hover:scale-[1.02] lg:hover:shadow-xl lg:hover:shadow-primary-500/10
                           overflow-hidden"
              >
                {/* Hover glow effect - Simplified for mobile performance */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:via-transparent group-hover:to-green-500/10 transition-all duration-300 rounded-3xl" />

                {/* Icon with gradient background */}
                <div className="relative mb-5">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-green-500/20 flex items-center justify-center
                                lg:group-hover:scale-105 transition-all duration-300
                                shadow-lg shadow-primary-500/10">
                    <div className="text-primary-400 group-hover:text-primary-300 transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  {/* Decorative dot */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <h3 className="relative text-xl font-bold mb-3 font-montserrat text-white group-hover:text-primary-100 transition-colors">
                  {feature.title}
                </h3>
                <p className="relative text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary-500 to-green-500 group-hover:w-full transition-all duration-500 rounded-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* PRODUCT SHOWCASE SECTION */}
      <section
        id="product-showcase"
        aria-label="Demostración de la plataforma LyVenTum"
        className="relative py-24 md:py-32 px-4 overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900"
      >
        {/* Enhanced gradient background - Optimized */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-green-600/10" />
        <motion.div
          animate={GRADIENT_PULSE}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] md:w-[50rem] md:h-[50rem] bg-[radial-gradient(circle_farthest-side,rgba(59,130,246,0.1),rgba(255,255,255,0))] pointer-events-none"
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-montserrat brand-gradient-text mb-4">
              {t(localeKeys.productShowcaseTitle)}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {t(localeKeys.productShowcaseSubtitle)}
            </p>
          </motion.div>

          {/* Desktop Dashboard Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20"
          >
            {/* Browser mockup & Dashboard Preview */}
            <div className="relative mx-auto max-w-6xl">
              {/* Browser chrome */}
              <div className="bg-slate-800 rounded-t-xl p-3 flex items-center gap-2 border-b border-slate-700">
                <div className="flex gap-1.5 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-2 sm:mx-4 overflow-hidden">
                  <div className="bg-slate-700 rounded px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-slate-400 text-center font-mono truncate">
                    app.lyventum.com/dashboard/event-monitor
                  </div>
                </div>
              </div>

              {/* Dynamic Dashboard Component */}
              <div className="relative rounded-b-xl overflow-hidden shadow-2xl shadow-primary-500/20 ring-1 ring-slate-700 bg-slate-950">
                <DashboardPreview />

                {/* Subtle sheen overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none"></div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -right-4 top-1/4 bg-white/10 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-lg shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="text-xs font-bold">{t(localeKeys.liveDataStream)}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Mobile Scanner Screenshot */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-center px-4">

            {/* Column 1: Phone Mockup (Moved to Left) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-center items-center relative min-h-[500px]"
            >
              <div className="relative z-10 w-[280px]">
                {/* Phone frame */}
                <div className="relative bg-slate-900 rounded-[3rem] p-3 shadow-2xl shadow-primary-500/20 ring-1 ring-slate-700">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20"></div>
                  <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-950 aspect-[9/19]">
                    <img
                      src="/screenshots/mobile-scanner.png"
                      alt="Aplicación móvil de LyVenTum mostrando escáner QR en tiempo real para check-in de asistentes"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width="280"
                      height="572"
                    />
                  </div>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-green-500/20 blur-3xl -z-10"></div>
              </div>
            </motion.div>

            {/* Column 2: Text Content (Center) */}
            <div className="order-first lg:order-none text-left flex flex-col items-start w-full relative z-10">
              {/* Backdrop Container for Verification/Contrast - Increased Opacity */}
              <div className="bg-slate-950/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700 shadow-xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-600 mb-8"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-slate-200">{t(localeKeys.availableOnMobile)}</span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-5xl font-bold font-montserrat mb-6 leading-tight w-full text-center md:text-left text-white"
                >
                  {t(localeKeys.builtForSpeedTitle)
                    .split('<speed>')
                    .map((part, i) =>
                      i === 0 ? part : (
                        <React.Fragment key={i}>
                          <span className="brand-gradient-text">{part.split('</speed>')[0]}</span>
                          {part.split('</speed>')[1]}
                        </React.Fragment>
                      )
                    )
                  }
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-slate-300 mb-8 text-center md:text-left leading-relaxed"
                >
                  {t(localeKeys.builtForSpeedSubtitle)}
                </motion.p>

                <ul className="space-y-4 text-left w-full">
                  {[
                    t(localeKeys.offlineArchitecture),
                    t(localeKeys.instantQRScanning),
                    t(localeKeys.liveBoothMonitoring),
                    t(localeKeys.realTimeSync)
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + (index * 0.1) }}
                      className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 w-full hover:bg-slate-800 transition-colors"
                    >
                      <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200 font-medium">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 3: Human Context Image (Tablet - Moved to Right) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hidden lg:block relative h-[500px] w-full rounded-3xl overflow-hidden border-2 border-slate-700/50 shadow-2xl"
            >
              <img
                src="/images/landing/checkin-tablet.png"
                alt="Personal de evento usando tablet con sistema de check-in de LyVenTum en mesa de registro"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
                width="500"
                height="500"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-6">
                <p className="text-white font-medium">{t(localeKeys.streamlinedCheckin)}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section >

      {/* HOW IT WORKS SECTION */}
      <section
        id="how-it-works"
        aria-label="Proceso de 4 pasos para usar LyVenTum"
        className="relative py-24 md:py-32 px-4 bg-slate-950"
      >
        {/* Gradient background - Optimized */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-transparent to-primary-600/10" />
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-montserrat brand-gradient-text mb-4">
              {t(localeKeys.howItWorksTitle)}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {t(localeKeys.howItWorksSubtitle)}
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-blue-400 to-green-500 origin-top"
            />

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`relative flex items-center gap-8 mb-20 md:mb-24 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Number badge */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-green-500 flex items-center justify-center shadow-lg shadow-primary-500/50">
                    <span className="text-2xl font-bold">{step.number}</span>
                  </div>
                </div>

                {/* Content card - Enhanced visibility */}
                <div className={`flex-1 p-6 md:p-8 rounded-2xl
                                bg-gradient-to-br from-slate-800/90 to-slate-900/90
                                backdrop-blur-xl border border-slate-600
                                shadow-xl shadow-slate-900/50
                                hover:border-primary-500/50 hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300
                                ${index % 2 === 0 ? 'md:ml-8' : 'md:mr-8'}`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-lg bg-primary-500/10 text-primary-400">
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-bold font-montserrat text-white">{step.title}</h3>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* PRICING SECTION */}
      <section id="pricing" className="relative py-24 md:py-32 px-5 sm:px-6 md:px-8 overflow-hidden" >
        {/* Gradient background - Optimized */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-primary-600/10" />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-montserrat brand-gradient-text mb-4">
              {t(localeKeys.pricingTitle)}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {t(localeKeys.pricingSubtitle)}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch relative z-10">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col h-full`}
              >
                <div className={`
                    relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-300
                    ${plan.isPopular
                    ? 'bg-slate-900/90 backdrop-blur-xl border-2 border-primary-500 shadow-2xl shadow-primary-500/20 scale-105 z-10'
                    : 'bg-slate-900/80 backdrop-blur-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  }
                  `}>



                  {/* Most Popular Badge */}
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-primary-600 to-indigo-600 h-2" />
                  )}

                  {/* Main Content Area - Padded */}
                  <div className="flex-grow p-8 flex flex-col">
                    {/* Header */}
                    {plan.isPopular && (
                      <div className="flex justify-center mb-6 -mt-4">
                        <span className="bg-primary-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-b-lg shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className={`text-3xl md:text-4xl font-black uppercase tracking-tight font-montserrat mb-4 ${plan.isPopular ? 'text-white' : 'text-slate-200'}`}>
                        {plan.name}
                      </h3>

                      <div className="flex items-baseline justify-center gap-1 mb-4 h-14 md:h-16 items-center">
                        <span className={`${plan.price.length > 8 ? 'text-3xl md:text-4xl' : 'text-5xl lg:text-6xl'} font-bold text-white tracking-tight leading-none`}>
                          {plan.price}
                        </span>
                        {plan.price !== 'Custom' && plan.price.length < 8 && (
                          <span className="text-sm font-medium text-slate-500 ml-1">{plan.priceSubtitle}</span>
                        )}
                      </div>

                      <p className="text-slate-400 text-sm leading-relaxed min-h-[40px] px-4">
                        {plan.description}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className={`w-full h-px mb-8 ${plan.isPopular ? 'bg-gradient-to-r from-transparent via-primary-500/50 to-transparent' : 'bg-slate-700/50'}`}></div>

                    {/* Features List */}
                    <div className="flex-grow px-2">
                      <ul className="space-y-4">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            {feature.included ? (
                              <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${plan.isPopular ? 'text-primary-400' : 'text-green-400'}`} />
                            ) : (
                              <XCircleIcon className="w-5 h-5 flex-shrink-0 text-slate-700" />
                            )}
                            <span className={`${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer Area - Merged with Card */}
                  <div className="p-6 sm:p-8 mt-auto pt-0 flex justify-center pb-8 sm:pb-10">
                    <Button
                      onClick={() => setIsContactModalOpen(true)}
                      variant={plan.isPopular ? 'primary' : 'secondary'}
                      size="lg"
                      className={`w-full sm:w-auto px-8 py-3 text-xs font-semibold uppercase tracking-widest transition-all duration-300 rounded-full
                        ${plan.isPopular
                          ? 'shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1'
                          : 'bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 text-white shadow-md'
                        }`}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* FAQ SECTION */}
      <section id="faq" className="relative py-24 md:py-32 overflow-hidden" >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-green-900/10 pointer-events-none" />

        <div className="w-[90%] md:max-w-2xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-montserrat brand-gradient-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-400">
              Everything you need to know about LyVenTum
            </p>
          </motion.div>

          <div className="space-y-3 sm:space-y-4">
            {[
              {
                question: "How does QR code scanning work?",
                answer: "LyVenTum uses your device's camera to scan QR codes on attendee badges. Each scan is instantly recorded with timestamp, booth location, and attendee information. The system provides real-time feedback and updates your dashboard automatically."
              },
              {
                question: "Does it work offline?",
                answer: "Yes! Our mobile app stores scans locally when you're offline and automatically syncs them when you reconnect. This ensures you never lose data, even in venues with poor connectivity."
              },
              {
                question: "Can I customize the booth layout?",
                answer: "Absolutely. You can drag and drop booths to match your venue's layout, organize them by zones, and set custom capacities for each booth. The visual booth map updates in real-time as attendees check in."
              },
              {
                question: "Is my data secure?",
                answer: "All data is encrypted in transit and at rest using industry-standard encryption. We use Supabase for secure cloud storage with automatic backups. You maintain full ownership of your data and can export it anytime."
              },
              {
                question: "How does pricing work?",
                answer: "We offer three flexible pricing tiers (Essentials, Professional, Enterprise) with custom pricing based on your event size and specific needs. All plans include core features like real-time analytics and QR scanning. Contact us for a personalized quote tailored to your event."
              },
              {
                question: t(localeKeys.walkinFaqQuestion),
                answer: t(localeKeys.walkinFaqAnswer)
              },
              {
                question: t(localeKeys.walkinLimitFaqQuestion),
                answer: t(localeKeys.walkinLimitFaqAnswer)
              },
              {
                question: "Can I manage multiple events?",
                answer: "Yes, you can create and manage multiple events from a single account. Each event has its own dashboard, sessions, booths, and attendees. Switch between events instantly from the navigation menu."
              }
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50"
          >
            <h3 className="text-xl font-semibold mb-2 text-slate-100">Still have questions?</h3>
            <p className="text-slate-300 mb-4">
              Our team is here to help you get started
            </p>
            <a
              href="mailto:lyventum@gmail.com"
              className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              lyventum@gmail.com
            </a>
          </motion.div>
        </div>
      </section >

      {/* STRONG CTA SECTION */}
      <section className="relative py-32 px-4 overflow-hidden" >
        {/* Background Image - Human Connection */}
        <div className="absolute inset-0 z-0" >
          <img
            src="/images/landing/networking-people.png"
            alt="Event Networking Community"
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
        </div >

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-purple-600/10 to-green-600/10 mix-blend-color-dodge" />


        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-5xl md:text-7xl font-bold font-montserrat mb-6">
              <span className="brand-gradient-text">Ready to Transform</span>
              <br />
              <span className="text-white">Your Events?</span>
            </h2>

            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join event organizers who trust LyVenTum to deliver exceptional experiences
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                onClick={() => setIsContactModalOpen(true)}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 group shadow-2xl shadow-primary-500/50 hover:shadow-primary-500/70 transition-all"
              >
                Request Information
                <ArrowRightIcon className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                onClick={() => setIsContactModalOpen(true)}
                variant="neutral"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4"
              >
                Schedule a Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>Custom pricing for your needs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>Schedule a demo to see it in action</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>Trusted by event professionals</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section >

      {/* FOOTER */}
      < footer className="relative border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl px-4 py-16" >

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Column 1: Logo & Tagline */}
            <div className="md:col-span-2">
              <LyVentumLogo variant="light" className="h-10 w-auto mb-4" />
              <p className="text-slate-400 text-sm mb-6">
                {t(localeKeys.footerTagline)}
              </p>

              {/* Social Links */}
              <div className="flex gap-4">
                <a
                  href="mailto:lyventum@gmail.com"
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 group"
                  aria-label="Email"
                >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/lyventum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 group"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/lyventum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 group"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/lyventum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 group"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-bold font-montserrat mb-4 text-white">{t(localeKeys.footerQuickLinks)}</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                    {t(localeKeys.footerLinkFeatures)}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                    {t(localeKeys.footerLinkPricing)}
                  </a>
                </li>
                <li>
                  <Link to={AppRoute.ClientPortal} className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                    {t(localeKeys.footerLinkEventPortal)}
                  </Link>
                </li>
                <li>
                  <Link to={AppRoute.Login} className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                    {t(localeKeys.footerLinkOrganizerLogin)}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="font-bold font-montserrat mb-4 text-white">{t(localeKeys.footerContactTitle)}</h4>
              <p className="text-slate-400 text-sm mb-4">
                {t(localeKeys.footerContactSubtitle)}
              </p>
              <a
                href="mailto:lyventum@gmail.com"
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                lyventum@gmail.com
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} {APP_NAME}. {t(localeKeys.footerRights)}
            </p>
            <p className="text-slate-600 text-xs">
              {t(localeKeys.footerBuiltWith)}
            </p>
          </div>
        </div>
      </footer >
      {/* Back to Top Button */}
      <AnimatePresence>
        {
          showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary-600 text-white shadow-xl shadow-primary-600/30 hover:bg-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Back to top"
            >
              <ChevronDown className="w-6 h-6 rotate-180" />
            </motion.button>
          )
        }
      </AnimatePresence >

      {/* Structured Data for SEO */}
      < script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does QR code scanning work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "LyVenTum uses your device's camera to scan QR codes on attendee badges. Each scan is instantly recorded with timestamp, booth location, and attendee information. The system provides real-time feedback and updates your dashboard automatically."
                }
              },
              {
                "@type": "Question",
                "name": "Does it work offline?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Our mobile app stores scans locally when you're offline and automatically syncs them when you reconnect. This ensures you never lose data, even in venues with poor connectivity."
                }
              },
              {
                "@type": "Question",
                "name": "Can I customize the booth layout?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. You can drag and drop booths to match your venue's layout, organize them by zones, and set custom capacities for each booth. The visual booth map updates in real-time as attendees check in."
                }
              },
              {
                "@type": "Question",
                "name": "Is my data secure?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "All data is encrypted in transit and at rest using industry-standard encryption. We use Supabase for secure cloud storage with automatic backups. You maintain full ownership of your data and can export it anytime."
                }
              }
            ]
          })
        }}
      />

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div >
  );
};

export default LandingPage;
