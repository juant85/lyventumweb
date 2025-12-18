// src/pages/admin/SuperAdminPlansPage.tsx
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { supabase } from '../../supabaseClient';
import { Database } from '../../database.types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import PlanEditorCard from '../../components/plans/PlanEditorCard';
import EmptyState from '../../components/ui/EmptyState';
import { Settings, PlusCircle, PackageOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

type PlanRow = Database['public']['Tables']['plans']['Row'];
type FeatureRow = Database['public']['Tables']['features']['Row'];
type PlanWithFeatures = PlanRow & { features: FeatureRow[] };

const SuperAdminPlansPage: React.FC = () => {
    const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
    const [allFeatures, setAllFeatures] = useState<FeatureRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [plansRes, featuresRes] = await Promise.all([
                supabase.from('plans').select('*, plan_features(features(*))').order('name', { ascending: true }),
                supabase.from('features').select('*').order('name', { ascending: true })
            ]);

            if (plansRes.error) throw plansRes.error;
            if (featuresRes.error) throw featuresRes.error;

            const mappedPlans: PlanWithFeatures[] = ((plansRes.data as any[]) || []).map(p => ({
                ...p,
                features: (p.plan_features || []).map((pf: any) => pf.features).filter(Boolean)
            }));

            setPlans(mappedPlans);
            setAllFeatures(((featuresRes.data as unknown) as FeatureRow[]) || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreatePlan = async (e: FormEvent) => {
        e.preventDefault();
        if (!newPlanName.trim()) {
            toast.error("Plan name is required.");
            return;
        }
        setIsSubmitting(true);
        const { error } = await (supabase.from('plans') as any).insert([{ name: newPlanName, description: newPlanDesc }]);
        if (error) {
            toast.error(`Failed to create plan: ${error.message}`);
        } else {
            toast.success(`Plan "${newPlanName}" created successfully!`);
            setNewPlanName('');
            setNewPlanDesc('');
            setIsCreateModalOpen(false);
            fetchData();
        }
        setIsSubmitting(false);
    };

    const handleSavePlan = async (planId: string, featureIds: Set<string>) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) throw new Error('Plan not found');

        const originalFeatureIds = new Set(plan.features.map(f => f.id));

        const featuresToAdd = [...featureIds].filter(id => !originalFeatureIds.has(id));
        const featuresToRemove = [...originalFeatureIds].filter(id => !featureIds.has(id));

        const promises = [];
        if (featuresToAdd.length > 0) {
            promises.push((supabase.from('plan_features') as any).insert(featuresToAdd.map(feature_id => ({ plan_id: planId, feature_id }))));
        }
        if (featuresToRemove.length > 0) {
            promises.push((supabase.from('plan_features') as any).delete().eq('plan_id', planId).in('feature_id', featuresToRemove));
        }

        if (promises.length > 0) {
            const results = await Promise.all(promises);
            const errors = results.map(res => res.error).filter(Boolean);

            if (errors.length > 0) {
                throw new Error(errors.map((e: any) => e.message).join(', '));
            }
        }

        await fetchData();
    };

    const handleDeletePlan = async (plan: PlanRow) => {
        if (window.confirm(`Are you sure you want to delete the plan "${plan.name}"? This cannot be undone.`)) {
            const { error } = await supabase.from('plans').delete().eq('id', plan.id);
            if (error) {
                toast.error(`Failed to delete plan: ${error.message}`);
            } else {
                toast.success(`Plan "${plan.name}" deleted.`);
                fetchData();
            }
        }
    };

    const createModalFooter = (
        <div className="flex items-center gap-3">
            <Button type="button" variant="neutral" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                {t(localeKeys.cancel)}
            </Button>
            <Button type="submit" form="create-plan-form" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? t(localeKeys.adding) : 'Create Plan'}
            </Button>
        </div>
    );

    const cardTitleActions = (
        <Button
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<PlusCircle className="w-5 h-5" />}
            disabled={loading}
        >
            <span className="hidden sm:inline">Create New Plan</span>
            <span className="sm:hidden">Create</span>
        </Button>
    );

    return (
        <>
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Plan"
                footerContent={createModalFooter}
            >
                <form id="create-plan-form" onSubmit={handleCreatePlan} className="space-y-4">
                    <Input
                        label="Plan Name"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        required
                        disabled={isSubmitting}
                        autoFocus
                        placeholder="e.g., Premium, Enterprise, Basic"
                    />
                    <Input
                        label="Description (Optional)"
                        value={newPlanDesc}
                        onChange={(e) => setNewPlanDesc(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Brief description of this plan"
                    />
                </form>
            </Modal>

            <div className="space-y-6 pb-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Settings className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                                {t(localeKeys.superAdminPlansTitle)}
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Manage subscription plans and their features
                            </p>
                        </div>
                    </div>

                    <div className="sm:self-start">
                        {cardTitleActions}
                    </div>
                </div>

                {error && <Alert type="error" message={error} />}

                {/* Plans List */}
                {loading ? (
                    <Card>
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            <span className="ml-3 text-slate-600 dark:text-slate-300">{t(localeKeys.loading)}</span>
                        </div>
                    </Card>
                ) : plans.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={PackageOpen}
                            title="No Plans Yet"
                            description="Get started by creating your first subscription plan. You can then assign features to control what's available in each plan."
                            actionLabel="Create Your First Plan"
                            onAction={() => setIsCreateModalOpen(true)}
                        />
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {plans.map((plan, index) => (
                            <div
                                key={plan.id}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className="animate-slideIn"
                            >
                                <PlanEditorCard
                                    plan={plan}
                                    planFeatures={plan.features}
                                    allFeatures={allFeatures}
                                    onSave={handleSavePlan}
                                    onDelete={handleDeletePlan}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default SuperAdminPlansPage;