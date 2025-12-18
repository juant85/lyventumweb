// src/features/tracks/components/AttendeeTracksEditor.tsx
import React from 'react';
import { useTracks } from '../hooks/useTracks';
import { useAttendeeTracks } from '../hooks/useAttendeeTracks';
import { useMutateAttendeeTracks } from '../hooks/useMutateAttendeeTracks';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../../contexts/LanguageContext';
import { localeKeys } from '../../../i18n/locales';

type Props = { attendeeId: string; eventId: string };

export function AttendeeTracksEditor({ attendeeId, eventId }: Props) {
  const { data: availableTracks, isLoading: loadingTracks } = useTracks(eventId);
  const { data: selectedTrackIds, isLoading: loadingSelected } = useAttendeeTracks(attendeeId);
  const { mutate, isPending } = useMutateAttendeeTracks(attendeeId, eventId);
  const { t } = useLanguage();

  function handleToggle(trackId: string) {
    const currentSelection = new Set((selectedTrackIds as string[] | undefined) ?? []);
    if (currentSelection.has(trackId)) {
      currentSelection.delete(trackId);
    } else {
      currentSelection.add(trackId);
    }
    mutate(Array.from(currentSelection), {
        onSuccess: () => {
            toast.success("Tracks updated!");
        }
    });
  }

  if (loadingTracks || loadingSelected) {
    return <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>;
  }
  
  if (!availableTracks || availableTracks.length === 0) {
    return <p className="text-sm text-slate-500 italic">No tracks have been configured for this event.</p>
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300 font-montserrat">{t(localeKeys.navLinkTracks)}</div>
      <div className="flex flex-wrap gap-2">
        {availableTracks?.map((track) => (
          <button
            key={track.id}
            type="button"
            className={`chip ${selectedTrackIds?.includes(track.id) ? 'chip--active' : ''}`}
            style={{ 
                '--tw-ring-color': track.color ?? undefined,
                borderColor: selectedTrackIds?.includes(track.id) ? track.color ?? undefined : undefined,
            } as React.CSSProperties}
            onClick={() => handleToggle(track.id)}
            aria-pressed={selectedTrackIds?.includes(track.id)}
            disabled={isPending}
          >
            {track.name}
          </button>
        ))}
      </div>
    </div>
  );
}