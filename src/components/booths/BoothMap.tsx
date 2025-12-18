import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Booth, BoothLayoutConfig, SessionRegistration, Attendee } from '../../types';
import { BoothCell } from './BoothCell';
import { groupBoothsByZone, getBoothStatus, DEFAULT_BOOTH_LAYOUT } from '../../utils/boothPositioning';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import { PencilSquareIcon, CheckCircleIcon, UserIcon, MagnifyingGlassIcon, ArrowRightIcon } from '../Icons';
import { useEventData } from '../../contexts/EventDataContext'; // NEW: For changedBoothIds
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import { BoothSummaryStats } from './BoothSummaryStats';

interface BoothMapProps {
    booths: Array<{ booth: Booth; attendeesCount: number; capacity: number }>;
    config?: BoothLayoutConfig;
    onBoothClick: (booth: Booth) => void;
    onSaveLayout?: (newConfig: BoothLayoutConfig) => void;
    compact?: boolean;
    sessionRegistrations?: SessionRegistration[];
    attendees?: Attendee[];
}

export const BoothMap: React.FC<BoothMapProps> = ({
    booths,
    config = DEFAULT_BOOTH_LAYOUT,
    onBoothClick,
    onSaveLayout,
    compact = false,
    sessionRegistrations = [],
    attendees = [],
}) => {
    const { changedBoothIds } = useEventData(); // NEW: Get changed booth IDs
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [localConfig, setLocalConfig] = useState<BoothLayoutConfig>(config);
    const [showMissingModal, setShowMissingModal] = useState(false);

    // Use ref to track editing state persistently across re-renders
    const isEditingRef = React.useRef(false);

    // Wrapper to sync both state and ref
    const setEditingState = (value: boolean) => {
        console.log(`🔧 Setting edit state to: ${value}`);
        isEditingRef.current = value;
        setIsEditing(value);
    };

    // Snapshot of state when entering edit mode - FROZEN during editing
    const editSnapshotRef = React.useRef<{
        config: BoothLayoutConfig;
        zones: any;
    } | null>(null);

    // Track if we're in the middle of a drag operation
    const isDraggingRef = React.useRef(false);

    // Sync with prop ONLY when not editing
    useEffect(() => {
        if (!isEditingRef.current) {
            console.log('🔍 BoothMap useEffect - Syncing localConfig with prop:', config);
            setLocalConfig(config);
        } else {
            console.log('⏸️ BoothMap useEffect - IGNORING prop change (editing mode active)');
        }
    }, [config]);

    // Calculate zones from config - ONLY recalculate when not editing
    const calculatedZones = useMemo(() => {
        // If editing, return the frozen snapshot
        if (isEditingRef.current && editSnapshotRef.current) {
            console.log('📸 Using frozen snapshot zones');
            return editSnapshotRef.current.zones;
        }

        console.log('🔍 BoothMap useMemo - Recalculating zones');
        return groupBoothsByZone(
            booths.map(b => ({
                booth: b.booth,
                current: b.attendeesCount,
                expected: b.capacity,
            })),
            localConfig.customOrder
        );
    }, [booths, localConfig.customOrder]);

    // Local state for reordering - this is what gets updated during drag
    const [zones, setZones] = useState<ReturnType<typeof groupBoothsByZone>>(calculatedZones);

    // Sync zones with calculated zones ONLY when not editing
    useEffect(() => {
        if (!isEditingRef.current) {
            console.log('🔄 BoothMap useEffect - Syncing zones');
            setZones(calculatedZones);
        } else {
            console.log('⏸️ BoothMap useEffect - IGNORING zone sync (editing mode active)');
        }
    }, [calculatedZones]);

    // Optimized onDragEnd with useCallback to prevent re-creation on every render
    const onDragEnd = useCallback((result: DropResult) => {
        // Mark drag as finished
        isDraggingRef.current = false;

        const { source, destination } = result;

        // Dropped outside any droppable area
        if (!destination) {
            return;
        }

        // No movement - dropped in same position
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const sourceZone = source.droppableId;
        const destZone = destination.droppableId;

        setZones(currentZones => {
            // FIXED: Always create new arrays to avoid mutation bugs
            const sourceItems = Array.from(currentZones[sourceZone]);
            const destItems = sourceZone === destZone
                ? sourceItems  // Same zone: use same array reference
                : Array.from(currentZones[destZone]); // Different zones: create new array

            // Remove item from source position
            const [movedItem] = sourceItems.splice(source.index, 1);

            // Add item to destination position
            if (sourceZone === destZone) {
                // Same zone: insert in new position in the same array
                sourceItems.splice(destination.index, 0, movedItem);
            } else {
                // Different zones: insert in destination array
                destItems.splice(destination.index, 0, movedItem);
            }

            // New zones state
            const newZones = {
                ...currentZones,
                [sourceZone]: sourceItems,
                ...(sourceZone !== destZone && { [destZone]: destItems })
            };

            // AUTO-SAVE: Save immediately after drag to prevent data loss
            console.log('💾 Auto-saving after drag...');
            const newCustomOrder = { ...(localConfig.customOrder || {}) };
            Object.keys(newZones).forEach(zoneKey => {
                newCustomOrder[zoneKey] = newZones[zoneKey].map(item => item.booth.id);
            });

            const finalConfig = {
                ...localConfig,
                customOrder: newCustomOrder
            };

            // Call parent save handler
            if (onSaveLayout) {
                onSaveLayout(finalConfig);
            }

            // Return new state object
            return newZones;
        });
    }, [localConfig, onSaveLayout]);

    const handleSave = () => {
        // Construct new config from current zones state
        const newCustomOrder = { ...(localConfig.customOrder || {}) };

        // Update all zones in customOrder to reflect current state
        Object.keys(zones).forEach(zoneKey => {
            newCustomOrder[zoneKey] = zones[zoneKey].map(item => item.booth.id);
        });

        const finalConfig = {
            ...localConfig,
            customOrder: newCustomOrder
        };

        console.log('🔍 BoothMap handleSave - Saving config:', finalConfig);
        console.log('🔍 BoothMap handleSave - Current zones:', zones);

        // Don't update local config here - let the parent handle it via props
        // This prevents triggering useEffect and exiting edit mode prematurely
        // setLocalConfig(finalConfig);

        // Call parent save handler
        if (onSaveLayout) {
            onSaveLayout(finalConfig);
        }

        // Clear snapshot and exit editing mode
        console.log('🗑️ Clearing snapshot');
        editSnapshotRef.current = null;
        setEditingState(false);
    };

    const renderZone = (zone: keyof typeof zones) => {
        const zoneBooths = zones[zone];
        const isHorizontal = zone === 'top-wall';

        if (isEditing) {
            return (
                <Droppable droppableId={zone} direction={isHorizontal ? "horizontal" : "vertical"}>
                    {(provided, snapshot) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`relative flex ${isHorizontal ? 'flex-row flex-wrap justify-center' : 'flex-col'} gap-2 min-h-[100px] p-3 rounded-xl transition-all duration-200 ease-out ${snapshot.isDraggingOver
                                ? 'border-[3px] border-primary-500 bg-primary-100 dark:bg-primary-900/40 shadow-lg ring-2 ring-primary-300 dark:ring-primary-700'
                                : 'border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500'
                                }`}
                            style={{
                                willChange: 'opacity, border-color, box-shadow'
                            }}
                        >
                            {zoneBooths.map((data, index) => (
                                <Draggable key={data.booth.id} draggableId={data.booth.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`${isHorizontal ? 'w-auto' : 'w-full'}`}
                                            style={{
                                                ...provided.draggableProps.style,
                                                cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                                // Center under cursor using position offset
                                                ...(snapshot.isDragging && {
                                                    position: 'relative',
                                                    top: '-10px',
                                                    left: '0px'      // Moved to 0 to align with cursor
                                                })
                                            }}
                                        >
                                            <div className={`
                                                transition-shadow duration-150 ease-out h-full
                                                ${snapshot.isDragging
                                                    ? 'shadow-2xl opacity-95 ring-4 ring-primary-500/60 dark:ring-primary-400/60 rounded-lg bg-white dark:bg-slate-800'
                                                    : 'hover:shadow-md'
                                                }
                                            `}>
                                                <BoothCell
                                                    booth={data.booth}
                                                    current={data.current}
                                                    expected={data.expected}
                                                    status={getBoothStatus(data.current, data.expected)}
                                                    onClick={() => { }} // Disable click in edit mode
                                                    compact={compact}
                                                    isDraggable={true}
                                                    isRecentlyChanged={changedBoothIds.has(data.booth.id)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            {zoneBooths.length === 0 && (
                                <div className="text-center absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="text-4xl mb-2 opacity-30">⬇️</div>
                                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {t(localeKeys.dragBoothsHere)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            );
        }

        return (
            <div className={`flex ${isHorizontal ? 'flex-row flex-wrap justify-center' : 'flex-col'} gap-2`}>
                {zoneBooths.map(data => (
                    <div key={data.booth.id} className={isHorizontal ? 'w-auto' : 'w-full'}>
                        <BoothCell
                            booth={data.booth}
                            current={data.current}
                            expected={data.expected}
                            status={getBoothStatus(data.current, data.expected)}
                            onClick={() => onBoothClick(data.booth)}
                            compact={compact}
                            isRecentlyChanged={changedBoothIds.has(data.booth.id)}
                        />
                    </div>
                ))}
            </div>
        );
    };

    const [zoom, setZoom] = useState(0.85);

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setZoom(parseFloat(e.target.value));
    };

    return (
        <div className="booth-map-container">
            {/* CSS Animations for Drag & Drop */}
            <style>{`
                @keyframes pulse-subtle {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.92;
                        transform: scale(1.005);
                    }
                }
                
                @keyframes booth-lift {
                    from {
                        transform: translateY(0);
                    }
                    to {
                        transform: translateY(-8px);
                    }
                }
            `}</style>

            {/* Live Status Counter - Responsive */}
            {!isEditing && <BoothSummaryStats booths={booths} />}

            {/* Quick Access: Attendee Locator - Responsive */}
            {!isEditing && (() => {
                const emptyBooths = booths.filter(b => b.attendeesCount === 0).length;
                if (emptyBooths === 0) return null;

                return (
                    <Link to="/attendee-locator" className="block mb-4">
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-700 hover:shadow-lg hover:border-red-300 dark:hover:border-red-600 transition-all cursor-pointer group">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-800/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                        <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300">
                                            {t(localeKeys.searchMissingPeople)}
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-red-600 dark:text-red-400">
                                            {emptyBooths} {emptyBooths > 1 ? t(localeKeys.booth_plural) : t(localeKeys.booth_singular)} {emptyBooths > 1 ? t(localeKeys.require) : t(localeKeys.requires)} {t(localeKeys.immediateAttention)}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                            </div>
                        </div>
                    </Link>
                );
            })()}

            {/* Header with Quick Actions */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {t(localeKeys.boothMapTitle)}
                        {onSaveLayout && (
                            <div className="flex gap-2">
                                {isEditing && (
                                    <Button
                                        size="sm"
                                        variant="neutral"
                                        onClick={() => {
                                            if (window.confirm(t(localeKeys.confirmResetLayout))) {
                                                const resetConfig = { ...localConfig, customOrder: undefined };
                                                setLocalConfig(resetConfig);
                                                // Force update zones immediately
                                                const resetGrouped = groupBoothsByZone(
                                                    booths.map(b => ({
                                                        booth: b.booth,
                                                        current: b.attendeesCount,
                                                        expected: b.capacity,
                                                    })),
                                                    undefined
                                                );
                                                setZones(resetGrouped);
                                            }
                                        }}
                                    >
                                        {t(localeKeys.resetLayout)}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant={isEditing ? "primary" : "neutral"}
                                    onClick={isEditing ? handleSave : () => {
                                        // Take snapshot before entering edit mode
                                        console.log('📸 Taking snapshot before edit');
                                        editSnapshotRef.current = {
                                            config: localConfig,
                                            zones: zones
                                        };
                                        setEditingState(true);
                                    }}
                                    leftIcon={isEditing ? <CheckCircleIcon className="w-3 h-3" /> : <PencilSquareIcon className="w-3 h-3" />}
                                >
                                    {isEditing ? t(localeKeys.saveOrder) : t(localeKeys.editOrder)}
                                </Button>
                            </div>
                        )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isEditing ? t(localeKeys.dragBoothsInstructions) : t(localeKeys.clickBoothDetails)}
                    </p>
                </div>

                {/* Controls: Legend + Zoom - Responsive */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
                    {/* Zoom Control - Touch-friendly */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-500 font-medium">{t(localeKeys.zoom)}</span>
                        <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.1"
                            value={zoom}
                            onChange={handleZoomChange}
                            className="flex-1 sm:w-32 h-2 sm:h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            style={{ minHeight: '8px' }}
                        />
                        <span className="text-xs text-slate-500 w-10 sm:w-8 text-right">{Math.round(zoom * 100)}%</span>
                    </div>

                    {/* Legend */}
                    {!isEditing && (
                        <div className="flex gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-gradient-to-br from-red-500 to-red-600 animate-pulse" />
                                <span className="text-slate-600 dark:text-slate-400">{t(localeKeys.empty)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-gradient-to-br from-amber-400 to-amber-500" />
                                <span className="text-slate-600 dark:text-slate-400">{t(localeKeys.partial)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-gradient-to-br from-green-500 to-green-600" />
                                <span className="text-slate-600 dark:text-slate-400">Completo</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Map Grid Container with Overflow handling */}
            <div className="overflow-auto p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                <DragDropContext
                    onDragStart={() => { isDraggingRef.current = true; }}
                    onDragEnd={onDragEnd}
                >
                    <div
                        className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 origin-top-left"
                        style={{ zoom: zoom }}
                    >
                        {/* Top Wall (if configured or has booths) */}
                        {((localConfig.customOrder?.['top-wall']?.length || 0) > 0 || isEditing) && (
                            <div className="flex justify-center gap-1.5 mb-4 sm:mb-6">
                                <div className={isEditing ? "min-w-[180px]" : ""}>
                                    {isEditing && <div className="text-xs font-bold text-center mb-1 text-slate-400">{t(localeKeys.topWall)}</div>}
                                    {renderZone('top-wall')}
                                </div>
                            </div>
                        )}

                        {/* Main Layout - Responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
                        <div className="
                            grid gap-3
                            grid-cols-1
                            sm:grid-cols-2 sm:gap-4
                            lg:grid-cols-[auto_auto_auto_auto] lg:gap-x-0 lg:gap-y-1.5
                            max-w-full sm:max-w-3xl lg:max-w-5xl mx-auto
                        ">
                            {/* Left Wall + Aisle */}
                            <div className="flex flex-col gap-1.5 lg:pr-6 lg:border-r-2 lg:border-dashed lg:border-slate-300 dark:lg:border-slate-600">
                                {isEditing && <div className="text-xs font-bold text-center mb-1 text-slate-400">{t(localeKeys.leftWall)}</div>}
                                {renderZone('left-wall')}
                            </div>

                            {/* Center Left */}
                            <div className="flex flex-col gap-1.5 lg:px-1.5">
                                {isEditing && <div className="text-xs font-bold text-center mb-1 text-slate-400">{t(localeKeys.centerLeft)}</div>}
                                {renderZone('center-left')}
                            </div>

                            {/* Center Right */}
                            <div className="flex flex-col gap-1.5 lg:px-1.5">
                                {isEditing && <div className="text-xs font-bold text-center mb-1 text-slate-400">{t(localeKeys.centerRight)}</div>}
                                {renderZone('center-right')}
                            </div>

                            {/* Right Wall + Aisle */}
                            <div className="flex flex-col gap-1.5 lg:pl-6 lg:border-l-2 lg:border-dashed lg:border-slate-300 dark:lg:border-slate-600">
                                {isEditing && <div className="text-xs font-bold text-center mb-1 text-slate-400">{t(localeKeys.rightWall)}</div>}
                                {renderZone('right-wall')}
                            </div>
                        </div>

                        {/* Aisle Labels */}
                        {!compact && !isEditing && (
                            <div className="flex justify-between px-12 mt-6 text-[11px] text-slate-500 dark:text-slate-400">
                                <div>← {t(localeKeys.aisle)} 1</div>
                                <div>{t(localeKeys.aisle)} 2 →</div>
                            </div>
                        )}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
};
