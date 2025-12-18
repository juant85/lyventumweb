// src/utils/backgroundSync.ts
import { getPendingActions, markActionAsSynced, clearSyncedActions } from './offlineStorage';
import { supabase } from '../supabaseClient';

export async function syncPendingActions(): Promise<{ success: number; failed: number }> {
    console.log('[BackgroundSync] Starting sync...');

    const pendingActions = await getPendingActions();

    if (pendingActions.length === 0) {
        console.log('[BackgroundSync] No pending actions to sync');
        return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const action of pendingActions) {
        try {
            console.log(`[BackgroundSync] Syncing ${action.type}:`, action.id);

            switch (action.type) {
                case 'registration':
                    await syncRegistration(action.data);
                    break;
                case 'check-in':
                    await syncCheckIn(action.data);
                    break;
                case 'scan':
                    await syncScan(action.data);
                    break;
                default:
                    console.warn(`[BackgroundSync] Unknown action type: ${action.type}`);
            }

            await markActionAsSynced(action.id);
            successCount++;
            console.log(`[BackgroundSync] Synced successfully: ${action.id}`);
        } catch (error) {
            console.error(`[BackgroundSync] Failed to sync ${action.id}:`, error);
            failedCount++;
        }
    }

    // Clean up synced actions
    await clearSyncedActions();

    console.log(`[BackgroundSync] Sync complete: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
}

async function syncRegistration(data: any) {
    const { error } = await supabase
        .from('session_registrations')
        .insert(data);

    if (error) throw error;
}

async function syncCheckIn(data: any) {
    const { error } = await supabase
        .from('attendees')
        .update({ checkInTime: data.checkInTime })
        .eq('id', data.attendeeId);

    if (error) throw error;
}

async function syncScan(data: any) {
    const { error } = await supabase
        .from('scans')
        .insert(data);

    if (error) throw error;
}

// Auto-sync when connection is restored
if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
        console.log('[BackgroundSync] Connection restored, starting auto-sync...');
        try {
            const result = await syncPendingActions();
            if (result.success > 0) {
                console.log(`[BackgroundSync] Auto-synced ${result.success} actions`);
            }
        } catch (error) {
            console.error('[BackgroundSync] Auto-sync failed:', error);
        }
    });
}
