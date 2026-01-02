import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import haptics from '../../utils/haptics';
import { GripVertical } from 'lucide-react';

interface QuickActionCard {
    id: string;
    title: string;
    icon: React.ReactNode;
    onClick: () => void;
}

interface DraggableQuickActionsProps {
    cards: QuickActionCard[];
    onReorder?: (cards: QuickActionCard[]) => void;
}

// Individual draggable card
function SortableCard({ card }: { card: QuickActionCard }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-3">
            <motion.div
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 shadow-sm"
            >
                <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="touch-none cursor-grab active:cursor-grabbing p-2 -m-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        aria-label="Drag to reorder"
                    >
                        <GripVertical className="w-5 h-5" />
                    </button>

                    {/*  Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        {card.icon}
                    </div>

                    {/* Title */}
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            {card.title}
                        </h3>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * Draggable Quick Actions Component
 * Allows users to reorder dashboard quick action cards
 * Premium feature like Notion, Trello
 */
const DraggableQuickActions: React.FC<DraggableQuickActionsProps> = ({ cards: initialCards, onReorder }) => {
    const [cards, setCards] = useState(initialCards);
    const [isEditMode, setIsEditMode] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setCards((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                haptics.medium(); // Haptic feedback
                onReorder?.(newOrder);

                return newOrder;
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Edit Mode Toggle */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Quick Actions
                </h3>
                <button
                    onClick={() => {
                        haptics.selection();
                        setIsEditMode(!isEditMode);
                    }}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${isEditMode
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                >
                    {isEditMode ? 'Done' : 'Customize'}
                </button>
            </div>

            {isEditMode ? (
                // Edit Mode: Draggable cards
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {cards.map((card) => (
                            <SortableCard key={card.id} card={card} />
                        ))}
                    </SortableContext>
                </DndContext>
            ) : (
                // Normal Mode: Clickable cards
                <div className="space-y-3">
                    {cards.map((card) => (
                        <motion.button
                            key={card.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                haptics.light();
                                card.onClick();
                            }}
                            className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                {card.icon}
                            </div>
                            <h3 className="flex-1 text-left font-semibold text-slate-900 dark:text-white">
                                {card.title}
                            </h3>
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DraggableQuickActions;
