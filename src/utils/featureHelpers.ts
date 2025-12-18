// src/utils/featureHelpers.ts
import { Feature } from '../features';

export interface FeatureCategory {
    name: string;
    icon: string;
    features: Feature[];
}

export const featureCategories: Record<string, FeatureCategory> = {
    'check-in': {
        name: 'Check-in & Access',
        icon: '🔐',
        features: [
            Feature.CHECK_IN_DESK,
            Feature.CHECK_IN_PHOTO,
            Feature.QR_SCANNER,
        ],
    },
    'live-operations': {
        name: 'Live Operations',
        icon: '📍',
        features: [
            Feature.ATTENDEE_LOCATOR,
        ],
    },
    'analytics': {
        name: 'Analytics & Reports',
        icon: '📊',
        features: [
            Feature.DASHBOARD,
            Feature.DATA_VISUALIZATION,
            Feature.REAL_TIME_ANALYTICS,
            Feature.REPORTS,
        ],
    },
    'management': {
        name: 'Management & Editor',
        icon: '✏️',
        features: [
            Feature.ATTENDEE_PROFILES,
            Feature.DATA_EDITOR,
        ],
    },
    'configuration': {
        name: 'Configuration & Setup',
        icon: '⚙️',
        features: [
            Feature.SESSION_SETTINGS,
            Feature.BOOTH_SETUP,
            Feature.TRACKS,
            Feature.BOOTH_MAP,
        ],
    },
    'tools': {
        name: 'Import & Tools',
        icon: '🔧',
        features: [
            Feature.MASTER_IMPORT,
            Feature.ATTENDEE_REGISTRATION,
        ],
    },
    'communication': {
        name: 'Communication',
        icon: '💬',
        features: [
            Feature.ATTENDEE_CHAT,
            Feature.ATTENDEE_ALERTS,
        ],
    },
    'attendee-portal': {
        name: 'Attendee Portal',
        icon: '👥',
        features: [
            Feature.ATTENDEE_PORTAL_PREVIEW,
            Feature.ATTENDEE_PORTAL,
            Feature.DAILY_EMAIL_AGENDA,
            Feature.SESSION_REMINDERS,
            Feature.ATTENDEE_JOURNEY_VIEW,
            Feature.CALENDAR_SYNC,
        ],
    },
    'gamification': {
        name: 'Gamification & Engagement',
        icon: '🎮',
        features: [
            Feature.BOOTH_CHALLENGE,
            Feature.LEADERBOARD,
        ],
    },
    'admin': {
        name: 'Administration',
        icon: '⚡',
        features: [
        ],
    },
};

export function getFeatureName(featureKey: Feature): string {
    const names: Record<Feature, string> = {
        [Feature.CHECK_IN_DESK]: 'Check-in Desk',
        [Feature.CHECK_IN_PHOTO]: 'Check-in Photo',
        [Feature.ATTENDEE_LOCATOR]: 'Attendee Locator',
        [Feature.DASHBOARD]: 'Dashboard',
        [Feature.DATA_VISUALIZATION]: 'Data Visualization',
        [Feature.REAL_TIME_ANALYTICS]: 'Real-time Analytics',
        [Feature.REPORTS]: 'Reports',
        [Feature.ATTENDEE_PROFILES]: 'Attendee Profiles',
        [Feature.DATA_EDITOR]: 'Data Editor',
        [Feature.SESSION_SETTINGS]: 'Session Settings',
        [Feature.BOOTH_SETUP]: 'Booth Setup',
        [Feature.TRACKS]: 'Tracks',
        [Feature.BOOTH_MAP]: 'Booth Map',
        [Feature.MASTER_IMPORT]: 'Master Import',
        [Feature.ATTENDEE_REGISTRATION]: 'Attendee Registration',
        [Feature.QR_SCANNER]: 'QR Scanner',
        [Feature.SUPER_ADMIN_PLANS]: 'Subscription Plan Builder',
        [Feature.ATTENDEE_CHAT]: 'Attendee Chat',
        [Feature.ATTENDEE_ALERTS]: 'Attendee Alerts',
        [Feature.ATTENDEE_PORTAL_PREVIEW]: 'Attendee Portal Preview',
        [Feature.ATTENDEE_PORTAL]: 'Attendee Portal',
        [Feature.DAILY_EMAIL_AGENDA]: 'Daily Email Agenda',
        [Feature.SESSION_REMINDERS]: 'Session Reminders',
        [Feature.ATTENDEE_JOURNEY_VIEW]: 'Attendee Journey View',
        [Feature.CALENDAR_SYNC]: 'Calendar Sync',
        [Feature.BOOTH_CHALLENGE]: 'Booth Challenge',
        [Feature.ACHIEVEMENT_SYSTEM]: 'Achievement System',
        [Feature.ATTENDEE_NETWORKING]: 'Attendee Networking',
        [Feature.LEADERBOARD]: 'Leaderboard',

        // Added for Sidebar Refinement
        [Feature.ANALYTICS]: 'Analytics',
        [Feature.EMAIL_COMMUNICATIONS]: 'Email Communications',
        [Feature.VENDOR_PROFILES]: 'Vendor Profiles',
        [Feature.ACCESS_CODES]: 'Access Codes',
        [Feature.EMAIL_SETTINGS]: 'Email Settings',
        [Feature.SPONSORSHIP]: 'Sponsorship',
        [Feature.ATTENDEE_IMPORT]: 'Attendee Import',
        [Feature.SCANNER]: 'Scanner',
    };
    return names[featureKey] || featureKey;
}

