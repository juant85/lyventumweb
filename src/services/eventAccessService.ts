// src/services/eventAccessService.ts
// Service for managing event-level user access and permissions

import { supabase } from '../supabaseClient';
import { Database } from '../database.types';

type EventUser = Database['public']['Tables']['event_users']['Row'];
type EventUserInsert = Database['public']['Tables']['event_users']['Insert'];
type EventRole = 'organizer' | 'viewer';

interface EventAccessResult {
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Event Access Service
 * Manages which users have access to which events
 */
export const eventAccessService = {
    /**
     * Check if a user has access to a specific event
     * @param userId - Supabase user ID
     * @param eventId - Event ID to check
     * @returns True if user has access (any role) or is superadmin
     */
    async checkEventAccess(userId: string, eventId: string): Promise<boolean> {
        try {
            // First check if user is superadmin
            const { data: isSuperAdmin, error: superAdminError } = await supabase
                .rpc('is_superadmin', { user_id: userId });

            if (superAdminError) {
                console.error('[eventAccessService] Error checking superadmin:', superAdminError);
                return false;
            }

            if (isSuperAdmin) return true;

            // Check event_users table for access
            const { data: hasAccess, error: accessError } = await supabase
                .rpc('user_has_event_access', { user_id: userId, event_id: eventId });

            if (accessError) {
                console.error('[eventAccessService] Error checking event access:', accessError);
                return false;
            }

            return hasAccess || false;
        } catch (error) {
            console.error('[eventAccessService] Unexpected error in checkEventAccess:', error);
            return false;
        }
    },

    /**
     * Get user's role for a specific event
     * @param userId - Supabase user ID
     * @param eventId - Event ID
     * @returns Role string ('organizer' | 'viewer') or null if no access
     */
    async getUserEventRole(userId: string, eventId: string): Promise<EventRole | null> {
        try {
            const { data, error } = await supabase
                .rpc('get_user_event_role', { user_id: userId, event_id: eventId });

            if (error) {
                console.error('[eventAccessService] Error getting user event role:', error);
                return null;
            }

            return data as EventRole | null;
        } catch (error) {
            console.error('[eventAccessService] Unexpected error in getUserEventRole:', error);
            return null;
        }
    },

    /**
     * Get all events a user has access to
     * @param userId - Supabase user ID
     * @returns Array of event IDs
     */
    async getUserEvents(userId: string): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('event_users')
                .select('event_id')
                .eq('user_id', userId);

            if (error) {
                console.error('[eventAccessService] Error getting user events:', error);
                return [];
            }

            return data?.map(item => item.event_id) || [];
        } catch (error) {
            console.error('[eventAccessService] Unexpected error in getUserEvents:', error);
            return [];
        }
    },

    /**
     * Get all users assigned to an event (SuperAdmin only)
     * @param eventId - Event ID
     * @returns Array of event users with profile info
     */
    async getEventUsers(eventId: string): Promise<EventUser[]> {
        try {
            const { data, error } = await supabase
                .from('event_users')
                .select('*')
                .eq('event_id', eventId)
                .order('assigned_at', { ascending: false });

            if (error) {
                console.error('[eventAccessService] Error getting event users:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[eventAccessService] Unexpected error in getEventUsers:', error);
            return [];
        }
    },

    /**
     * Get event users with their profile information
     * Includes username and email from profiles/auth
     */
    async getEventUsersWithProfiles(eventId: string) {
        try {
            const { data, error } = await supabase
                .from('event_users')
                .select(`
                    *,
                    profiles!event_users_user_id_fkey (username)
                `)
                .eq('event_id', eventId)
                .order('assigned_at', { ascending: false });

            if (error) {
                console.error('[eventAccessService] Error getting event users with profiles:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[eventAccessService] Unexpected error:', error);
            return [];
        }
    },

    /**
     * Assign a user to an event (SuperAdmin only)
     * @param userId - User to grant access
     * @param eventId - Event to grant access to
     * @param role - Role to assign ('organizer' | 'viewer')
     * @param assignedBy - SuperAdmin user ID performing the assignment
     */
    async assignUserToEvent(
        userId: string,
        eventId: string,
        role: EventRole = 'organizer',
        assignedBy: string
    ): Promise<EventAccessResult> {
        try {
            // Check if assignment already exists
            const { data: existing } = await supabase
                .from('event_users')
                .select('*')
                .eq('user_id', userId)
                .eq('event_id', eventId)
                .maybeSingle();

            if (existing) {
                return {
                    success: false,
                    message: 'User is already assigned to this event. Use updateUserEventRole to change their role.',
                };
            }

            const insertData: EventUserInsert = {
                user_id: userId,
                event_id: eventId,
                role,
                assigned_by: assignedBy,
            };

            const { data, error } = await supabase
                .from('event_users')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error('[eventAccessService] Error assigning user to event:', error);
                return {
                    success: false,
                    message: `Failed to assign user: ${error.message}`,
                };
            }

            return {
                success: true,
                message: `User successfully assigned as ${role}`,
                data,
            };
        } catch (error: any) {
            console.error('[eventAccessService] Unexpected error in assignUserToEvent:', error);
            return {
                success: false,
                message: error.message || 'Unexpected error occurred',
            };
        }
    },

    /**
     * Remove a user's access to an event (SuperAdmin only)
     * @param userId - User to remove
     * @param eventId - Event to remove access from
     */
    async removeUserFromEvent(userId: string, eventId: string): Promise<EventAccessResult> {
        try {
            const { error } = await supabase
                .from('event_users')
                .delete()
                .eq('user_id', userId)
                .eq('event_id', eventId);

            if (error) {
                console.error('[eventAccessService] Error removing user from event:', error);
                return {
                    success: false,
                    message: `Failed to remove user: ${error.message}`,
                };
            }

            return {
                success: true,
                message: 'User access successfully removed',
            };
        } catch (error: any) {
            console.error('[eventAccessService] Unexpected error in removeUserFromEvent:', error);
            return {
                success: false,
                message: error.message || 'Unexpected error occurred',
            };
        }
    },

    /**
     * Update a user's role for an event (SuperAdmin only)
     * @param userId - User whose role to update
     * @param eventId - Event ID
     * @param newRole - New role to assign
     */
    async updateUserEventRole(
        userId: string,
        eventId: string,
        newRole: EventRole
    ): Promise<EventAccessResult> {
        try {
            const { data, error } = await supabase
                .from('event_users')
                .update({ role: newRole })
                .eq('user_id', userId)
                .eq('event_id', eventId)
                .select()
                .single();

            if (error) {
                console.error('[eventAccessService] Error updating user role:', error);
                return {
                    success: false,
                    message: `Failed to update role: ${error.message}`,
                };
            }

            return {
                success: true,
                message: `User role updated to ${newRole}`,
                data,
            };
        } catch (error: any) {
            console.error('[eventAccessService] Unexpected error in updateUserEventRole:', error);
            return {
                success: false,
                message: error.message || 'Unexpected error occurred',
            };
        }
    },

    /**
     * Search for users by email (for SuperAdmin to assign to events)
     * @param searchTerm - Email or username to search for
     * @returns Array of matching users
     */
    async searchUsers(searchTerm: string) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                return [];
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('user_id, username, role')
                .or(`username.ilike.%${searchTerm}%`)
                .limit(10);

            if (error) {
                console.error('[eventAccessService] Error searching users:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[eventAccessService] Unexpected error in searchUsers:', error);
            return [];
        }
    },

    /**
     * Create a new organizer user (SuperAdmin only)
     * Calls the create-organizer Edge Function
     * @param params - Email, username, and optional event ID to auto-assign
     * @returns Result with success status and message
     */
    async createOrganizer(params: {
        email: string;
        username: string;
        autoAssignToEvent?: string | null;
    }): Promise<EventAccessResult> {
        try {
            // Get current user ID
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return {
                    success: false,
                    message: 'Not authenticated',
                };
            }

            // Call Edge Function
            const { data, error } = await supabase.functions.invoke('create-organizer', {
                body: {
                    email: params.email,
                    username: params.username,
                    autoAssignToEvent: params.autoAssignToEvent,
                    createdBy: user.id,
                },
            });

            if (error) {
                console.error('[eventAccessService] Edge function error:', error);

                // Try to extract error message from context if available
                let errorMessage = 'Failed to create organizer';

                if (error.context) {
                    try {
                        const contextData = typeof error.context === 'string'
                            ? JSON.parse(error.context)
                            : error.context;
                        errorMessage = contextData.error || contextData.message || errorMessage;
                    } catch (e) {
                        // If context is not JSON, use it directly
                        errorMessage = error.context.toString();
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }

                return {
                    success: false,
                    message: errorMessage,
                };
            }

            if (!data || !data.success) {
                return {
                    success: false,
                    message: data.error || 'Failed to create organizer',
                };
            }

            return {
                success: true,
                message: data.message || 'Organizer created successfully',
                data: data,
            };
        } catch (error: any) {
            console.error('[eventAccessService] Error creating organizer:', error);
            return {
                success: false,
                message: error.message || 'Unexpected error occurred',
            };
        }
    },
};
