// src/utils/sponsorHelpers.ts
import { Booth } from '../types';

/**
 * Gets the logo URL for a sponsor booth.
 * Priority: custom sponsor logo > company logo > null
 */
export function getSponsorLogo(booth: Booth, companies: Array<{ id: string; logo_url: string | null }>): string | null {
    // 1. Custom sponsor logo takes priority
    if (booth.sponsorLogoUrl) {
        return booth.sponsorLogoUrl;
    }

    // 2. Company logo if booth is linked to a company
    if (booth.companyId) {
        const company = companies.find(c => c.id === booth.companyId);
        if (company?.logo_url) {
            return company.logo_url;
        }
    }

    // 3. No logo available
    return null;
}

/**
 * Gets the website URL for a sponsor booth.
 * Priority: custom sponsor website > company website > null
 */
export function getSponsorWebsite(booth: Booth, companies: Array<{ id: string; website_url: string | null }>): string | null {
    // 1. Custom sponsor website takes priority
    if (booth.sponsorWebsiteUrl) {
        return booth.sponsorWebsiteUrl;
    }

    // 2. Company website if booth is linked to a company
    if (booth.companyId) {
        const company = companies.find(c => c.id === booth.companyId);
        if (company?.website_url) {
            return company.website_url;
        }
    }

    // 3. No website available
    return null;
}

/**
 * Filters booths by sponsor status and tier
 */
export function getSponsors(
    booths: Booth[],
    tier?: 'platinum' | 'gold' | 'silver'
): Booth[] {
    return booths.filter(booth => {
        if (!booth.isSponsor) return false;
        if (tier && booth.sponsorshipTier !== tier) return false;
        return true;
    });
}

/**
 * Gets the platinum (main) sponsor for an event
 */
export function getPlatinumSponsor(booths: Booth[]): Booth | null {
    const platinumSponsors = getSponsors(booths, 'platinum');
    return platinumSponsors[0] || null;
}

/**
 * Validates that only one platinum sponsor exists per event
 */
export function validatePlatinumSponsor(booths: Booth[], excludeBoothId?: string): boolean {
    const platinumSponsors = booths.filter(b =>
        b.isSponsor &&
        b.sponsorshipTier === 'platinum' &&
        b.id !== excludeBoothId
    );
    return platinumSponsors.length <= 1;
}
