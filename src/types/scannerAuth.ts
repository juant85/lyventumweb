// Scanner Authentication Types
// Supports both booth and session scanner modes

export type ScannerAuthBooth = {
    type: 'booth';
    boothId: string;
    boothName: string;
    eventId: string;
};

export type ScannerAuthSession = {
    type: 'session';
    sessionId: string;
    sessionName: string;
    eventId: string;
    sessionTimes: {
        start: string;
        end: string;
    };
};

export type ScannerAuth = ScannerAuthBooth | ScannerAuthSession;

// Helper functions
export const getScannerAuth = (): ScannerAuth | null => {
    const authString = localStorage.getItem('scannerAuth');
    if (!authString) return null;

    try {
        return JSON.parse(authString) as ScannerAuth;
    } catch (e) {
        console.error('Failed to parse scanner auth:', e);
        return null;
    }
};

export const isScannerAuthValid = (auth: ScannerAuth | null): auth is ScannerAuth => {
    if (!auth) return false;

    if (auth.type === 'booth') {
        return Boolean(auth.boothId && auth.eventId && auth.boothName);
    }

    if (auth.type === 'session') {
        return Boolean(
            auth.sessionId &&
            auth.eventId &&
            auth.sessionName &&
            auth.sessionTimes?.start &&
            auth.sessionTimes?.end
        );
    }

    return false;
};

export const getScannerType = (): 'booth' | 'session' | null => {
    const auth = getScannerAuth();
    return auth?.type || null;
};
