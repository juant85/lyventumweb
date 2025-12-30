import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { accessCodeService } from '../../services/accessCodeService';
import { supabase } from '../../supabaseClient';
import { AppRoute } from '../../types';

export default function AttendeeAccessPage() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Auto-fill code from URL if present
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const codeFromUrl = params.get('code');

        if (codeFromUrl && /^\d{6}$/.test(codeFromUrl)) {
            setCode(codeFromUrl);

            // Optional: Auto-submit after 1 second for better UX
            setTimeout(() => {
                // Create a dummy event object that satisfies React.FormEvent
                const dummyEvent: React.FormEvent = {
                    preventDefault: () => { }, // No-op for programmatic submission
                    currentTarget: document.createElement('form'), // Dummy element
                    target: document.createElement('form'), // Dummy element
                    bubbles: false,
                    cancelable: false,
                    defaultPrevented: false,
                    eventPhase: 0,
                    isDefaultPrevented: () => false,
                    isPropagationStopped: () => false,
                    isTrusted: false,
                    nativeEvent: new Event('submit'),
                    persist: () => { },
                    stopPropagation: () => { },
                    timeStamp: Date.now(),
                    type: 'submit',
                };
                handleSubmit(dummyEvent);
            }, 1000);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (code.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setLoading(true);

        try {
            // 1. Validate code and get attendee info
            const result = await accessCodeService.validateCode(code);

            if (!result.valid) {
                toast.error(result.error || 'Invalid code');
                setLoading(false);
                return;
            }

            if (!result.attendeeId || !result.eventId) {
                toast.error('Invalid code data');
                setLoading(false);
                return;
            }

            // Create session using validation result data
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

            // Small delay to show the success message
            setTimeout(() => {
                navigate('/portal/dashboard');
            }, 1000);

        } catch (error: any) {
            console.error('Access error:', error);
            toast.error('Failed to validate code');
            setLoading(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-500">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Event Access
                    </h1>
                    <p className="text-white/80">
                        Enter your 6-digit access code
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
                                Access Code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={handleCodeChange}
                                className="w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] border-2 border-slate-300 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all outline-none"
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                                disabled={loading}
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Check your email for the 6-digit code
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={code.length !== 6 || loading}
                            className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white transition-all
                ${code.length === 6 && !loading
                                    ? 'bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                    : 'bg-slate-300 cursor-not-allowed'
                                }
              `}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                'Access Event'
                            )}
                        </button>
                    </form>

                    {/* Help */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600">
                            Don't have a code?{' '}
                            <button
                                onClick={() => navigate(AppRoute.AttendeePortalLogin)}
                                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
                            >
                                Request one
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-white/70 text-sm">
                    <p>🔒 Secure access provided by LyVenTum</p>
                </div>
            </div>
        </div>
    );
}
