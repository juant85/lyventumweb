// src/constants/availableCards.ts
import { QuickActionCard } from '../types/dashboard';
import { AppRoute } from '../types';

/**
 * All available Quick Action cards that can be added to the dashboard
 * Extracted from NAVIGATION_LINKS to allow users to customize their dashboard
 */
export const AVAILABLE_CARDS: QuickActionCard[] = [
    // Manage & Edit Category
    {
        id: 'attendee-profiles',
        label: 'Attendees',
        icon: 'users',
        route: AppRoute.AttendeeProfiles,
        category: 'manage',
        order: 0,
        enabled: false,
    },
    {
        id: 'vendor-profiles',
        label: 'Vendors',
        icon: 'briefcase',
        route: AppRoute.VendorProfiles,
        category: 'manage',
        order: 1,
        enabled: false,
    },
    {
        id: 'check-in-desk',
        label: 'Check-in Desk',
        icon: 'checkCircle',
        route: AppRoute.CheckInDesk,
        category: 'manage',
        order: 2,
        enabled: false,
    },
    {
        id: 'attendee-locator',
        label: 'Find Attendee',
        icon: 'search',
        route: AppRoute.AttendeeLocator,
        category: 'tools',
        order: 3,
        enabled: true, // Default enabled
    },

    // Configure & Setup Category
    {
        id: 'session-settings',
        label: 'Sessions',
        icon: 'calendar',
        route: AppRoute.SessionSettings,
        category: 'configure',
        order: 4,
        enabled: false,
    },
    {
        id: 'booth-setup',
        label: 'Booths',
        icon: 'booth',
        route: AppRoute.BoothSetup,
        category: 'configure',
        order: 5,
        enabled: false,
    },
    {
        id: 'email-settings',
        label: 'Email Settings',
        icon: 'mail',
        route: AppRoute.EmailSettings,
        category: 'configure',
        order: 6,
        enabled: false,
    },
    {
        id: 'access-codes',
        label: 'Access Codes',
        icon: 'key',
        route: AppRoute.AccessCodes,
        category: 'configure',
        order: 7,
        enabled: false,
    },

    // Analyze & Track Category
    {
        id: 'real-time-analytics',
        label: 'Analytics',
        icon: 'analytics',
        route: AppRoute.RealTimeAnalytics,
        category: 'analyze',
        order: 8,
        enabled: true, // Default enabled
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: 'reports',
        route: AppRoute.Reports,
        category: 'analyze',
        order: 9,
        enabled: true, // Default enabled
    },
    {
        id: 'data-visualization',
        label: 'Data Visualization',
        icon: 'visualize',
        route: AppRoute.DataVisualization,
        category: 'analyze',
        order: 10,
        enabled: true, // Default enabled
    },

    // Tools & Utilities Category
    {
        id: 'qr-scanner',
        label: 'QR Scanner',
        icon: 'qrCode',
        route: AppRoute.QRScanner,
        category: 'tools',
        order: 11,
        enabled: false,
    },
    {
        id: 'master-import',
        label: 'Master Import',
        icon: 'upload',
        route: AppRoute.MasterImport,
        category: 'tools',
        order: 12,
        enabled: false,
    },
    {
        id: 'data-editor',
        label: 'Data Editor',
        icon: 'database',
        route: AppRoute.DataEditor,
        category: 'tools',
        order: 13,
        enabled: false,
    },
];

/**
 * Default cards shown when user hasn't customized their dashboard
 * Matches the original QuickActions behavior
 */
export const DEFAULT_CARDS: QuickActionCard[] = AVAILABLE_CARDS.filter(card => card.enabled);
