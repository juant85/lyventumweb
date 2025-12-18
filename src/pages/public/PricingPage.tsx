// src/pages/public/PricingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AppRoute } from '../../types';
import Button from '../../components/ui/Button';
import { CheckCircleIcon, XCircleIcon } from '../../components/Icons';
import LyVentumLogo from '../../components/Logo';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

const PricingPage: React.FC = () => {
    const { t } = useLanguage();

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
                { text: t(localeKeys.plans.features[7]), included: false },
                { text: t(localeKeys.plans.features[8]), included: false },
                { text: t(localeKeys.plans.features[9]), included: false },
                { text: t(localeKeys.plans.features[10]), included: false },
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
                { text: t(localeKeys.plans.features[7]), included: false },
                { text: t(localeKeys.plans.features[8]), included: false },
                { text: t(localeKeys.plans.features[9]), included: false },
                { text: t(localeKeys.plans.features[10]), included: false },
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
        <div className="bg-slate-900 text-white min-h-screen">
             <header className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to={AppRoute.Landing}>
                        <LyVentumLogo className="h-10 w-auto" variant="light" />
                    </Link>
                    <Link to={AppRoute.Login}>
                        <Button variant="neutral" size="sm">
                            {t(localeKeys.organizerLogin)}
                        </Button>
                    </Link>
                </div>
            </header>
            <main className="container mx-auto px-4 py-24 sm:py-32">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-6xl font-bold font-montserrat brand-gradient-text">
                        {t(localeKeys.pricingTitle)}
                    </h1>
                    <p className="mt-6 text-lg text-slate-300">
                        {t(localeKeys.pricingSubtitle)}
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative p-8 rounded-2xl border ${plan.isPopular ? 'border-primary-500' : 'border-slate-700'}`}>
                             {plan.isPopular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-primary-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</span>
                                </div>
                            )}
                            <h2 className="text-2xl font-bold font-montserrat">{plan.name}</h2>
                            <p className="mt-4 text-slate-400">{plan.description}</p>
                            <div className="mt-8">
                                <span className="text-4xl font-extrabold">{plan.price}</span>
                                <span className="text-lg font-medium text-slate-400 ml-2">{plan.priceSubtitle}</span>
                            </div>
                            <Link to={AppRoute.Login} className="w-full block mt-8">
                                <Button variant={plan.isPopular ? 'primary' : 'secondary'} size="lg" className="w-full">
                                    {plan.cta}
                                </Button>
                            </Link>
                            <ul className="mt-8 space-y-4">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        {feature.included ? (
                                            <CheckCircleIcon className="w-5 h-5 text-secondary-400 flex-shrink-0" />
                                        ) : (
                                            <XCircleIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                        )}
                                        <span className={`${feature.included ? 'text-slate-200' : 'text-slate-500'}`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default PricingPage;