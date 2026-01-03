// src/types/featurePackage.ts
// Type definitions for feature packages

/**
 * Feature package - marketing-friendly grouping of technical features
 */
export interface FeaturePackage {
    id: string;
    key: string;                    // e.g., 'booth_management_suite'
    name: string;                   // e.g., 'Booth Management Suite'
    description: string | null;
    icon: string | null;
    category: string | null;
    features: string[];             // Array of feature keys
    created_at: string;
    updated_at: string;
}

/**
 * Plan with associated packages
 */
export interface PlanWithPackages {
    id: string;
    name: string;
    description: string | null;
    packages: FeaturePackage[];
    hasAllFeaturesInPackage: (packageKey: string) => boolean;
}

/**
 * Package categories for organization
 */
export type PackageCategory =
    | 'configuration'
    | 'tools'
    | 'analytics'
    | 'attendee-portal'
    | 'gamification'
    | 'live-operations'
    | 'communication';

/**
 * Predefined package keys for type safety
 */
export enum PackageKey {
    BOOTH_MANAGEMENT = 'booth_management_suite',
    SESSION_CONFERENCE = 'session_conference_tools',
    LEAD_CAPTURE = 'lead_capture_pro',
    ANALYTICS_REPORTING = 'analytics_reporting',
    ATTENDEE_PORTAL = 'attendee_portal_standard',
    GAMIFICATION = 'gamification_engagement',
    LIVE_OPERATIONS = 'live_operations',
    COMMUNICATION = 'communication_tools',
    SPONSORSHIP = 'sponsorship_management',
}

/**
 * Package metadata for UI display
 */
export interface PackageMetadata {
    name: string;
    shortDescription: string;
    longDescription: string;
    icon: string;
    idealFor: string[];
    includedFeatures: string[];
}

/**
 * Package metadata definitions
 */
export const PACKAGE_METADATA: Record<PackageKey, PackageMetadata> = {
    [PackageKey.BOOTH_MANAGEMENT]: {
        name: 'Booth Management Suite',
        shortDescription: 'Complete booth setup and management',
        longDescription: 'Everything you need to configure booths, manage vendor staff, create booth maps, and control access codes.',
        icon: '🏢',
        idealFor: ['Trade shows', 'Vendor meetings', 'Exhibitions'],
        includedFeatures: [
            'Booth Setup & Configuration',
            'QR Scanner',
            'Visual Booth Map',
            'Vendor Staff Profiles',
            'Access Code Management',
        ],
    },

    [PackageKey.SESSION_CONFERENCE]: {
        name: 'Session & Conference Tools',
        shortDescription: 'Full session management capabilities',
        longDescription: 'Schedule sessions, manage speakers, organize tracks, and send calendar invitations to attendees.',
        icon: '🎤',
        idealFor: ['Conferences', 'Summits', 'Multi-track events'],
        includedFeatures: [
            'Session Scheduling',
            'Track Organization',
            'Calendar Sync (Google/Outlook/Apple)',
            'Session Reminders',
        ],
    },

    [PackageKey.LEAD_CAPTURE]: {
        name: 'Lead Capture Pro',
        shortDescription: 'Advanced lead generation tools',
        longDescription: 'Capture leads with walk-in registration, custom forms, and seamless data export to your CRM.',
        icon: '📊',
        idealFor: ['Trade shows', 'Sales events', 'B2B exhibitions'],
        includedFeatures: [
            'QR Scanner',
            'Walk-in Registration',
            'Master Import Tools',
            'Data Editor',
            'CRM Export',
        ],
    },

    [PackageKey.ANALYTICS_REPORTING]: {
        name: 'Analytics & Reporting',
        shortDescription: 'Real-time insights and reports',
        longDescription: 'Monitor your event in real-time, visualize data trends, and generate professional PDF reports.',
        icon: '📈',
        idealFor: ['All event types'],
        includedFeatures: [
            'Live Dashboard',
            'Real-time Analytics',
            'Advanced Data Visualization',
            'Professional PDF Reports',
        ],
    },

    [PackageKey.ATTENDEE_PORTAL]: {
        name: 'Attendee Portal',
        shortDescription: 'Self-service attendee experience',
        longDescription: 'Give attendees access to their personal portal with agenda, journey tracking, and daily email updates.',
        icon: '👥',
        idealFor: ['Premium events', 'Multi-day conferences'],
        includedFeatures: [
            'Attendee Portal Access',
            'Daily Email Agenda',
            'Journey View & History',
            'Portal Preview Mode',
        ],
    },

    [PackageKey.GAMIFICATION]: {
        name: 'Gamification & Engagement',
        shortDescription: 'Boost attendee participation',
        longDescription: 'Create booth challenges, display leaderboards, and reward attendees for engagement.',
        icon: '🎮',
        idealFor: ['Engagement-focused events', 'Brand activations'],
        includedFeatures: [
            'Booth Challenge System',
            'Public Leaderboard',
            'Achievement System',
            'Points & Rewards',
        ],
    },

    [PackageKey.LIVE_OPERATIONS]: {
        name: 'Live Operations',
        shortDescription: 'Real-time event management',
        longDescription: 'Manage check-ins, track attendee locations, and capture photos during registration.',
        icon: '📍',
        idealFor: ['Large events', 'Security-sensitive venues'],
        includedFeatures: [
            'Check-in Desk',
            'Photo Capture',
            'Attendee Locator',
            'Real-time Tracking',
        ],
    },

    [PackageKey.COMMUNICATION]: {
        name: 'Communication Tools',
        shortDescription: 'Engage with your attendees',
        longDescription: 'Send email campaigns, push notifications, and manage all event communications from one place.',
        icon: '💬',
        idealFor: ['All event types'],
        includedFeatures: [
            'Email Campaigns',
            'Email Template Editor',
            'Push Notifications',
            'Attendee Chat',
        ],
    },

    [PackageKey.SPONSORSHIP]: {
        name: 'Sponsorship Management',
        shortDescription: 'Showcase your sponsors',
        longDescription: 'Manage sponsor tiers, display logos across the platform, and track sponsor visibility.',
        icon: '⭐',
        idealFor: ['Sponsored events', 'Trade shows'],
        includedFeatures: [
            'Sponsor Tiers (Platinum/Gold/Silver)',
            'Logo Management',
            'Custom Branding',
            'Visibility Tracking',
        ],
    },
};
