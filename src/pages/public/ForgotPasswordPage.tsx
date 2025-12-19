import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { AppRoute } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import { CheckCircleIcon } from '../../components/Icons';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

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
            <div
                className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden"
                style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

                <div className="w-full max-w-md relative z-10 box-border">
                    <div className="text-center mb-8">
                        <Link to={AppRoute.Landing} className="inline-block group">
                            <LyVentumLogo className="h-12 w-auto filter drop-shadow-[0_4px_10px_rgba(59,130,246,0.25)] dark:drop-shadow-[0_5px_15px_rgba(96,165,250,0.25)] transition-transform duration-300 group-hover:scale-105" />
                        </Link>
                    </div>

                    <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 backdrop-blur-xl rounded-[22px] p-6 sm:p-8 border border-white/10 shadow-2xl">
                        <div className="text-center">
                            <div className="relative inline-flex items-center justify-center mb-6">
                                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                                <CheckCircleIcon className="w-20 h-20 text-green-400 relative z-10 drop-shadow-[0_4px_8px_rgba(34,197,94,0.5)]" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200 mb-3 font-montserrat">
                                Check Your Email
                            </h2>

                            <p className="text-slate-300 mb-8 leading-relaxed">
                                We've sent a password recovery link to<br />
                                <strong className="text-primary-400 font-medium block mt-1 text-lg">{email}</strong>
                            </p>

                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-8 text-left">
                                <div className="flex items-start">
                                    <span className="text-xl mr-3 mt-0.5">📧</span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-200 mb-1">
                                            Didn't receive the email?
                                        </p>
                                        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                                            <li>Check your spam folder</li>
                                            <li>Verify the email address is correct</li>
                                            <li>Wait a few minutes and try again</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => {
                                        setEmailSent(false);
                                        setEmail('');
                                    }}
                                    variant="ghost"
                                    className="w-full text-slate-400 hover:text-white"
                                >
                                    Try Different Email
                                </Button>

                                <Link to={AppRoute.Login} className="block w-full">
                                    <Button variant="primary" className="w-full shadow-lg shadow-primary-900/20 py-3">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </BackgroundGradient>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden"
            style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}
        >
            {/* Decorative gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

            <div className="w-full max-w-md relative z-10 box-border">
                <div className="text-center mb-8">
                    <Link to={AppRoute.Landing} className="inline-block group">
                        <LyVentumLogo className="h-12 w-auto filter drop-shadow-[0_4px_10px_rgba(59,130,246,0.25)] dark:drop-shadow-[0_5px_15px_rgba(96,165,250,0.25)] transition-transform duration-300 group-hover:scale-105" />
                    </Link>
                </div>

                <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 backdrop-blur-xl rounded-[22px] p-6 sm:p-8 border border-white/10 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200 mb-2 font-montserrat">
                            Forgot Password?
                        </h1>
                        <p className="text-slate-400">
                            Enter your email and we'll send you a recovery link
                        </p>
                    </div>

                    {error && (
                        <Alert type="error" className="mb-6" message={error} />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your.email@example.com"
                            wrapperClassName="!mb-0"
                            disabled={isLoading}
                            autoComplete="email"
                            autoFocus
                            className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:ring-primary-500/20"
                            labelClassName="text-slate-300"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3 shadow-lg shadow-primary-900/20"
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

                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <p className="text-sm text-slate-400">
                            Remember your password?{' '}
                            <Link
                                to={AppRoute.Login}
                                className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                            >
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </BackgroundGradient>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
