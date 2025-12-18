// src/components/EventOrganizersModal.tsx
// Modal for SuperAdmin to manage which users have access to an event

import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { eventAccessService } from '../services/eventAccessService';
import { useAuth } from '../contexts/AuthContext';
import { UsersGroupIcon, MagnifyingGlassIcon, TrashIcon, UserPlusIcon, CheckCircleIcon } from './Icons';
import toast from 'react-hot-toast';

interface EventOrganizersModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventName: string;
}

interface EventUser {
    user_id: string;
    role: 'organizer' | 'viewer';
    assigned_at: string;
    assigned_by: string | null;
    profiles?: { username: string } | null;
}

interface SearchUser {
    user_id: string;
    username: string;
    role: 'admin' | 'organizer' | 'superadmin' | null;
}

const EventOrganizersModal: React.FC<EventOrganizersModalProps> = ({
    isOpen,
    onClose,
    eventId,
    eventName,
}) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [eventUsers, setEventUsers] = useState<EventUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [selectedRole, setSelectedRole] = useState<'organizer' | 'viewer'>('organizer');
    const [error, setError] = useState<string | null>(null);

    // Create organizer form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newOrganizerEmail, setNewOrganizerEmail] = useState('');
    const [newOrganizerUsername, setNewOrganizerUsername] = useState('');
    const [autoAssign, setAutoAssign] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Fetch current event users when modal opens
    useEffect(() => {
        if (isOpen && eventId) {
            fetchEventUsers();
        }
    }, [isOpen, eventId]);

    const fetchEventUsers = async () => {
        setLoading(true);
        try {
            const users = await eventAccessService.getEventUsersWithProfiles(eventId);
            setEventUsers(users as EventUser[]);
        } catch (err: any) {
            console.error('Error fetching event users:', err);
            setError(err.message || 'Failed to load event users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const results = await eventAccessService.searchUsers(searchTerm);
            // Filter out users already assigned to this event
            const filtered = results.filter(
                user => !eventUsers.some(eu => eu.user_id === user.user_id)
            );
            setSearchResults(filtered as SearchUser[]);
        } catch (err: any) {
            console.error('Error searching users:', err);
            toast.error('Failed to search users');
        }
    };

    const handleAssignUser = async (userId: string, username: string) => {
        if (!currentUser?.id) {
            toast.error('Authentication error');
            return;
        }

        const toastId = toast.loading(`Assigning ${username} as ${selectedRole}...`);

        try {
            const result = await eventAccessService.assignUserToEvent(
                userId,
                eventId,
                selectedRole,
                currentUser.id
            );

            if (result.success) {
                toast.success(result.message, { id: toastId });
                await fetchEventUsers(); // Refresh list
                setSearchTerm(''); // Clear search
                setSearchResults([]); // Clear results
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign user', { id: toastId });
        }
    };

    const handleRemoveUser = async (userId: string, username: string) => {
        if (!confirm(`Remove ${username}'s access to this event?`)) {
            return;
        }

        const toastId = toast.loading('Removing access...');

        try {
            const result = await eventAccessService.removeUserFromEvent(userId, eventId);

            if (result.success) {
                toast.success(result.message, { id: toastId });
                await fetchEventUsers(); // Refresh list
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to remove user', { id: toastId });
        }
    };

    const handleToggleRole = async (userId: string, currentRole: 'organizer' | 'viewer', username: string) => {
        const newRole: 'organizer' | 'viewer' = currentRole === 'organizer' ? 'viewer' : 'organizer';
        const toastId = toast.loading(`Updating ${username} to ${newRole}...`);

        try {
            const result = await eventAccessService.updateUserEventRole(userId, eventId, newRole);

            if (result.success) {
                toast.success(result.message, { id: toastId });
                await fetchEventUsers(); // Refresh list
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update role', { id: toastId });
        }
    };

    const handleCreateOrganizer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newOrganizerEmail.trim() || !newOrganizerUsername.trim()) {
            toast.error('Email and username are required');
            return;
        }

        setIsCreating(true);
        const toastId = toast.loading('Creating organizer...');

        try {
            const result = await eventAccessService.createOrganizer({
                email: newOrganizerEmail.trim(),
                username: newOrganizerUsername.trim(),
                autoAssignToEvent: autoAssign ? eventId : null,
            });

            if (result.success) {
                toast.success(result.message, { id: toastId });
                // Reset form
                setNewOrganizerEmail('');
                setNewOrganizerUsername('');
                setShowCreateForm(false);
                // Refresh user list
                fetchEventUsers();
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (err: any) {
            console.error('Error creating organizer:', err);
            toast.error(err.message || 'Failed to create organizer', { id: toastId });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Organizers: ${eventName}`}>
            <div className="space-y-6">
                {error && <Alert type="error" message={error} />}

                {/* Current Event Users */}
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <UsersGroupIcon className="w-5 h-5 text-primary-600" />
                        Current Organizers
                    </h3>

                    {loading && !eventUsers.length ? (
                        <div className="text-center py-4 text-gray-500">Loading...</div>
                    ) : eventUsers.length === 0 ? (
                        <Alert type="info" message="No organizers assigned yet. Search and add users below." />
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {eventUsers.map(user => (
                                <div
                                    key={user.user_id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {user.profiles?.username || 'Unknown User'}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Role: <span className="font-semibold capitalize">{user.role}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Toggle Role Button */}
                                        <button
                                            onClick={() => handleToggleRole(
                                                user.user_id,
                                                user.role,
                                                user.profiles?.username || 'User'
                                            )}
                                            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                            title={`Change to ${user.role === 'organizer' ? 'viewer' : 'organizer'}`}
                                        >
                                            {user.role === 'organizer' ? '→ Viewer' : '→ Organizer'}
                                        </button>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveUser(
                                                user.user_id,
                                                user.profiles?.username || 'User'
                                            )}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Remove access"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Add New User */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <UserPlusIcon className="w-5 h-5 text-green-600" />
                            Add Organizer
                        </h3>

                        {/* Toggle Button */}
                        <button
                            onClick={() => {
                                setShowCreateForm(!showCreateForm);
                                setSearchTerm('');
                                setSearchResults([]);
                                setNewOrganizerEmail('');
                                setNewOrganizerUsername('');
                            }}
                            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                            {showCreateForm ? (
                                <>
                                    <MagnifyingGlassIcon className="w-4 h-4" />
                                    Search Existing
                                </>
                            ) : (
                                <>
                                    <UserPlusIcon className="w-4 h-4" />
                                    Create New
                                </>
                            )}
                        </button>
                    </div>

                    {/* Conditional: Create Form or Search */}
                    {showCreateForm ? (
                        <form onSubmit={handleCreateOrganizer} className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={newOrganizerEmail}
                                    onChange={(e) => setNewOrganizerEmail(e.target.value)}
                                    placeholder="organizer@example.com"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
                                    disabled={isCreating}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={newOrganizerUsername}
                                    onChange={(e) => setNewOrganizerUsername(e.target.value)}
                                    placeholder="John Smith"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
                                    disabled={isCreating}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="auto-assign"
                                    checked={autoAssign}
                                    onChange={(e) => setAutoAssign(e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                                    disabled={isCreating}
                                />
                                <label htmlFor="auto-assign" className="text-sm text-gray-700 dark:text-gray-300">
                                    Auto-assign to this event
                                </label>
                            </div>

                            <Alert
                                type="info"
                                message={
                                    <p className="text-xs">
                                        ✉️ A welcome email will be sent with setup instructions.
                                    </p>
                                }
                            />

                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowCreateForm(false)}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isCreating || !newOrganizerEmail.trim() || !newOrganizerUsername.trim()}
                                >
                                    {isCreating ? 'Creating...' : 'Create Organizer'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by email or username..."
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
                                />
                                <Button
                                    onClick={handleSearch}
                                    variant="secondary"
                                    className="!px-4"
                                >
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Role Selector */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Assign as:
                                </label>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="organizer"
                                            checked={selectedRole === 'organizer'}
                                            onChange={(e) => setSelectedRole(e.target.value as 'organizer')}
                                            className="text-primary-600"
                                        />
                                        <span className="text-sm">Organizer (can edit)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="viewer"
                                            checked={selectedRole === 'viewer'}
                                            onChange={(e) => setSelectedRole(e.target.value as 'viewer')}
                                            className="text-primary-600"
                                        />
                                        <span className="text-sm">Viewer (read-only)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.user_id}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {user.username}
                                                </p>
                                                {user.role && (
                                                    <p className="text-xs text-gray-500">Platform role: {user.role}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleAssignUser(user.user_id, user.username)}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Assign
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchTerm && searchResults.length === 0 && !loading && (
                                <Alert type="info" message="No users found. Make sure they have an account in the system." />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button onClick={onClose} variant="secondary">
                        Close
                    </Button>
                </div>
            </div>
        </Modal >
    );
};

export default EventOrganizersModal;
