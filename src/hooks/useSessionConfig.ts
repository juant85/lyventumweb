// src/hooks/useSessionConfig.ts
// Hook for managing session configuration

import { useState, useEffect, useCallback } from 'react';
import { SessionConfig } from '../types/sessionConfig';
import { Session } from '../types';

interface UseSessionConfigResult {
    config: Partial<SessionConfig>;
    updateConfig: (updates: Partial<SessionConfig>) => void;
    resetConfig: () => void;
    isValid: boolean;
    errors: string[];
}

/**
 * Hook to manage session configuration state
 * Handles initialization from existing session and validation
 */
export function useSessionConfig(session?: Session | null): UseSessionConfigResult {
    const [config, setConfig] = useState<Partial<SessionConfig>>({});
    const [errors, setErrors] = useState<string[]>([]);

    // Initialize config from session
    useEffect(() => {
        if (session?.config) {
            setConfig(session.config);
        } else if (session) {
            // Migrate from old session_type if no config exists
            const defaultConfig: Partial<SessionConfig> = {
                scanningContext: session.sessionType === 'meeting' ? 'booth_meeting' :
                    session.sessionType === 'presentation' ? 'presentation' :
                        session.sessionType === 'networking' ? 'networking' :
                            'open_attendance',
                requiresPreAssignment: session.sessionType === 'meeting',
                allowsWalkIns: session.sessionType !== 'meeting',
                boothRestriction: session.sessionType === 'meeting' ? 'assigned' : 'none',
            };
            setConfig(defaultConfig);
        }
    }, [session]);

    // Validate config
    useEffect(() => {
        const validationErrors: string[] = [];

        if (!config.scanningContext) {
            validationErrors.push('Scanning context is required');
        }

        if (config.hasCapacity && (!config.maxCapacity || config.maxCapacity <= 0)) {
            validationErrors.push('Max capacity must be greater than 0');
        }

        if (config.boothRestriction !== 'none' && (!config.boothIds || config.boothIds.length === 0)) {
            validationErrors.push('Select at least one booth');
        }

        if (config.scanningContext === 'lead_capture' && !config.leadForm) {
            validationErrors.push('Lead form configuration required');
        }

        setErrors(validationErrors);
    }, [config]);

    const updateConfig = useCallback((updates: Partial<SessionConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    }, []);

    const resetConfig = useCallback(() => {
        setConfig({});
        setErrors([]);
    }, []);

    return {
        config,
        updateConfig,
        resetConfig,
        isValid: errors.length === 0,
        errors,
    };
}
