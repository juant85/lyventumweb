// src/features/tracks/components/TrackFilter.tsx
import React from 'react';
import { useTracks } from '../hooks/useTracks';
import { useLanguage } from '../../../contexts/LanguageContext';
import { localeKeys } from '../../../i18n/locales';

type Props = {
  eventId: string;
  value?: string; // selected trackId
  onChange: (next?: string) => void;
};

export function TrackFilter({ eventId, value, onChange }: Props) {
  const { data: tracks, isLoading } = useTracks(eventId);
  const { t } = useLanguage();

  if (isLoading) return <div className="h-10 bg-slate-200 rounded-full animate-pulse w-1/2"></div>;

  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={`chip ${!value ? 'chip--active' : ''}`}
        onClick={() => onChange(undefined)}
        aria-pressed={!value}
      >
        {t(localeKeys.allDays)}
      </button>
      {tracks?.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`chip ${value === t.id ? 'chip--active' : ''}`}
          style={{ 
            '--tw-ring-color': t.color ?? undefined,
             borderColor: value === t.id ? t.color ?? undefined : undefined,
          } as React.CSSProperties}
          onClick={() => onChange(t.id)}
          aria-pressed={value === t.id}
        >
        {t.name}
        </button>
      ))}
    </div>
  );
}