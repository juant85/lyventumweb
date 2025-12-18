// src/utils/sessionUtils.ts
import { Session } from '../types';

// --- Session Utility ---
export interface ActiveSessionReturn {
  session: Session | null;
  status: 'active' | 'starting_soon' | 'ending_soon' | 'none';
  message: string;
}

export const GRACE_PERIOD_FOR_REGULAR_SCAN = 5; 

export const getActiveSessionDetails = (
  sessionsForCurrentEvent: Session[], 
  currentTime: Date,
  gracePeriodMinutes: number = GRACE_PERIOD_FOR_REGULAR_SCAN
): ActiveSessionReturn => {
  const nowMs = currentTime.getTime();
  const graceMs = gracePeriodMinutes * 60 * 1000;
  let bestMatch: ActiveSessionReturn = { session: null, status: 'none', message: "No active or nearby session found for the current event." };
  
  if (!sessionsForCurrentEvent || sessionsForCurrentEvent.length === 0) {
    return { session: null, status: 'none', message: "No sessions configured for the current event." };
  }
  
  const sortedSessions = [...sessionsForCurrentEvent].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  for (const session of sortedSessions) {
    const startMs = new Date(session.startTime).getTime();
    const endMs = new Date(session.endTime).getTime();
    
    if (nowMs >= startMs && nowMs <= endMs) {
      return { session, status: 'active', message: `Session '${session.name}' is currently active.` };
    }
    
    if (nowMs >= (startMs - graceMs) && nowMs < startMs) {
      const minutesToStart = Math.round((startMs - nowMs) / 60000);
      const message = `Session '${session.name}' starts in ${minutesToStart} minute${minutesToStart === 1 ? '' : 's'}.`;
      if (bestMatch.status === 'none' || bestMatch.status === 'ending_soon' || (bestMatch.status === 'starting_soon' && bestMatch.session && startMs < new Date(bestMatch.session.startTime).getTime())) {
        bestMatch = { session, status: 'starting_soon', message };
      }
    }
    
    if (nowMs > endMs && nowMs <= (endMs + graceMs)) {
      const minutesSinceEnd = Math.round((nowMs - endMs) / 60000);
      const message = `Session '${session.name}' ended ${minutesSinceEnd} minute${minutesSinceEnd === 1 ? '' : 's'} ago.`;
      if (bestMatch.status === 'none' || (bestMatch.status === 'ending_soon' && bestMatch.session && endMs > new Date(bestMatch.session.endTime).getTime()) ) {
        bestMatch = { session, status: 'ending_soon', message };
      }
    }
  }
  
  if (bestMatch.status === 'none' && bestMatch.session === null) {
      bestMatch.message = "No operational session for this event. Scans will be marked as 'Out of Schedule'.";
  }
  
  return bestMatch;
};
