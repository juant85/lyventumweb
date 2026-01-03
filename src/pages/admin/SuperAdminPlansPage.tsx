// src/pages/admin/SuperAdminPlansPage.tsx
// Updated to use Feature Packages system instead of individual features
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { supabase } from '../../supabaseClient';
import { Database } from '../../database.types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { Settings, PlusCircle, PackageOpen, Check, X, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import { motion } from 'framer-motion';
import { Icon } from '../../components/ui/Icon';

type PlanRow = Database['public']['Tables']['plans']['Row'];
type FeaturePackageRow = Database['public']['Tables']['feature_packages']['Row'];

interface PlanWithPackages extends PlanRow {
    packages: FeaturePackageRow[];
}

// Package metadata for display
const PACKAGE_ICONS: Record<string, { icon: string; color: string }> = {
    booth_management_suite: { icon: 'booth', color: 'bg-blue-500' },
    session_conference_tools: { icon: 'calendar', color: 'bg-purple-500' },
    lead_capture_pro: { icon: 'fileText', color: 'bg-green-500' },
    analytics_reporting: { icon: 'chart', color: 'bg-orange-500' },
    attendee_portal_standard: { icon: 'user', color: 'bg-cyan-500' },
    gamification_engagement: { icon: 'award', color: 'bg-yellow-500' },
    live_operations: { icon: 'qrCode', color: 'bg-red-500' },
    communication_tools: { icon: 'mail', color: 'bg-indigo-500' },
    sponsorship_management: { icon: 'sponsor', color: 'bg-pink-500' }
};

const SuperAdminPlansPage: React.FC = () => {
    const [plans, setPlans] = useState<PlanWithPackages[]>([]);
    const [allPackages, setAllPackages] = useState<FeaturePackageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track which packages are selected for each plan being edited
    const [editingPlan, setEditingPlan] = useState<string | null>(null);
    const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
    const [savingPlan, setSavingPlan] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch plans with their packages
            const [plansRes, packagesRes] = await Promise.all([
                supabase.from('plans').select('*').order('name', { ascending: true }),
                supabase.from('feature_packages').select('*').order('name', { ascending: true })
            ]);

            if (plansRes.error) throw plansRes.error;
            if (packagesRes.error) throw packagesRes.error;

            // For each plan, fetch its packages
            const plansWithPackages: PlanWithPackages[] = await Promise.all(
                (plansRes.data || []).map(async (plan) => {
                    const { data: planPkgs } = await supabase
                        .from('plan_packages')
                        .select('package_id, feature_packages(*)')
                        .eq('plan_id', plan.id);

                    const packages = (planPkgs || [])
                        .map((pp: any) => pp.feature_packages)
                        .filter(Boolean) as FeaturePackageRow[];

                    return { ...plan, packages };
                })
            );

            setPlans(plansWithPackages);
            setAllPackages(packagesRes.data || []);

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
        const { error } = await supabase.from('plans').insert([{
            name: newPlanName,
            description: newPlanDesc
        }]);
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

    const startEditing = (plan: PlanWithPackages) => {
        setEditingPlan(plan.id);
        setSelectedPackages(new Set(plan.packages.map(p => p.id)));
    };

    const cancelEditing = () => {
        setEditingPlan(null);
        setSelectedPackages(new Set());
    };

    const togglePackage = (packageId: string) => {
        setSelectedPackages(prev => {
            const next = new Set(prev);
            if (next.has(packageId)) {
                next.delete(packageId);
            } else {
                next.add(packageId);
            }
            return next;
        });
    };

    const handleSavePackages = async (planId: string) => {
        setSavingPlan(planId);
        try {
            const plan = plans.find(p => p.id === planId);
            if (!plan) throw new Error('Plan not found');

            const originalPackageIds = new Set(plan.packages.map(p => p.id));
            const packagesToAdd = [...selectedPackages].filter(id => !originalPackageIds.has(id));
            const packagesToRemove = [...originalPackageIds].filter(id => !selectedPackages.has(id));

            // Remove packages
            if (packagesToRemove.length > 0) {
                const { error } = await supabase
                    .from('plan_packages')
                    .delete()
                    .eq('plan_id', planId)
                    .in('package_id', packagesToRemove);
                if (error) throw error;
            }

            // Add packages
            if (packagesToAdd.length > 0) {
                const { error } = await supabase
                    .from('plan_packages')
                    .insert(packagesToAdd.map(package_id => ({
                        plan_id: planId,
                        package_id
                    })));
                if (error) throw error;
            }

            toast.success('Plan packages updated successfully!');
            setEditingPlan(null);
            await fetchData();

        } catch (err: any) {
            toast.error(`Failed to update packages: ${err.message}`);
        } finally {
            setSavingPlan(null);
        }
    };

    const handleDeletePlan = async (plan: PlanRow) => {
        if (window.confirm(`Are you sure you want to delete the plan "${plan.name}"? This cannot be undone.`)) {
            // First delete plan_packages
            await supabase.from('plan_packages').delete().eq('plan_id', plan.id);

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
                                Manage subscription plans and their feature packages
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        leftIcon={<PlusCircle className="w-5 h-5" />}
                        disabled={loading}
                    >
                        <span className="hidden sm:inline">Create New Plan</span>
                        <span className="sm:hidden">Create</span>
                    </Button>
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
                            description="Get started by creating your first subscription plan. You can then assign feature packages to control what's available in each plan."
                            actionLabel="Create Your First Plan"
                            onAction={() => setIsCreateModalOpen(true)}
                        />
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {plans.map((plan, index) => {
                            const isEditing = editingPlan === plan.id;
                            const isSaving = savingPlan === plan.id;

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="overflow-hidden">
                                        {/* Plan Header */}
                                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                                    {plan.name}
                                                </h3>
                                                {plan.description && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {plan.description}
                                                    </p>
                                                )}
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {plan.packages.length} of {allPackages.length} packages active
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={cancelEditing}
                                                            disabled={isSaving}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => handleSavePackages(plan.id)}
                                                            disabled={isSaving}
                                                        >
                                                            {isSaving ? (
                                                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => startEditing(plan)}
                                                        >
                                                            Edit Packages
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            onClick={() => handleDeletePlan(plan)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Packages Grid */}
                                        <div className="p-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {allPackages.map((pkg) => {
                                                    const isActive = isEditing
                                                        ? selectedPackages.has(pkg.id)
                                                        : plan.packages.some(p => p.id === pkg.id);
                                                    const meta = PACKAGE_ICONS[pkg.key] || { icon: 'settings', color: 'bg-slate-500' };

                                                    return (
                                                        <div
                                                            key={pkg.id}
                                                            onClick={isEditing ? () => togglePackage(pkg.id) : undefined}
                                                            className={`
                                                                flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                                                                ${isEditing ? 'cursor-pointer' : ''}
                                                                ${isActive
                                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                                    : 'border-slate-200 dark:border-slate-700 opacity-50'
                                                                }
                                                                ${isEditing && !isActive ? 'hover:border-slate-300 hover:opacity-75' : ''}
                                                            `}
                                                        >
                                                            <div className={`w-10 h-10 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0`}>
                                                                <Icon name={meta.icon as any} className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm text-slate-800 dark:text-white truncate">
                                                                    {pkg.name}
                                                                </div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                    {pkg.features?.length || 0} features
                                                                </div>
                                                            </div>
                                                            {isActive && (
                                                                <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Info Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <div className="p-4">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            About Feature Packages
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Feature packages group related functionality together. When you assign a package to a plan,
                            all events using that plan will have access to those features. Each package contains multiple
                            individual features that work together.
                        </p>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default SuperAdminPlansPage;