import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { UserIcon } from '../../components/Icons';
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { accessCodeService } from '../../services/accessCodeService';
import { supabase } from '../../supabaseClient';

const AttendeeLoginPage: React.FC = () => {
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [showResend, setShowResend] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { selectedEventId } = useSelectedEvent();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Auto-fill code from URL if present AND auto-submit
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const codeFromUrl = params.get('code');
        if (codeFromUrl && /^\d{6}$/.test(codeFromUrl)) {
            setCode(codeFromUrl);
            // Auto-submit after setting code
            setTimeout(() => {
                handleCodeSubmit(null, codeFromUrl);
            }, 500); // Small delay to ensure state is set
        }
    }, []);

    const handleCodeSubmit = async (e: FormEvent | null, urlCode?: string) => {
        if (e) e.preventDefault();
        setFeedback(null);

        const codeToValidate = urlCode || code;

        if (codeToValidate.length !== 6) {
            setFeedback({ type: 'error', message: 'Please enter a 6-digit code' });
            return;
        }

        setIsLoading(true);

        try {
            // Validate code
            const result = await accessCodeService.validateCode(codeToValidate);

            if (!result.valid) {
                setFeedback({ type: 'error', message: result.error || 'Invalid code' });
                setIsLoading(false);
                return;
            }

            if (!result.attendeeId || !result.eventId) {
                setFeedback({ type: 'error', message: 'Invalid code data' });
                setIsLoading(false);
                return;
            }

            // Create session using data from validateCode
            localStorage.setItem('attendee_login', JSON.stringify({
                type: 'access_code',
                attendeeId: result.attendeeId,
                attendeeName: result.attendeeName || '',
                attendeeEmail: result.email || '',
                attendeeOrganization: result.organization || 'Independent',
                eventId: result.eventId,
                loginTime: new Date().toISOString()
            }));

            toast.success(`✅ Welcome${result.attendeeName ? `, ${result.attendeeName}` : ''}!`);

            setTimeout(() => {
                navigate('/portal/dashboard');
            }, 1000);

        } catch (error: any) {
            console.error('Access error:', error);
            setFeedback({ type: 'error', message: 'Failed to validate code' });
            setIsLoading(false);
        }
    };

    const handleResendSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        if (!email) {
            setFeedback({ type: 'error', message: 'Please enter your email address' });
            return;
        }

        if (!selectedEventId) {
            setFeedback({ type: 'error', message: 'No event selected' });
            return;
        }

        setIsLoading(true);

        try {
            // Find attendee by email
            const { data: attendee, error: attendeeError } = await supabase
                .from('attendees')
                .select('id, email, name')
                .eq('email', email.toLowerCase().trim())
                .eq('event_id', selectedEventId)
                .maybeSingle();

            if (attendeeError || !attendee) {
                setFeedback({ type: 'error', message: 'No attendee found with this email for the selected event' });
                setIsLoading(false);
                return;
            }

            // Generate and send new code
            const result = await accessCodeService.createAndSendCode({
                email: attendee.email,
                attendeeId: attendee.id,
                eventId: selectedEventId
            });

            if (result.success) {
                setFeedback({ type: 'success', message: '✅ Access code sent! Check your email.' });
                toast.success('Access code sent to your email!');
                setEmail('');
                // Switch back to code input
                setTimeout(() => {
                    setShowResend(false);
                    setFeedback(null);
                }, 3000);
            } else {
                setFeedback({ type: 'error', message: result.message || 'Failed to send code' });
            }
        } catch (error: any) {
            console.error('Resend error:', error);
            setFeedback({ type: 'error', message: 'Failed to send access code' });
        }

        setIsLoading(false);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
    };

    return (
        <div
            className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}
        >
            <div className="max-w-md w-full space-y-8">
                <div className="text-center mb-10">
                    <Link to={AppRoute.Landing} className="inline-block group">
                        <LyVentumLogo className="h-20 w-auto filter drop-shadow-[0_4px_10px_rgba(59,130,246,0.25)] dark:drop-shadow-[0_5px_15px_rgba(96,165,250,0.25)] transition-transform duration-300 group-hover:scale-105" />
                        <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white font-montserrat">
                            LyVenTum
                        </p>
                    </Link>
                </div>

                <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 backdrop-blur-md rounded-[22px] p-4 sm:p-8 space-y-6">
                    {!showResend ? (
                        <>
                            {/* Code Input Mode */}
                            <div className="text-center">
                                <UserIcon className="w-10 h-10 mx-auto text-primary-400 mb-2" />
                                <h2 className="text-2xl font-bold text-slate-100">
                                    Event Access
                                </h2>
                                <p className="text-slate-400 mt-2 text-sm">
                                    Enter your 6-digit access code
                                </p>
                                <p className="text-slate-500 mt-1 text-xs">
                                    Check your email for the code sent after check-in
                                </p>
                            </div>

                            {feedback && <Alert type={feedback.type} message={feedback.message} className="my-4" />}

                            <form onSubmit={handleCodeSubmit} className="space-y-6">
                                <div>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={handleCodeChange}
                                        className="w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] bg-slate-800 border-2 border-slate-600 rounded-xl text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all outline-none"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="secondary"
                                    className="w-full !py-3"
                                    disabled={code.length !== 6 || isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Access Event'}
                                </Button>
                            </form>

                            <div className="text-center pt-4 border-t border-slate-700">
                                <button
                                    onClick={() => setShowResend(true)}
                                    className="text-sm text-slate-400 hover:text-white hover:underline transition-colors"
                                >
                                    Lost your code? Request a new one →
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Email Input Mode (Resend) */}
                            <div className="text-center">
                                <UserIcon className="w-10 h-10 mx-auto text-primary-400 mb-2" />
                                <h2 className="text-2xl font-bold text-slate-100">
                                    Request New Code
                                </h2>
                                <p className="text-slate-400 mt-2 text-sm">
                                    Enter your email to receive a new access code
                                </p>
                            </div>

                            {feedback && <Alert type={feedback.type} message={feedback.message} className="my-4" />}

                            <form onSubmit={handleResendSubmit} className="space-y-6">
                                <Input
                                    id="attendee-email"
                                    label={t(localeKeys.emailLabel)}
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    wrapperClassName="!mb-0"
                                    disabled={isLoading}
                                />
                                <Button type="submit" variant="secondary" className="w-full !py-3" disabled={isLoading}>
                                    {isLoading ? 'Sending...' : 'Send New Code'}
                                </Button>
                            </form>

                            <div className="text-center pt-4 border-t border-slate-700">
                                <button
                                    onClick={() => {
                                        setShowResend(false);
                                        setFeedback(null);
                                        setEmail('');
                                    }}
                                    className="text-sm text-slate-400 hover:text-white hover:underline transition-colors"
                                >
                                    ← Back to code entry
                                </button>
                            </div>
                        </>
                    )}
                </BackgroundGradient>

                <div className="text-center">
                    <Link to={AppRoute.Login} className="text-sm text-slate-400 hover:text-white hover:underline transition-colors">
                        {t(localeKeys.areYouAnOrganizer)}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AttendeeLoginPage;