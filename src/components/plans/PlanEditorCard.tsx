// src/components/plans/PlanEditorCard.tsx
import React, { useState, useMemo } from 'react';
import { Database } from '../../database.types';
import { Feature } from '../../features';
import { featureCategories } from '../../utils/featureHelpers';
import FeatureCategorySection from './FeatureCategorySection';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ChevronDown, ChevronUp, Edit2, Trash2, Search, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

type FeatureRow = Database['public']['Tables']['features']['Row'];
type PlanRow = Database['public']['Tables']['plans']['Row'];

interface PlanEditorCardProps {
    plan: PlanRow;
    planFeatures: FeatureRow[];
    allFeatures: FeatureRow[]; // All available features from DB for mapping
    onSave: (planId: string, featureIds: Set<string>) => Promise<void>;
    onDelete: (plan: PlanRow) => Promise<void>;
}


const PlanEditorCard: React.FC<PlanEditorCardProps> = ({
    plan,
    planFeatures,
    allFeatures,
    onSave,
    onDelete
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editableFeatures, setEditableFeatures] = useState<Set<string>>(
        new Set(planFeatures.map(f => f.id))
    );

    // Create mapping from Feature enum to UUID
    const featureEnumToId = useMemo(() => {
        const map = new Map<Feature, string>();
        allFeatures.forEach(feature => {
            map.set(feature.key as Feature, feature.id);
        });
        return map;
    }, [allFeatures]);

    // Create reverse mapping from UUID to Feature enum
    const featureIdToEnum = useMemo(() => {
        const map = new Map<string, Feature>();
        allFeatures.forEach(feature => {
            map.set(feature.id, feature.key as Feature);
        });
        return map;
    }, [allFeatures]);

    const hasChanges = useMemo(() => {
        const originalIds = new Set(planFeatures.map(f => f.id));
        if (originalIds.size !== editableFeatures.size) return true;

        for (const id of editableFeatures) {
            if (!originalIds.has(id)) return true;
        }
        return false;
    }, [editableFeatures, planFeatures]);

    const totalFeatures = useMemo(() => {
        // Use actual count from database instead of featureCategories
        return allFeatures.length;
    }, [allFeatures]);

    const handleToggleExpand = () => {
        if (isEditing && hasChanges) {
            if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
            setEditableFeatures(new Set(planFeatures.map(f => f.id)));
        }
        setIsExpanded(!isExpanded);
        setIsEditing(false);
        setSearchQuery('');
    };

    const handleStartEdit = () => {
        setIsEditing(true);
        if (!isExpanded) {
            setIsExpanded(true);
        }
    };

    const handleCancelEdit = () => {
        if (hasChanges) {
            if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }
        setEditableFeatures(new Set(planFeatures.map(f => f.id)));
        setIsEditing(false);
        setSearchQuery('');
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(plan.id, editableFeatures);
            setIsEditing(false);
            toast.success('Plan updated successfully!');
        } catch (error: any) {
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleFeature = (feature: Feature) => {
        // Convert Feature enum to UUID
        const featureId = featureEnumToId.get(feature);
        if (!featureId) {
            console.error(`Feature ${feature} not found in database`);
            return;
        }

        setEditableFeatures(prev => {
            const newSet = new Set(prev);
            if (newSet.has(featureId)) {
                newSet.delete(featureId);
            } else {
                newSet.add(featureId);
            }
            return newSet;
        });
    };

    const enabledCount = editableFeatures.size;
    const progressPercent = Math.round((enabledCount / totalFeatures) * 100);

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl border-2 
                transition-all duration-300 ease-out
                ${isExpanded
                    ? 'bg-white dark:bg-slate-800 border-primary-300 dark:border-primary-700 shadow-lg'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                }
            `}
        >
            {/* Header - Always Visible */}
            <div
                className={`
                    p-4 sm:p-6 cursor-pointer
                    ${isExpanded ? 'border-b border-slate-200 dark:border-slate-700' : ''}
                `}
                onClick={() => !isEditing && handleToggleExpand()}
            >
                <div className="flex items-start justify-between gap-4">
                    {/* Left: Plan Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                                {plan.name}
                            </h3>
                            {isExpanded && (
                                <button
                                    onClick={handleToggleExpand}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-500" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-500" />
                                    )}
                                </button>
                            )}
                        </div>

                        {plan.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                                {plan.description}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                <span className="text-primary-600 dark:text-primary-400 font-bold">{enabledCount}</span>
                                <span className="text-slate-500 dark:text-slate-400">/{totalFeatures}</span> features
                            </span>

                            {/* Progress Bar */}
                            <div className="flex-1 min-w-[100px] max-w-[200px]">
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {progressPercent}%
                            </span>
                        </div>

                        {hasChanges && isEditing && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Unsaved changes
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
                        {!isEditing ? (
                            <>
                                <Button
                                    size="sm"
                                    variant="neutral"
                                    onClick={handleStartEdit}
                                    leftIcon={<Edit2 className="w-4 h-4" />}
                                    className="hidden sm:flex"
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="neutral"
                                    onClick={handleStartEdit}
                                    className="sm:hidden p-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="accent"
                                    onClick={() => onDelete(plan)}
                                    leftIcon={<Trash2 className="w-4 h-4" />}
                                    className="hidden sm:flex"
                                >
                                    Delete
                                </Button>
                                <Button
                                    size="sm"
                                    variant="accent"
                                    onClick={() => onDelete(plan)}
                                    className="sm:hidden p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    size="sm"
                                    variant="neutral"
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    leftIcon={<X className="w-4 h-4" />}
                                    className="hidden sm:flex"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    variant="neutral"
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    className="sm:hidden p-2"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={handleSave}
                                    disabled={!hasChanges || isSaving}
                                    leftIcon={<Save className="w-4 h-4" />}
                                    className="hidden sm:flex"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={handleSave}
                                    disabled={!hasChanges || isSaving}
                                    className="sm:hidden p-2"
                                >
                                    <Save className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-4 sm:p-6 space-y-4 animate-slideDown">
                    {/* Search Bar */}
                    {isEditing && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search features..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    )}

                    {/* Feature Categories */}
                    <div className="space-y-4">
                        {Object.values(featureCategories).map(category => (
                            <FeatureCategorySection
                                key={category.name}
                                category={category}
                                enabledFeatures={editableFeatures}
                                allFeatures={allFeatures}
                                onToggleFeature={handleToggleFeature}
                                disabled={!isEditing}
                                searchQuery={searchQuery}
                            />
                        ))}
                    </div>

                    {/* Empty State for Search */}
                    {searchQuery && Object.values(featureCategories).every(cat =>
                        cat.features.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase())).length === 0
                    ) && (
                            <div className="text-center py-8">
                                <p className="text-slate-500 dark:text-slate-400">
                                    No features found matching "<strong>{searchQuery}</strong>"
                                </p>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

export default PlanEditorCard;
