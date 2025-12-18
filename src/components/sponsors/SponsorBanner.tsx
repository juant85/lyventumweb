// src/components/sponsors/SponsorBanner.tsx
import React from 'react';
import { Booth } from '../../types';

interface SponsorBannerProps {
    sponsor: Booth;
    placement: 'header' | 'footer' | 'badge' | 'email';
    size?: 'sm' | 'md' | 'lg';
    clickable?: boolean;
    showLabel?: boolean;
    className?: string;
}

const SponsorBanner: React.FC<SponsorBannerProps> = ({
    sponsor,
    placement,
    size = 'md',
    clickable = true,
    showLabel = true,
    className = '',
}) => {
    // Logo resolution: sponsor_logo_url > company logo (future) > placeholder
    const logoUrl = sponsor.sponsorLogoUrl || null;

    // Size classes
    const sizeClasses = {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-16',
        xl: 'h-20',
    };

    // Placement-specific styling
    const placementStyles = {
        header: 'flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700',
        footer: 'flex items-center justify-center',
        badge: 'flex items-center gap-2',
        email: 'text-center',
    };

    const content = (
        <div className={`${placementStyles[placement]} ${className}`}>
            {showLabel && placement === 'header' && (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Sponsored by
                </span>
            )}

            {logoUrl ? (
                <img
                    src={logoUrl}
                    alt={`${sponsor.companyName} logo`}
                    className={`${sizeClasses[size]} w-auto object-contain`}
                />
            ) : (
                <div className={`${sizeClasses[size]} px-4 flex items-center bg-slate-200 dark:bg-slate-700 rounded-md`}>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {sponsor.companyName}
                    </span>
                </div>
            )}

            {sponsor.sponsorDescription && placement === 'footer' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate ml-2">
                    {sponsor.sponsorDescription}
                </p>
            )}
        </div>
    );

    if (clickable && sponsor.sponsorWebsiteUrl) {
        return (
            <a
                href={sponsor.sponsorWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title={`Visit ${sponsor.companyName}`}
            >
                {content}
            </a>
        );
    }

    return content;
};

export default SponsorBanner;
