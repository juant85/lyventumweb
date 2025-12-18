import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { AppRoute } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Card from '../../components/ui/Card';
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon } from '../../components/Icons';

const SetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordSet, setPasswordSet] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const navigate = useNavigate();

    // Password strength calculation
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

    const passwordStrength = getPasswordStrength(password);
    const passwordsMatch = password && confirmPassword && password === confirmPassword;

    // Check if user has a valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            try {
                // Check if there's an active session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    setError('Failed to validate session. Please try the link from your email again.');
                    setTokenValid(false);
                    return;
                }

                // If no session, check the hash for recovery type
                if (!session) {
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const type = hashParams.get('type');

                    if (type === 'recovery') {
                        // Token is in URL but session not established yet - wait a moment
                        setTimeout(() => checkSession(), 500);
                        return;
                    }

                    setError('No active session found. Please use the link from your email.');
                    setTokenValid(false);
                    return;
                }

                // Session exists - valid for password setup
                console.log('[SetPasswordPage] Valid session found, user can set password');
                setTokenValid(true);

            } catch (err) {
                console.error('Session check error:', err);
                setError('Failed to validate session. Please try again.');
                setTokenValid(false);
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validations
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (passwordStrength.strength === 'weak') {
            setError('Please choose a stronger password.');
            return;
        }

        setIsLoading(true);

        try {
            // Update user's password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                throw updateError;
            }

            // Success - password has been set
            setPasswordSet(true);
            toast.success('Password set successfully! Logging you in...');

            // Wait a moment for the session to be established
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Navigate to dashboard
            navigate(AppRoute.Dashboard);

        } catch (err: any) {
            console.error('Error setting password:', err);

            if (err.message?.includes('expired')) {
                setError('This link has expired. Please request a new password setup link from your administrator.');
            } else {
                setError(err.message || 'Failed to set password. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while checking token
    if (tokenValid === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <BackgroundGradient />
                <Card className="max-w-md w-full mx-4">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                        <p className="text-slate-400">Validating your link...</p>
                    </div>
                </Card>
            </div>
        );
    }

    // Invalid token state
    if (tokenValid === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <BackgroundGradient />
                <Card className="max-w-md w-full mx-4">
                    <div className="text-center mb-6">
                        <LyVentumLogo className="h-12 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-slate-100 mb-2">Invalid Link</h1>
                    </div>

                    <Alert type="error" className="mb-4" message={error} />

                    <div className="text-center">
                        <p className="text-sm text-slate-400 mb-4">
                            Please contact your administrator to request a new password setup link.
                        </p>
                        <Button
                            variant="secondary"
                            onClick={() => navigate(AppRoute.Login)}
                            className="w-full"
                        >
                            Go to Login
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Success state
    if (passwordSet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <BackgroundGradient />
                <Card className="max-w-md w-full mx-4">
                    <div className="text-center py-8">
                        <div className="flex items-center justify-center mb-6">
                            <CheckCircleIcon className="w-20 h-20 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-3">Password Set Successfully!</h2>
                        <p className="text-slate-300 mb-6">
                            Logging you in to your dashboard...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    </div>
                </Card>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <BackgroundGradient />

            <Card className="max-w-md w-full mx-4 relative z-10">
                <div className="text-center mb-6">
                    <LyVentumLogo className="h-12 mx-auto mb-4" />
                    <div className="flex items-center justify-center mb-2">
                        <h1 className="text-2xl font-bold text-slate-100">🔐 Set Your Password</h1>
                    </div>
                    <p className="text-sm text-slate-400">
                        Welcome! Create a secure password for your LyVentum account.
                    </p>
                </div>

                {error && (
                    <Alert type="error" className="mb-4" message={error} />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Password Input */}
                    <div>
                        <Input
                            label="New Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="At least 8 characters"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />

                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
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

                    {/* Confirm Password Input */}
                    <div>
                        <Input
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter your password"
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

                    {/* Password Requirements */}
                    <Alert
                        type="info"
                        className="text-xs"
                        message={
                            <div>
                                <p className="font-semibold mb-1">Password requirements:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li className={password.length >= 8 ? 'text-green-400' : ''}>
                                        At least 8 characters
                                    </li>
                                    <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-400' : ''}>
                                        Mix of uppercase and lowercase letters (recommended)
                                    </li>
                                    <li className={/[0-9]/.test(password) ? 'text-green-400' : ''}>
                                        Include numbers (recommended)
                                    </li>
                                </ul>
                            </div>
                        }
                    />

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isLoading || !password || !confirmPassword || !passwordsMatch}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Setting Password...
                            </span>
                        ) : (
                            'Set Password & Log In'
                        )}
                    </Button>
                </form>

                {/* Help Section */}
                <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                    <p className="text-xs text-slate-400">
                        Having trouble?{' '}
                        If you did not request this, please contact <a href="mailto:lyventum@gmail.com" className="text-primary-600 hover:text-primary-500 font-medium">support</a> immediately.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default SetPasswordPage;
