// src/pages/public/LandingPage.tsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import { APP_NAME } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

// Keep Heroicons for UI elements (arrows, checks)
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon
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
  ChevronDown
} from 'lucide-react';

import { getHomePathForRole } from '../../components/Layout';
import LyVentumLogo from '../../components/Logo';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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
        className="w-full p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 text-left"
      >
        <div className="flex justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-white group-hover:text-primary-100 transition-colors">
            {question}
          </h3>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-400' : ''
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

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loadingAuth } = useAuth();
  const { t } = useLanguage();
  const { scrollY } = useScroll();

  // Parallax effect for background blobs - MUST be before conditional return
  const blob1Y = useTransform(scrollY, [0, 500], [0, 150]);
  const blob2Y = useTransform(scrollY, [0, 500], [0, -150]);
  const scrollOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const scrollYPos = useTransform(scrollY, [0, 100], [0, -20]);

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

  const plans = [
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

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden"
      style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.15) 1px, transparent 0)`, backgroundSize: '40px 40px' }}>
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center p-4"
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}>

        {/* Animated background blobs with parallax */}
        <motion.div
          style={{ y: blob1Y }}
          className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-[radial-gradient(circle_farthest-side,rgba(37,99,235,0.15),rgba(255,255,255,0))]"
        />
        <motion.div
          style={{ y: blob2Y }}
          className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] bg-[radial-gradient(circle_farthest-side,rgba(22,163,74,0.15),rgba(255,255,255,0))]"
        />

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          <motion.div {...motionProps(0.1)} className="group mb-6 hover:scale-105 transition-transform duration-300">
            <LyVentumLogo variant="gradient" className="h-16 w-auto mx-auto" />
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white font-montserrat">
              {APP_NAME}
            </p>
          </motion.div>

          <motion.h1
            {...motionProps(0.3)}
            id="landing-page-heading"
            className="brand-gradient-text py-4 bg-clip-text text-4xl font-medium tracking-tight text-transparent md:text-7xl font-montserrat"
            dangerouslySetInnerHTML={{ __html: t(localeKeys.landingTitle) }}
          />

          <motion.p {...motionProps(0.7)} className="text-md sm:text-lg text-slate-300 font-sans mb-12 max-w-xl mx-auto">
            {t(localeKeys.landingSubtitle)}
          </motion.p>

          <motion.div {...motionProps(0.9)} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
            <Button
              onClick={() => navigate(AppRoute.ClientPortal)}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto group"
            >
              {t(localeKeys.accessEventPortal)}
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate(AppRoute.Login)}
              variant="neutral"
              size="lg"
              className="w-full sm:w-auto"
            >
              {t(localeKeys.organizerLogin)}
            </Button>
          </motion.div>


        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative py-24 md:py-32 px-4 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-transparent to-green-600/10" />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
        />
        {/* Animated light beam sweeping across - increased visibility */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 left-0 w-[80%] h-full pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.15) 50%, transparent 100%)',
            filter: 'blur(40px)'
          }}
        />
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
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative p-8 rounded-3xl
                           bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40
                           backdrop-blur-xl border border-slate-700/50
                           hover:border-primary-500/50
                           transition-all duration-500
                           hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20
                           overflow-hidden"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:via-transparent group-hover:to-green-500/10 transition-all duration-500 rounded-3xl" />

                {/* Icon with gradient background */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-green-500/20 flex items-center justify-center
                                group-hover:scale-110 group-hover:rotate-3 transition-all duration-500
                                shadow-lg shadow-primary-500/10 group-hover:shadow-primary-500/30">
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
      </section>

      {/* PRODUCT SHOWCASE SECTION */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-transparent to-green-600/15" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -8, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-purple-500/15 rounded-full blur-3xl"
        />
        {/* Animated gradient blob */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-[radial-gradient(circle_farthest-side,rgba(59,130,246,0.15),rgba(255,255,255,0))] pointer-events-none"
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
              Powerful Dashboard, Simple Interface
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Manage your entire event from one beautiful, intuitive dashboard
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
            {/* Browser mockup */}
            <div className="relative mx-auto max-w-6xl">
              {/* Browser chrome */}
              <div className="bg-slate-800 rounded-t-xl p-3 flex items-center gap-2 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-slate-700 rounded px-3 py-1 text-xs text-slate-400 text-center">
                    app.lyventum.com/dashboard
                  </div>
                </div>
              </div>

              {/* Screenshot */}
              <div className="relative rounded-b-xl overflow-hidden shadow-2xl shadow-primary-500/20 ring-1 ring-slate-700">
                <img
                  src="/screenshots/dashboard.png"
                  alt="LyVenTum Dashboard"
                  className="w-full h-auto"
                />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 via-transparent to-transparent pointer-events-none"></div>
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
                className="absolute -right-4 top-1/4 bg-gradient-to-br from-primary-500 to-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
              >
                <div className="text-xs font-semibold">Real-time Updates</div>
                <div className="text-[10px] opacity-90">Sub-second refresh</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Mobile Scanner Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            {/* Text content */}
            <div className="order-2 md:order-1">
              <h3 className="text-3xl font-bold font-montserrat mb-4">
                Built for Mobile
              </h3>
              <p className="text-lg text-slate-300 mb-6">
                Scan QR codes, manage booths, and track attendance from any device. Our mobile-optimized interface works seamlessly on phones and tablets.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  </div>
                  <span>Lightning-fast QR code scanning</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  </div>
                  <span>Works offline with automatic sync</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  </div>
                  <span>Touch-optimized interface</span>
                </li>
              </ul>
            </div>

            {/* Phone mockup */}
            <div className="order-1 md:order-2 flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* Phone frame */}
                <div className="relative w-[280px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl shadow-primary-500/30 ring-1 ring-slate-700">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl"></div>

                  {/* Screen */}
                  <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-950">
                    <img
                      src="/screenshots/mobile-scanner.png"
                      alt="LyVenTum Mobile Scanner"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-green-500/20 blur-3xl -z-10"></div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-transparent to-primary-600/10" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/4 -right-20 w-[35rem] h-[35rem] bg-green-500/15 rounded-full blur-3xl"
        />
        {/* Animated light beam - increased visibility */}
        <motion.div
          animate={{
            x: ['200%', '-100%'],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-[80%] h-full pointer-events-none"
          style={{
            background: 'linear-gradient(270deg, transparent 0%, rgba(16, 185, 129, 0.12) 50%, transparent 100%)',
            filter: 'blur(40px)'
          }}
        />

        {/* Animated gradient blob for this section */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-0 -translate-x-1/2 w-[30rem] h-[30rem] bg-[radial-gradient(circle_farthest-side,rgba(59,130,246,0.15),rgba(255,255,255,0))] pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-0 translate-x-1/2 w-[35rem] h-[35rem] bg-[radial-gradient(circle_farthest-side,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none"
        />
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
                className={`relative flex items - center gap - 8 mb - 20 md: mb - 24 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} `}
              >
                {/* Number badge */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-green-500 flex items-center justify-center shadow-lg shadow-primary-500/50">
                    <span className="text-2xl font-bold">{step.number}</span>
                  </div>
                </div>

                {/* Content card */}
                <div className={`flex-1 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 ${index % 2 === 0 ? 'md:ml-8' : 'md:mr-8'}`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-primary-400">
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-bold font-montserrat">{step.title}</h3>
                  </div>
                  <p className="text-slate-300">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="relative py-24 md:py-32 px-4 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-primary-600/10" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[45rem] h-[45rem] bg-purple-500/12 rounded-full blur-3xl"
        />
        {/* Animated light beam sweeping - increased visibility */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "linear",
            delay: 3
          }}
          className="absolute top-0 left-0 w-[70%] h-full pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.1) 50%, transparent 100%)',
            filter: 'blur(50px)'
          }}
        />

        {/* Animated gradient blobs for pricing */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 -translate-y-1/2 w-[40rem] h-[40rem] bg-[radial-gradient(circle_farthest-side,rgba(168,85,247,0.1),rgba(255,255,255,0))] pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
          className="absolute bottom-0 right-1/4 translate-y-1/2 w-[38rem] h-[38rem] bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,0.12),rgba(255,255,255,0))] pointer-events-none"
        />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border backdrop-blur-xl
                           ${plan.isPopular
                    ? 'border-primary-500 bg-gradient-to-br from-primary-900/20 to-slate-900/40 shadow-2xl shadow-primary-500/20'
                    : 'border-slate-700 bg-gradient-to-br from-slate-800/40 to-slate-900/40'
                  }
                  hover:scale-105 transition-all duration-300`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="bg-gradient-to-r from-primary-500 to-green-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg"
                    >
                      <StarIcon className="w-3 h-3 inline mr-1" />
                      {t(localeKeys.mostPopular)}
                    </motion.span>
                  </div>
                )}

                <h3 className="text-2xl font-bold font-montserrat mb-2">{plan.name}</h3>
                <p className="text-slate-400 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-extrabold">{plan.price}</span>
                  <span className="text-lg font-medium text-slate-400 ml-2">{plan.priceSubtitle}</span>
                </div>

                <Link to={AppRoute.Login} className="block mb-6">
                  <Button
                    variant={plan.isPopular ? 'primary' : 'secondary'}
                    size="lg"
                    className="w-full group"
                  >
                    {plan.cta}
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      {feature.included ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-slate-200' : 'text-slate-500'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        {/* Subtle gradient background */}
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-green-900/10 pointer-events-none"
        />

        <div className="max-w-4xl mx-auto relative z-10">
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

          <div className="space-y-4">
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
                question: "What's included in the free trial?",
                answer: "The 14-day free trial includes full access to all features: unlimited scans, real-time analytics, booth management, and data export. No credit card required to start."
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
            <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
            <p className="text-slate-400 mb-4">
              Our team is here to help you get started
            </p>
            <a
              href="mailto:contact@lyventum.com"
              className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              contact@lyventum.com
            </a>
          </motion.div>
        </div>
      </section>

      {/* STRONG CTA SECTION */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Fancy gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-purple-600/10 to-green-600/20" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -left-20 w-72 h-72 bg-primary-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
        />

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
                onClick={() => navigate(AppRoute.Login)}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-lg px-10 py-4 group shadow-2xl shadow-primary-500/50 hover:shadow-primary-500/70 transition-all"
              >
                Start Free Trial
                <ArrowRightIcon className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                onClick={() => navigate(AppRoute.Login)}
                variant="neutral"
                size="lg"
                className="w-full sm:w-auto text-lg px-10 py-4"
              >
                Schedule a Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl px-4 py-16">
        {/* Footer gradient blob */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-[radial-gradient(circle_farthest-side,rgba(59,130,246,0.08),rgba(255,255,255,0))] pointer-events-none"
        />

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
                  href="mailto:contact@lyventum.com"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 group"
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
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 group"
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
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 group"
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
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 group"
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
                    Pricing
                  </a>
                </li>
                <li>
                  <Link to={AppRoute.ClientPortal} className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                    Event Portal
                  </Link>
                </li>
                <li>
                  <Link to={AppRoute.Login} className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                    Organizer Login
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
                href="mailto:contact@lyventum.com"
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact@lyventum.com
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
      </footer>
    </div>
  );
};

export default LandingPage;
