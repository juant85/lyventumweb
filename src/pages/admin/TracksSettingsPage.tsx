// src/pages/admin/TracksSettingsPage.tsx
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { Icon } from '../../components/ui';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon } from '../../components/Icons';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Database } from '../../database.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

type Track = Database['public']['Tables']['event_tracks']['Row'];

const PREDEFINED_COLORS = ['#3b82f6', '#16a34a', '#f97316', '#e11d48', '#8b5cf6', '#06b6d4', '#f59e0b', '#64748b', '#ec4899', '#1d4ed8', '#047857', '#991b1b'];

const TracksSettingsPage: React.FC = () => {
    const { selectedEventId, currentEvent } = useSelectedEvent();
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const [editingTrack, setEditingTrack] = useState<Partial<Track> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: tracks, isLoading: isLoadingTracks, error: tracksError } = useQuery({
        queryKey: ['tracks', selectedEventId],
        queryFn: async () => {
            if (!selectedEventId) return [];
            const { data, error } = await supabase
                .from('event_tracks')
                .select('*')
                .eq('event_id', selectedEventId)
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!selectedEventId,
    });

    const mutation = useMutation({
        mutationFn: async (trackData: Partial<Track>) => {
            if (!selectedEventId) throw new Error("No event selected.");
            
            if (trackData.id) { // Update
                const payload: Database['public']['Tables']['event_tracks']['Update'] = {
                    name: trackData.name!,
                    slug: trackData.slug!,
                    color: trackData.color,
                    sort_order: trackData.sort_order,
                    active: trackData.active,
                };
                const { data, error } = await supabase.from('event_tracks').update(payload).eq('id', trackData.id).select().single();
                if (error) throw error;
                return data;
            } else { // Create
                const payload: Database['public']['Tables']['event_tracks']['Insert'] = {
                    event_id: selectedEventId,
                    name: trackData.name!,
                    slug: trackData.slug!,
                    color: trackData.color,
                    sort_order: trackData.sort_order,
                    active: trackData.active ?? true,
                };
                const { data, error } = await supabase.from('event_tracks').insert(payload).select().single();
                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            toast.success('Track saved successfully!');
            queryClient.invalidateQueries({ queryKey: ['tracks', selectedEventId] });
            setEditingTrack(null);
        },
        onError: (error) => {
            toast.error(`Failed to save track: ${error.message}`);
        },
        onSettled: () => {
            setIsSubmitting(false);
        }
    });
    
    const deleteMutation = useMutation({
        mutationFn: async (trackId: string) => {
            const { error } = await supabase.from('event_tracks').delete().eq('id', trackId);
            if(error) throw error;
        },
        onSuccess: () => {
            toast.success('Track deleted.');
            queryClient.invalidateQueries({ queryKey: ['tracks', selectedEventId] });
        },
        onError: (error) => {
            toast.error(`Failed to delete track: ${error.message}`);
        }
    });

    const handleOpenModal = (track: Partial<Track> | null = null) => {
        if (track) {
            setEditingTrack(track);
        } else {
            setEditingTrack({ name: '', slug: '', color: PREDEFINED_COLORS[0], sort_order: (tracks?.length || 0) + 1, active: true });
        }
    };

    const handleSaveTrack = (e: FormEvent) => {
        e.preventDefault();
        if (!editingTrack || !editingTrack.name?.trim()) {
            toast.error("Name is required.");
            return;
        }
        
        const slug = editingTrack.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const trackToSave = { ...editingTrack, slug };

        setIsSubmitting(true);
        mutation.mutate(trackToSave);
    };

    const handleDeleteTrack = (track: Track) => {
        if (window.confirm(`Are you sure you want to delete the track "${track.name}"?`)) {
            deleteMutation.mutate(track.id);
        }
    }

    const modalFooter = (
        <div className="flex items-center gap-3">
            <Button type="button" variant="neutral" onClick={() => setEditingTrack(null)} disabled={isSubmitting}>{t(localeKeys.cancel)}</Button>
            <Button type="submit" form="track-form" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? t(localeKeys.saving) : 'Save Track'}
            </Button>
        </div>
    );

    if (!selectedEventId) {
        return <Alert type="warning" message="Please select an event to manage its tracks." />;
    }

    return (
        <>
        <Modal 
            isOpen={!!editingTrack} 
            onClose={() => setEditingTrack(null)} 
            title={editingTrack?.id ? `Edit Track: ${editingTrack.name}` : 'Create New Track'}
            footerContent={modalFooter}
        >
            {editingTrack && (
                <form id="track-form" onSubmit={handleSaveTrack} className="space-y-4">
                    <Input label="Track Name" value={editingTrack.name || ''} onChange={e => setEditingTrack(p => ({...p, name: e.target.value}))} required autoFocus />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Color</label>
                        <div className="flex flex-wrap gap-3 items-center">
                            {PREDEFINED_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ${editingTrack.color === color ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-slate-800' : 'ring-1 ring-inset ring-black/10'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setEditingTrack(p => ({...p, color: color}))}
                                    aria-label={`Select color ${color}`}
                                />
                            ))}
                            <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center transition-transform hover:scale-110" title="Custom Color">
                                <input
                                    type="color"
                                    value={editingTrack.color || '#ffffff'}
                                    onChange={e => setEditingTrack(p => ({...p, color: e.target.value}))}
                                    className="absolute inset-0 w-full h-full p-0 border-none opacity-0 cursor-pointer"
                                />
                                <div className="w-6 h-6 rounded-full" style={{ background: `conic-gradient(from 180deg at 50% 50%, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)` }}></div>
                            </div>
                        </div>
                    </div>
                    <Input label="Sort Order" type="number" value={editingTrack.sort_order || 0} onChange={e => setEditingTrack(p => ({...p, sort_order: parseInt(e.target.value, 10)}))}/>
                </form>
            )}
        </Modal>

        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat">
                <Icon name="grid" className="w-8 h-8 mr-3 text-brandBlue" />
                {t(localeKeys.tracksPageTitle)} for {currentEvent?.name || '...'}
            </h1>
            
            {tracksError && <Alert type="error" message={tracksError.message} />}

            <Card 
                title="Event Tracks" 
                titleActions={<Button onClick={() => handleOpenModal()} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>Create Track</Button>}
            >
                {isLoadingTracks ? <p>{t(localeKeys.loading)}</p> : (
                    <div className="space-y-2">
                        {tracks && tracks.length > 0 ? (
                             tracks.map(track => (
                                <div key={track.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex justify-between items-center border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: track.color || '#ccc' }}></span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{track.name}</span>
                                        <span className="text-xs text-slate-500 font-mono">({track.slug})</span>
                                    </div>
                                    <div className="space-x-2">
                                        <Button size="sm" variant="neutral" onClick={() => handleOpenModal(track)} leftIcon={<PencilSquareIcon className="w-4 h-4"/>}>{t(localeKeys.edit)}</Button>
                                        <Button size="sm" variant="accent" onClick={() => handleDeleteTrack(track)} leftIcon={<TrashIcon className="w-4 h-4"/>}>{t(localeKeys.delete)}</Button>
                                    </div>
                                </div>
                             ))
                        ) : (
                            <p className="text-center text-slate-500 py-4">No tracks have been created for this event yet.</p>
                        )}
                    </div>
                )}
            </Card>
        </div>
        </>
    );
};

export default TracksSettingsPage;