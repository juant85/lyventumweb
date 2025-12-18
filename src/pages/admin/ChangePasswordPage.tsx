import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { AppRoute } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Card from '../../components/ui/Card';
import { CheckCircleIcon, ArrowLeftIcon } from '../../components/Icons';
import toast from 'react-hot-toast';

const ChangePasswordPage: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Password strength calculation (same as SetPasswordPage)
    const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; score: number } => {
        if (pwd.length === 0) return { strength: 'weak', score: 0 };

        let score = 0;

        // Length
        if (pwd.length >= 8) score += 25;
        if (pwd.length >= 12) score += 25;

        // Complexity
        if (/[a-z]/.test(pwd)) score += 10;
        if (/[A-Z]/.test(pwd)) score += 10;
        if (/[0-9]/.test(pwd)) score += 15;
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;

        if (score < 40) return { strength: 'weak', score };
        if (score < 70) return { strength: 'medium', score };
        return { strength: 'strong', score };
    };

    const passwordStrength = getPasswordStrength(newPassword);
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validations
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (passwordStrength.strength === 'weak') {
            setError('Please choose a stronger password.');
            return;
        }

        setIsLoading(true);

        try {
            // First, verify current password by attempting sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: currentUser?.email || '',
                password: currentPassword,
            });

            if (signInError) {
                throw new Error('Current password is incorrect');
            }

            // Update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
            toast.success('Password changed successfully!');

            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Navigate back after a moment
            setTimeout(() => {
                navigate(-1); // Go back to previous page
            }, 2000);

        } catch (err: any) {
            console.error('Error changing password:', err);
            setError(err.message || 'Failed to change password. Please try again.');
            toast.error('Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        navigate(AppRoute.Login);
        return null;
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                <Card className="max-w-md w-full mx-4">
                    <div className="text-center py-8">
                        <div className="flex items-center justify-center mb-6">
                            <CheckCircleIcon className="w-20 h-20 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                            Password Changed!
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            Your password has been updated successfully.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Returning to previous page...
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
            <Card className="max-w-md w-full">
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Back
                    </button>

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        🔐 Change Password
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Update your password to keep your account secure
                    </p>
                </div>

                {error && (
                    <Alert type="error" className="mb-4" message={error} />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Current Password */}
                    <Input
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Enter your current password"
                        disabled={isLoading}
                        autoComplete="current-password"
                    />

                    {/* New Password */}
                    <div>
                        <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="At least 8 characters"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />

                        {/* Password Strength Indicator */}
                        {newPassword && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${passwordStrength.strength === 'weak'
                                                    ? 'bg-red-500'
                                                    : passwordStrength.strength === 'medium'
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                }`}
                                            style={{ width: `${passwordStrength.score}%` }}
                                        />
                                    </div>
                                    <span
                                        className={`text-xs font-semibold ${passwordStrength.strength === 'weak'
                                                ? 'text-red-500'
                                                : passwordStrength.strength === 'medium'
                                                    ? 'text-yellow-500'
                                                    : 'text-green-500'
                                            }`}
                                    >
                                        {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter your new password"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />

                        {/* Match Indicator */}
                        {confirmPassword && (
                            <div className="mt-2">
                                {passwordsMatch ? (
                                    <p className="text-xs text-green-500 flex items-center gap-1">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Passwords match
                                    </p>
                                ) : (
                                    <p className="text-xs text-red-500">
                                        Passwords do not match
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Updating Password...
                            </span>
                        ) : (
                            'Update Password'
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ChangePasswordPage;