export function getFeatureDescription(featureKey: Feature): string {
    const descriptions: Record<Feature, string> = {
        [Feature.CHECK_IN_DESK]: 'Manage attendee check-ins with search and quick access',
        [Feature.CHECK_IN_PHOTO]: 'Capture attendee photos during check-in',
        [Feature.ATTENDEE_LOCATOR]: 'Real-time attendee tracking and location',
        [Feature.DASHBOARD]: 'Live event monitoring and metrics overview',
        [Feature.DATA_VISUALIZATION]: 'Deep dive session performance charts',
        [Feature.REAL_TIME_ANALYTICS]: 'Discover patterns and trends as they happen',
        [Feature.REPORTS]: 'Generate professional PDF reports',
        [Feature.ATTENDEE_PROFILES]: 'View and manage attendee information',
        [Feature.DATA_EDITOR]: 'Edit event data and configurations',
        [Feature.SESSION_SETTINGS]: 'Configure sessions and schedules',
        [Feature.BOOTH_SETUP]: 'Manage booth assignments and capacities',
        [Feature.TRACKS]: 'Organize attendees into tracks',
        [Feature.BOOTH_MAP]: 'Visual booth layout configuration',
        [Feature.MASTER_IMPORT]: 'Bulk import data from Excel/CSV',
        [Feature.ATTENDEE_REGISTRATION]: 'Attendee registration forms',
        [Feature.QR_SCANNER]: 'Mobile QR code scanning',
        [Feature.SUPER_ADMIN_PLANS]: 'Create and manage subscription plans',
        [Feature.ATTENDEE_CHAT]: 'Real-time chat with attendees',
        [Feature.ATTENDEE_ALERTS]: 'Push notifications to attendees',
        [Feature.ATTENDEE_PORTAL_PREVIEW]: 'Preview attendee-facing portal',
        [Feature.ATTENDEE_PORTAL]: 'Full attendee portal access',
        [Feature.DAILY_EMAIL_AGENDA]: 'Automated daily agenda emails',
        [Feature.SESSION_REMINDERS]: 'Session reminder notifications',
        [Feature.ATTENDEE_JOURNEY_VIEW]: 'Visual attendee journey tracking',
        [Feature.CALENDAR_SYNC]: 'Export agenda to Google/Outlook/Apple Calendar',
        [Feature.BOOTH_CHALLENGE]: 'Gamified booth visit challenge',
        [Feature.ACHIEVEMENT_SYSTEM]: 'Achievement system (Coming Soon)',
        [Feature.ATTENDEE_NETWORKING]: 'Networking tools (Coming Soon)',
        [Feature.LEADERBOARD]: 'Challenge rankings and leaderboard',

        // Added for Sidebar Refinement
        [Feature.ANALYTICS]: 'Detailed event analytics and reporting',
        [Feature.EMAIL_COMMUNICATIONS]: 'Send and manage email campaigns',
        [Feature.VENDOR_PROFILES]: 'Manage vendor staff and profiles',
        [Feature.ACCESS_CODES]: 'Manage access codes for booths and staff',
        [Feature.EMAIL_SETTINGS]: 'Configure email templates and settings',
        [Feature.SPONSORSHIP]: 'Manage sponsorship tiers and sponsors',
        [Feature.ATTENDEE_IMPORT]: 'Import attendees from various sources',
        [Feature.SCANNER]: 'QR Code Scanner functionality',
    };
    return descriptions[featureKey] || 'No description available';
}
