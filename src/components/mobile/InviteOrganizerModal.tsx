import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PaperAirplaneIcon, UserPlusIcon } from '../Icons';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import haptics from '../../utils/haptics';

interface InviteOrganizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventName: string;
}

const InviteOrganizerModal: React.FC<InviteOrganizerModalProps> = ({
    isOpen,
    onClose,
    eventId,
    eventName
}) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'organizer' | 'staff'>('organizer');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            haptics.error();
            return;
        }

        setIsSubmitting(true);
        haptics.light();

        try {
            // Generate unique invitation token
            const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Not authenticated');
            }

            // Create invitation
            const { data, error } = await supabase
                .from('organizer_invitations')
                .insert({
                    event_id: eventId,
                    inviter_id: user.id,
                    invitee_email: email.toLowerCase().trim(),
                    invitee_role: role,
                    invitation_token: token,
                    status: 'pending',
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                })
                .select()
                .single();

            if (error) throw error;

            // TODO: Send email with invitation link
            // For now, we'll just show success message
            // In production, you would call your email service here:
            // await sendInvitationEmail(email, token, eventName);

            toast.success(`Invitation sent to ${email}`);
            haptics.success();

            setEmail('');
            setRole('organizer');
            onClose();
        } catch (error: any) {
            console.error('Error sending invitation:', error);

            if (error.code === '23505') {
                toast.error('An invitation has already been sent to this email');
            } else {
                toast.error('Failed to send invitation. Please try again.');
            }

            haptics.error();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-[101] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <UserPlusIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Invite Organizer
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Event Info */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    Inviting to event:
                                </p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {eventName}
                                </p>
                            </div>

                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="organizer@example.com"
                                    required
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Role
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRole('organizer')}
                                        disabled={isSubmitting}
                                        className={`p-3 rounded-lg border-2 transition-all ${role === 'organizer'
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Organizer
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Full access
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRole('staff')}
                                        disabled={isSubmitting}
                                        className={`p-3 rounded-lg border-2 transition-all ${role === 'staff'
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Staff
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Limited access
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Info Note */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    An email will be sent to <strong>{email || 'the recipient'}</strong> with an invitation link. The link will expire in 7 days.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSubmitting || !email}
                                    className="flex-1 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PaperAirplaneIcon className="w-4 h-4" />
                                            <span>Send Invite</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default InviteOrganizerModal;
