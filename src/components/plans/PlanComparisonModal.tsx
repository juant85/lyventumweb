// src/components/plans/PlanComparisonModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Modal from '../ui/Modal';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '../Icons';
import { Feature } from '../../features';
import { getFeatureName, featureCategories } from '../../utils/featureHelpers';

interface PlanComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PlanWithFeatures {
    id: string;
    name: string;
    description: string | null;
    features: Set<Feature>;
}

const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({ isOpen, onClose }) => {
    const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchPlansWithFeatures();
        }
    }, [isOpen]);

    const fetchPlansWithFeatures = async () => {
        setLoading(true);

        // Fetch plans
        const { data: plansData, error: plansError } = await supabase
            .from('plans')
            .select('*')
            .order('name');

        if (plansError || !plansData) {
            setLoading(false);
            return;
        }

        // Fetch features for each plan
        const plansWithFeatures = await Promise.all(
            plansData.map(async (plan) => {
                const { data: featuresData } = await supabase
                    .from('plan_features')
                    .select('features(key)')
                    .eq('plan_id', plan.id);

                const features = new Set<Feature>(
                    (featuresData || [])
                        .map((item: any) => item.features?.key as Feature)
                        .filter(Boolean)
                );

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

    // Get all unique features across all plans
    const allFeatures = Object.values(featureCategories).flatMap(cat => cat.features);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Compare Plans"
            size="xl"
        >
            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Compare features across all available plans to find the best fit for your event.
                </p>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
                        <span className="ml-3 text-slate-600 dark:text-slate-300">
                            Loading comparison...
                        </span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            {/* Header */}
                            <thead>
                                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                                    <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-800 z-10">
                                        Feature
                                    </th>
                                    {plans.map(plan => (
                                        <th
                                            key={plan.id}
                                            className="text-center p-3 font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]"
                                        >
                                            <div className="text-base font-bold">{plan.name}</div>
                                            {plan.description && (
                                                <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
                                                    {plan.description}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* Body - Organized by category */}
                            <tbody>
                                {Object.entries(featureCategories).map(([categoryKey, category]) => (
                                    <React.Fragment key={categoryKey}>
                                        {/* Category Header */}
                                        <tr className="bg-slate-50 dark:bg-slate-700/30">
                                            <td
                                                colSpan={plans.length + 1}
                                                className="p-3 font-semibold text-slate-800 dark:text-slate-100 text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{category.icon}</span>
                                                    {category.name}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Features in this category */}
                                        {category.features.map(feature => (
                                            <tr
                                                key={feature}
                                                className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                                            >
                                                <td className="p-3 text-sm text-slate-700 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-800">
                                                    {getFeatureName(feature)}
                                                </td>
                                                {plans.map(plan => (
                                                    <td key={plan.id} className="text-center p-3">
                                                        {plan.features.has(feature) ? (
                                                            <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400 inline-block" />
                                                        ) : (
                                                            <XCircleIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 inline-block" />
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}

                                {/* Summary Row */}
                                <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-slate-200 dark:border-slate-700">
                                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-100 sticky left-0 bg-blue-50 dark:bg-blue-900/20">
                                        Total Features
                                    </td>
                                    {plans.map(plan => (
                                        <td
                                            key={plan.id}
                                            className="text-center p-3 font-bold text-primary-600 dark:text-primary-400"
                                        >
                                            {plan.features.size}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer Note */}
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                    <strong>Note:</strong> All plans include basic event management features.
                    Premium features enhance your event experience with advanced capabilities.
                </div>
            </div>
        </Modal>
    );
};

export default PlanComparisonModal;
