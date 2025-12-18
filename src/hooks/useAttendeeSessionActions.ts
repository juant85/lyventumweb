// src/hooks/useAttendeeSessionActions.ts
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

export interface AddMeetingParams {
    attendeeId: string;
    sessionId: string;
    eventId: string;
    boothId: string;
    sessionName?: string;
}

export interface RemoveMeetingParams {
    registrationId: string;
    sessionName?: string;
}

export function useAttendeeSessionActions() {
    const [isAdding, setIsAdding] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    /**
     * Add a meeting (register attendee to a session/booth)
     * Returns success boolean and any error message
     */
    async function addMeeting(params: AddMeetingParams) {
        setIsAdding(true);
        const toastId = toast.loading(`Adding to ${params.sessionName || 'session'}...`);

        try {
            // Insert new session registration (meeting)
            const { data, error } = await supabase
                .from('session_registrations')
                .insert({
                    attendee_id: params.attendeeId,
                    session_id: params.sessionId,
                    event_id: params.eventId,
                    expected_booth_id: params.boothId,
                    status: 'Registered',
                    registration_time: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error('Error adding meeting:', error);
                toast.error(`Failed to add meeting: ${error.message}`, { id: toastId });
                return { success: false, error: error.message };
            }

            toast.success(`✅ Meeting added successfully!`, { id: toastId });
            return { success: true, data };

        } catch (err: any) {
            console.error('Exception adding meeting:', err);
            toast.error(`Failed to add meeting: ${err.message}`, { id: toastId });
            return { success: false, error: err.message };
        } finally {
            setIsAdding(false);
        }
    }

    /**
     * Remove a meeting (unregister attendee from session)
     * Returns success boolean and any error message
     */
    async function removeMeeting(params: RemoveMeetingParams) {
        setIsRemoving(true);
        const toastId = toast.loading(`Removing ${params.sessionName || 'meeting'}...`);

        try {
            const { error } = await supabase
                .from('session_registrations')
                .delete()
                .eq('id', params.registrationId);

            if (error) {
                console.error('Error removing meeting:', error);
                toast.error(`Failed to remove meeting: ${error.message}`, { id: toastId });
                return { success: false, error: error.message };
            }

            toast.success(`✅ Meeting removed successfully!`, { id: toastId });
            return { success: true };

        } catch (err: any) {
            console.error('Exception removing meeting:', err);
            toast.error(`Failed to remove meeting: ${err.message}`, { id: toastId });
            return { success: false, error: err.message };
        } finally {
            setIsRemoving(false);
        }
    }

    return {
        addMeeting,
        removeMeeting,
        isAdding,
        isRemoving,
    };
}
