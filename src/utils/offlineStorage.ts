// src/utils/offlineStorage.ts
import Dexie, { Table } from 'dexie';

// Define types for offline data
export interface OfflineSession {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    eventId: string;
    boothSettings: { boothId: string; capacity: number }[];
    cachedAt: number;
}

export interface OfflineRegistration {
    id: string;
    sessionId: string;
    sessionName: string;
    sessionStartTime: string;
    attendeeId: string;
    attendeeName?: string;
    expectedBoothId?: string | null;
    boothName?: string;
    boothDetails?: { physicalId: string };
    status: string;
    cachedAt: number;
}

export interface PendingAction {
    id: string;
    type: 'check-in' | 'registration' | 'scan';
    data: any;
    timestamp: number;
    synced: boolean;
}

// Define the database
class OfflineDatabase extends Dexie {
    sessions!: Table<OfflineSession, string>;
    registrations!: Table<OfflineRegistration, string>;
    pendingActions!: Table<PendingAction, string>;

    constructor() {
        super('LyVentumOfflineDB');

        this.version(1).stores({
            sessions: 'id, eventId, cachedAt',
            registrations: 'id, sessionId, attendeeId, cachedAt',
            pendingActions: 'id, type, timestamp, synced',
        });
    }
}

// Create database instance
const db = new OfflineDatabase();

// ===== SESSION MANAGEMENT =====

export async function saveSessionsToCache(sessions: any[], eventId: string): Promise<void> {
    const now = Date.now();
    const offlineSessions: OfflineSession[] = sessions.map(session => ({
        ...session,
        eventId,
        cachedAt: now,
    }));

    await db.sessions.bulkPut(offlineSessions);
    console.log(`[Offline] Cached ${sessions.length} sessions`);
}

export async function getSessionsFromCache(eventId: string): Promise<OfflineSession[]> {
    const sessions = await db.sessions
        .where('eventId')
        .equals(eventId)
        .toArray();

    console.log(`[Offline] Retrieved ${sessions.length} sessions from cache`);
    return sessions;
}

export async function clearSessionCache(eventId?: string): Promise<void> {
    if (eventId) {
        await db.sessions.where('eventId').equals(eventId).delete();
    } else {
        await db.sessions.clear();
    }
    console.log('[Offline] Session cache cleared');
}

// ===== REGISTRATION MANAGEMENT =====

export async function saveRegistrationsToCache(registrations: any[]): Promise<void> {
    const now = Date.now();
    const offlineRegs: OfflineRegistration[] = registrations.map(reg => ({
        ...reg,
        cachedAt: now,
    }));

    await db.registrations.bulkPut(offlineRegs);
    console.log(`[Offline] Cached ${registrations.length} registrations`);
}

export async function getRegistrationsFromCache(attendeeId: string): Promise<OfflineRegistration[]> {
    const registrations = await db.registrations
        .where('attendeeId')
        .equals(attendeeId)
        .toArray();

    console.log(`[Offline] Retrieved ${registrations.length} registrations from cache`);
    return registrations;
}

export async function clearRegistrationCache(): Promise<void> {
    await db.registrations.clear();
    console.log('[Offline] Registration cache cleared');
}

// ===== PENDING ACTIONS QUEUE =====

export async function queueAction(type: PendingAction['type'], data: any): Promise<string> {
    const action: PendingAction = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        synced: false,
    };

    await db.pendingActions.add(action);
    console.log(`[Offline] Queued action: ${type}`, action.id);
    return action.id;
}

export async function getPendingActions(): Promise<PendingAction[]> {
    const actions = await db.pendingActions
        .where('synced')
        .equals(0) // Use 0 instead of false for Dexie
        .sortBy('timestamp');

    console.log(`[Offline] ${actions.length} pending actions in queue`);
    return actions;
}

export async function markActionAsSynced(actionId: string): Promise<void> {
    await db.pendingActions.update(actionId, { synced: true });
    console.log(`[Offline] Marked action as synced: ${actionId}`);
}

export async function clearSyncedActions(): Promise<void> {
    const count = await db.pendingActions.where('synced').equals(1).delete();
    console.log(`[Offline] Cleared ${count} synced actions`);
}

export async function getPendingActionsCount(): Promise<number> {
    return await db.pendingActions.where('synced').equals(0).count();
}

// ===== CACHE MANAGEMENT =====

export async function getCacheInfo() {
    const [sessionsCount, registrationsCount, pendingCount] = await Promise.all([
        db.sessions.count(),
        db.registrations.count(),
        db.pendingActions.where('synced').equals(0).count(),
    ]);

    return {
        sessions: sessionsCount,
        registrations: registrationsCount,
        pendingActions: pendingCount,
    };
}

export async function clearAllCache(): Promise<void> {
    await Promise.all([
        db.sessions.clear(),
        db.registrations.clear(),
        db.pendingActions.clear(),
    ]);
    console.log('[Offline] All cache cleared');
}

// ===== CACHE EXPIRATION =====

const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function removeExpiredCache(): Promise<void> {
    const now = Date.now();
    const expirationTime = now - CACHE_EXPIRATION_MS;

    const [sessionsDeleted, registrationsDeleted] = await Promise.all([
        db.sessions.where('cachedAt').below(expirationTime).delete(),
        db.registrations.where('cachedAt').below(expirationTime).delete(),
    ]);

    console.log(`[Offline] Removed expired cache: ${sessionsDeleted} sessions, ${registrationsDeleted} registrations`);
}

// Export database instance for advanced usage
export { db };
