// src/components/plans/PlanSelector.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import PlanCard from './PlanCard';
import { Feature } from '../../features';
import { ArrowPathIcon } from '../Icons';

interface PlanSelectorProps {
    selectedPlanId: string;
    onPlanSelect: (planId: string) => void;
    className?: string;
}

interface PlanWithFeatures {
    id: string;
    name: string;
    description: string | null;
    features: Feature[];
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
    selectedPlanId,
    onPlanSelect,
    className = '',
}) => {
    const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlansWithFeatures = async () => {
            setLoading(true);

            // Fetch plans
            const { data: plansData, error: plansError } = await supabase
                .from('plans')
                .select('*')
                .order('name');

            if (plansError) {
                console.error('Error fetching plans:', plansError);
                setLoading(false);
                return;
            }

            // Fetch plan features
            const plansWithFeatures = await Promise.all(
                (plansData || []).map(async (plan) => {
                    const { data: featuresData } = await supabase
                        .from('plan_features')
                        .select('features(key)')
                        .eq('plan_id', plan.id);

                    const features = (featuresData || [])
                        .map((item: any) => item.features?.key as Feature)
                        .filter(Boolean);

                    return {
                        id: plan.id,
                        name: plan.name,
                        description: plan.description,
                        features,
                    };
                })
            );

            setPlans(plansWithFeatures);
            setLoading(false);
        };

        fetchPlansWithFeatures();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
                <span className="ml-3 text-slate-600 dark:text-slate-300">
                    Loading plans...
                </span>
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No plans available. Please contact your administrator.
            </div>
        );
    }

    // Determine recommended plan (most features, or middle option)
    const recommendedPlanIndex = Math.floor(plans.length / 2);

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
            {plans.map((plan, index) => (
                <PlanCard
                    key={plan.id}
                    plan={plan}
                    features={plan.features}
                    selected={selectedPlanId === plan.id}
                    recommended={index === recommendedPlanIndex && plans.length > 1}
                    onSelect={() => onPlanSelect(plan.id)}
                    showFeatureCount={5}
                />
            ))}
        </div>
    );
};

export default PlanSelector;
