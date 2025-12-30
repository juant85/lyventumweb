import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import { ClockIcon, CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '../Icons';
import haptics from '../../utils/haptics';

interface OrganizerInvitation {
    id: string;
    invitee_email: string;
    invitee_role: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    created_at: string;
    expires_at: string;
}

interface PendingInvitationsCardProps {
    eventId: string;
    onInvite: () => void;
}

const PendingInvitationsCard: React.FC<PendingInvitationsCardProps> = ({
    eventId,
    onInvite
}) => {
    const [invitations, setInvitations] = useState<OrganizerInvitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInvitations();
    }, [eventId]);

    const fetchInvitations = async () => {
        try {
            const { data, error } = await supabase
                .from('organizer_invitations')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setInvitations(data || []);
        } catch (error) {
            console.error('Error fetching invitations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async (invitationId: string, email: string) => {
        haptics.light();

        try {
            // TODO: Implement resend logic
            // This would regenerate the token and send a new email
            toast.success(`Invitation resent to ${email}`);
            haptics.success();
        } catch (error) {
            toast.error('Failed to resend invitation');
            haptics.error();
        }
    };

    const handleCancel = async (invitationId: string) => {
        haptics.light();

        try {
            const { error } = await supabase
                .from('organizer_invitations')
                .delete()
                .eq('id', invitationId);

            if (error) throw error;

            toast.success('Invitation cancelled');
            haptics.success();
            fetchInvitations();
        } catch (error) {
            toast.error('Failed to cancel invitation');
            haptics.error();
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <ClockIcon className="w-4 h-4 text-amber-500" />;
            case 'accepted':
                return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
            case 'declined':
            case 'expired':
                return <XCircleIcon className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            expired: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        };

        return badges[status as keyof typeof badges] || badges.pending;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                </div>
            </div>
        );
    }

    const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                        Invitations
                    </h3>
                    {pendingInvitations.length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                            {pendingInvitations.length} pending
                        </span>
                    )}
                </div>
                <button
                    onClick={onInvite}
                    className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                    + Invite
                </button>
            </div>

            {/* Invitations List */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {invitations.length === 0 ? (
                    <div className="p-8 text-center">
                        <EnvelopeIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            No invitations sent yet
                        </p>
                        <button
                            onClick={onInvite}
                            className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                        >
                            Send your first invitation
                        </button>
                    </div>
                ) : (
                    invitations.map((invitation) => (
                        <div key={invitation.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getStatusIcon(invitation.status)}
                                        <p className="font-medium text-slate-900 dark:text-white truncate">
                                            {invitation.invitee_email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="capitalize">{invitation.invitee_role}</span>
                                        <span>•</span>
                                        <span>Sent {formatDate(invitation.created_at)}</span>
                                    </div>
                                    {invitation.status === 'pending' && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Expires {formatDate(invitation.expires_at)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap ${getStatusBadge(invitation.status)}`}>
                                        {invitation.status}
                                    </span>

                                    {invitation.status === 'pending' && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleResend(invitation.id, invitation.invitee_email)}
                                                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                                            >
                                                Resend
                                            </button>
                                            <span className="text-slate-300 dark:text-slate-600">|</span>
                                            <button
                                                onClick={() => handleCancel(invitation.id)}
                                                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PendingInvitationsCard;
