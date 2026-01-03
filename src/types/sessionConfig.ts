// src/types/sessionConfig.ts
// Type definitions for flexible session configuration

/**
 * Scanning context determines the behavior and validation logic for QR scanning
 */
export type ScanningContext =
    | 'booth_meeting'      // Pre-assigned booth visits with validation
    | 'presentation'       // Open attendance for talks/keynotes
    | 'lead_capture'       // Walk-in lead collection at stations
    | 'open_attendance'    // Simple attendance tracking (networking, breaks)
    | 'networking'         // Networking events
    | 'custom';            // User-defined configuration

/**
 * Booth restriction level for scanning
 */
export type BoothRestriction =
    | 'assigned'  // Can only scan at pre-assigned booth
    | 'any'       // Can scan at any configured booth
    | 'none';     // No booth restrictions

/**
 * Lead form configuration for lead capture sessions
 */
export interface LeadFormConfig {
    collectEmail?: boolean;
    collectPhone?: boolean;
    collectNotes?: boolean;
    collectCompany?: boolean;
    customFields?: {
        key: string;
        label: string;
        type: 'text' | 'select' | 'checkbox';
        required?: boolean;
        options?: string[]; // For select fields
    }[];
}

/**
 * Complete session configuration object
 * Stored as JSONB in sessions.config column
 */
export interface SessionConfig {
    // Core scanning behavior
    scanningContext: ScanningContext;

    // Access control
    requiresPreAssignment?: boolean;  // Only registered attendees can scan
    allowsWalkIns?: boolean;          // Allow unregistered attendees

    // Booth configuration
    boothRestriction?: BoothRestriction;
    boothIds?: string[];              // List of applicable booths

    // Capacity management
    hasCapacity?: boolean;
    maxCapacity?: number;

    // Context-specific metadata
    location?: string;                // For presentations
    speaker?: string;                 // For presentations
    leadForm?: LeadFormConfig;        // For lead capture

    // Notifications
    sendReminders?: boolean;
    reminderMinutes?: number[];       // e.g., [60, 15] = 1 hour and 15 min before

    // Custom configuration
    customSettings?: Record<string, any>;
}

/**
 * Session config presets for quick setup
 */
export const SESSION_CONFIG_PRESETS: Record<string, Partial<SessionConfig>> = {
    booth_meeting: {
        scanningContext: 'booth_meeting',
        requiresPreAssignment: true,
        allowsWalkIns: false,
        boothRestriction: 'assigned',
        sendReminders: true,
        reminderMinutes: [60, 15],
    },

    keynote_presentation: {
        scanningContext: 'presentation',
        requiresPreAssignment: false,
        allowsWalkIns: true,
        boothRestriction: 'none',
        hasCapacity: true,
        sendReminders: true,
        reminderMinutes: [30],
    },

    lead_capture_station: {
        scanningContext: 'lead_capture',
        requiresPreAssignment: false,
        allowsWalkIns: true,
        boothRestriction: 'any',
        leadForm: {
            collectEmail: true,
            collectPhone: true,
            collectNotes: true,
        },
    },

    networking_event: {
        scanningContext: 'networking',
        requiresPreAssignment: false,
        allowsWalkIns: true,
        boothRestriction: 'none',
    },

    open_attendance: {
        scanningContext: 'open_attendance',
        requiresPreAssignment: false,
        allowsWalkIns: true,
        boothRestriction: 'none',
    },
};

/**
 * Helper to get user-friendly label for scanning context
 */
export function getScanningContextLabel(context: ScanningContext): string {
    const labels: Record<ScanningContext, string> = {
        booth_meeting: '🤝 Booth Meetings (Pre-assigned)',
        presentation: '🎤 Presentation/Talk',
        lead_capture: '📊 Lead Capture Station',
        open_attendance: '✓ Open Attendance',
        networking: '🌐 Networking Event',
        custom: '⚙️ Custom Configuration',
    };
    return labels[context] || context;
}

/**
 * Helper to get description for scanning context
 */
export function getScanningContextDescription(context: ScanningContext): string {
    const descriptions: Record<ScanningContext, string> = {
        booth_meeting: 'Attendees scan at their pre-assigned booths. System validates booth assignment.',
        presentation: 'Open check-in for talks and presentations. Track attendance with optional capacity limits.',
        lead_capture: 'Exhibitors capture leads with walk-in scanning and optional lead forms.',
        open_attendance: 'Simple attendance tracking for networking events, breaks, and social activities.',
        networking: 'Track participation in networking sessions with optional matchmaking.',
        custom: 'Define your own scanning rules and validation logic.',
    };
    return descriptions[context] || '';
}

/**
 * Validate session config structure
 */
export function validateSessionConfig(config: Partial<SessionConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.scanningContext) {
        errors.push('Scanning context is required');
    }

    if (config.hasCapacity && (!config.maxCapacity || config.maxCapacity <= 0)) {
        errors.push('Max capacity must be greater than 0 when capacity is enabled');
    }

    if (config.boothRestriction !== 'none' && (!config.boothIds || config.boothIds.length === 0)) {
        errors.push('Booth IDs must be specified when booth restriction is enabled');
    }

    if (config.scanningContext === 'lead_capture' && !config.leadForm) {
        errors.push('Lead form configuration is required for lead capture sessions');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
