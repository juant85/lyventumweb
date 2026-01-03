// src/contexts/EventTypeConfigContext.tsx
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { EventType } from '../types';
import { useSelectedEvent } from './SelectedEventContext';

// === EVENT TYPE CONFIGURATION ===

/**
 * Feature flags and UI preferences for each event type
 */
export interface EventTypeConfig {
    // === NOMENCLATURE LABELS ===
    // These adapt the UI terminology based on event type
    labels: {
        scanningPoint: string;        // "Booth" | "Session" | "Station" | "Checkpoint"
        scanningPointPlural: string;  // "Booths" | "Sessions" | "Stations" | "Checkpoints"
        action: string;               // "Visit" | "Check-in" | "Scan" | "Register"
        actionPast: string;           // "Visited" | "Checked in" | "Scanned" | "Registered"
    };

    // Core features
    requirePreRegistration: boolean;
    allowWalkIns: boolean;
    enableBoothAssignments: boolean;
    enableSessionConflicts: boolean;
    enableCapacityLimits: boolean;

    // UI preferences
    defaultScanMode: 'booth' | 'session' | 'auto';
    showVendorAnalytics: boolean;
    showSessionAnalytics: boolean;
    showLeadCaptureMetrics: boolean;

    // CRM settings
    autoCreateWalkIns: boolean;
    leadEnrichmentRequired: boolean;
}

/**
 * Default configurations by event type
 */
export const DEFAULT_CONFIGS: Record<EventType, EventTypeConfig> = {
    vendor_meetings: {
        labels: {
            scanningPoint: 'Booth',
            scanningPointPlural: 'Booths',
            action: 'Visit',
            actionPast: 'Visited',
        },
        requirePreRegistration: true,
        allowWalkIns: true,
        enableBoothAssignments: true,
        enableSessionConflicts: false,
        enableCapacityLimits: true,
        defaultScanMode: 'booth',
        showVendorAnalytics: true,
        showSessionAnalytics: false,
        showLeadCaptureMetrics: false,
        autoCreateWalkIns: true,
        leadEnrichmentRequired: false,
    },
    conference: {
        labels: {
            scanningPoint: 'Session',
            scanningPointPlural: 'Sessions',
            action: 'Check-in',
            actionPast: 'Checked in',
        },
        requirePreRegistration: true,
        allowWalkIns: true,
        enableBoothAssignments: false,
        enableSessionConflicts: true,
        enableCapacityLimits: true,
        defaultScanMode: 'session',
        showVendorAnalytics: false,
        showSessionAnalytics: true,
        showLeadCaptureMetrics: false,
        autoCreateWalkIns: true,
        leadEnrichmentRequired: false,
    },
    trade_show: {
        labels: {
            scanningPoint: 'Station',
            scanningPointPlural: 'Stations',
            action: 'Scan',
            actionPast: 'Scanned',
        },
        requirePreRegistration: false,
        allowWalkIns: true,
        enableBoothAssignments: false,
        enableSessionConflicts: false,
        enableCapacityLimits: false,
        defaultScanMode: 'auto',
        showVendorAnalytics: false,
        showSessionAnalytics: false,
        showLeadCaptureMetrics: true,
        autoCreateWalkIns: true,
        leadEnrichmentRequired: false,
    },
    hybrid: {
        labels: {
            scanningPoint: 'Checkpoint',
            scanningPointPlural: 'Checkpoints',
            action: 'Register',
            actionPast: 'Registered',
        },
        requirePreRegistration: true,
        allowWalkIns: true,
        enableBoothAssignments: true,
        enableSessionConflicts: true,
        enableCapacityLimits: true,
        defaultScanMode: 'auto',
        showVendorAnalytics: true,
        showSessionAnalytics: true,
        showLeadCaptureMetrics: true,
        autoCreateWalkIns: true,
        leadEnrichmentRequired: false,
    },
};

// === CONTEXT ===

interface EventTypeConfigContextType {
    eventType: EventType;
    config: EventTypeConfig;
    isVendorMeeting: boolean;
    isConference: boolean;
    isTradeShow: boolean;
    isHybrid: boolean;
}

const EventTypeConfigContext = createContext<EventTypeConfigContextType | undefined>(undefined);

// === PROVIDER ===

export const EventTypeConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentEvent } = useSelectedEvent();

    const value = useMemo(() => {
        // Get event type from current event (defaults to vendor_meetings)
        const eventType: EventType = currentEvent?.eventType || 'vendor_meetings';

        // Get config for this type
        const config = DEFAULT_CONFIGS[eventType];

        // Helper booleans
        const isVendorMeeting = eventType === 'vendor_meetings';
        const isConference = eventType === 'conference';
        const isTradeShow = eventType === 'trade_show';
        const isHybrid = eventType === 'hybrid';

        return {
            eventType,
            config,
            isVendorMeeting,
            isConference,
            isTradeShow,
            isHybrid,
        };
    }, [currentEvent]);

    return (
        <EventTypeConfigContext.Provider value={value}>
            {children}
        </EventTypeConfigContext.Provider>
    );
};

// === HOOK ===

/**
 * Hook to access event type configuration
 * 
 * Usage:
 * ```tsx
 * const { eventType, config, isConference } = useEventTypeConfig();
 * 
 * if (config.enableBoothAssignments) {
 *   // Show booth assignment UI
 * }
 * ```
 */
export const useEventTypeConfig = (): EventTypeConfigContextType => {
    const context = useContext(EventTypeConfigContext);
    if (context === undefined) {
        throw new Error('useEventTypeConfig must be used within EventTypeConfigProvider');
    }
    return context;
};

// === UTILITY FUNCTIONS ===

/**
 * Get config for a specific event type
 */
export const getConfigForType = (eventType: EventType): EventTypeConfig => {
    return DEFAULT_CONFIGS[eventType];
};

/**
 * Check if feature is enabled for event type
 */
export const isFeatureEnabled = (
    eventType: EventType,
    feature: keyof EventTypeConfig
): boolean => {
    return DEFAULT_CONFIGS[eventType][feature] as boolean;
};
