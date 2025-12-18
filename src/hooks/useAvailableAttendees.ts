// src/hooks/useAvailableAttendees.ts
import { useState, useEffect, useMemo } from 'react';
import { useEventData } from '../contexts/EventDataContext';
import { Attendee } from '../types';

/**
 * Hook to get attendees who are available (not registered) for a specific session
 * @param sessionId - The session ID to check availability for
 * @returns Object with available attendees and loading state
 */
export function useAvailableAttendees(sessionId: string) {
    const { attendees, getSessionRegistrationsForSession } = useEventData();
    const [assignedAttendeeIds, setAssignedAttendeeIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadAssignedAttendees() {
            if (!sessionId) {
                setAssignedAttendeeIds(new Set());
                return;
            }

            setLoading(true);
            try {
                // Get all registrations for this session
                const result = await getSessionRegistrationsForSession(sessionId);

                if (result.success && result.data) {
                    // Create a Set of attendee IDs who already have meetings
                    const assignedIds = new Set(result.data.map(reg => reg.attendeeId));
                    setAssignedAttendeeIds(assignedIds);
                } else {
                    setAssignedAttendeeIds(new Set());
                }
            } catch (error) {
                console.error('Error loading assigned attendees:', error);
                setAssignedAttendeeIds(new Set());
            } finally {
                setLoading(false);
            }
        }

        loadAssignedAttendees();
    }, [sessionId, getSessionRegistrationsForSession]);

    // Filter attendees to only show those who are available
    const availableAttendees = useMemo(() => {
        return attendees.filter(attendee =>
            !assignedAttendeeIds.has(attendee.id) && !attendee.is_vendor
        );
    }, [attendees, assignedAttendeeIds]);

    return {
        availableAttendees,
        assignedAttendeeIds,
        loading,
        totalAvailable: availableAttendees.length,
        totalAssigned: assignedAttendeeIds.size
    };
}
