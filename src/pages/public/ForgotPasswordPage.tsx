import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { AppRoute } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Card from '../../components/ui/Card';
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import { CheckCircleIcon } from '../../components/Icons';
import toast from 'react-hot-toast';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/set-password`,
            });

            if (resetError) {
                throw resetError;
            }

            setEmailSent(true);
            toast.success('Recovery email sent! Check your inbox.');
        } catch (err: any) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to send recovery email. Please try again.');
            toast.error('Failed to send recovery email');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <BackgroundGradient />

                <Card className="max-w-md w-full mx-4 relative z-10">
                    <div className="text-center py-8">
                        <div className="flex items-center justify-center mb-6">
                            <CheckCircleIcon className="w-20 h-20 text-green-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-100 mb-3">
                            Check Your Email
                        </h2>

                        <p className="text-slate-300 mb-6">
                            We've sent a password recovery link to <strong className="text-primary-400">{email}</strong>
                        </p>

                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
                            <p className="text-sm text-slate-300 mb-2">
                                📧 Didn't receive the email?
                            </p>
                            <ul className="text-xs text-slate-400 space-y-1 text-left list-disc list-inside">
                                <li>Check your spam folder</li>
                                <li>Make sure {email} is correct</li>
                                <li>Wait a few minutes and check again</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={() => {
                                    setEmailSent(false);
                                    setEmail('');
                                }}
                                variant="secondary"
                                className="w-full"
                            >
                                Try Different Email
                            </Button>

                            <Link to={AppRoute.Login}>
                                <Button variant="secondary" className="w-full">
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <BackgroundGradient />

            <Card className="max-w-md w-full mx-4 relative z-10">
                <div className="text-center mb-6">
                    <LyVentumLogo className="h-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-100 mb-2">
                        🔐 Forgot Password?
                    </h1>
                    <p className="text-sm text-slate-400">
                        Enter your email and we'll send you a recovery link
                    </p>
                </div>

                {error && (
                    <Alert type="error" className="mb-4" message={error} />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your.email@example.com"
                        disabled={isLoading}
                        autoComplete="email"
                        autoFocus
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isLoading || !email.trim()}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Sending...
                            </span>
                        ) : (
                            'Send Recovery Link'
                        )}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                    <p className="text-sm text-slate-400">
                        Remember your password?{' '}
                        <Link
                            to={AppRoute.Login}
                            className="text-primary-400 hover:text-primary-300 font-semibold"
                        >
                            Back to Login
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;
