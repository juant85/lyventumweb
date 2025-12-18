import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Attendee } from '../../../types';
import { accessCodeService } from '../../../services/accessCodeService';
import { emailTrackingService } from '../../../services/emailTrackingService';
import { svgToPng } from '../../../utils/chartToImage';
import AttendeeBadge from '../../AttendeeBadge';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { DocumentArrowDownIcon, KeyIcon } from '../../Icons';

interface AccessControlCardProps {
    attendee: Attendee;
    eventId: string;
}

export default function AccessControlCard({ attendee, eventId }: AccessControlCardProps) {
    const qrCodeRef = useRef<HTMLDivElement>(null);
    const [currentCode, setCurrentCode] = useState<any>(null);
    const [tracking, setTracking] = useState<any>(null);
    const [loadingCode, setLoadingCode] = useState(true);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (attendee.id && eventId) {
            fetchCode();
        }
    }, [attendee.id, eventId]);

    const fetchCode = async () => {
        try {
            const code = await accessCodeService.getCurrentCode(attendee.id, eventId);
            setCurrentCode(code);

            // Load tracking status
            const trackingStatus = await emailTrackingService.getTrackingStatus(attendee.id, eventId);
            setTracking(trackingStatus);
        } catch (error) {
            console.error('Error fetching code:', error);
        } finally {
            setLoadingCode(false);
        }
    };

    const handleDownloadQR = async () => {
        if (!qrCodeRef.current) {
            toast.error('QR Code element not found.');
            return;
        }

        const svgElement = qrCodeRef.current.querySelector('svg');
        if (!svgElement) {
            toast.error('Could not find SVG QR code to download.');
            return;
        }

        const toastId = toast.loading('Generating QR Code image...');
        try {
            const dataUrl = await svgToPng(svgElement, 256, 256);
            const link = document.createElement('a');
            link.download = `QRCode_${attendee.name.replace(/\s/g, '_')}_${attendee.id}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('QR Code downloaded!', { id: toastId });
        } catch (error) {
            console.error('Failed to generate QR code PNG:', error);
            toast.error('Could not generate QR code image.', { id: toastId });
        }
    };

    const handleResend = async () => {
        if (!attendee.email) return;
        setResending(true);
        try {
            await accessCodeService.createAndSendCode({
                email: attendee.email,
                attendeeId: attendee.id,
                eventId: eventId,
            });
            toast.success(`✅ Code resent to ${attendee.email}!`);
            await fetchCode(); // Refresh
        } catch (error: any) {
            console.error('Error resending code:', error);
            toast.error('Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    const handleCopy = async () => {
        if (!currentCode?.code) return;
        try {
            await navigator.clipboard.writeText(currentCode.code);
            toast.success('Code copied!');
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    return (
        <Card title="Event Access" icon={<KeyIcon className="w-5 h-5 text-slate-400" />}>
            <div className="space-y-6">
                {/* Badge Section */}
                <div className="space-y-4">
                    <AttendeeBadge attendee={attendee} qrCodeRef={qrCodeRef} />
                    <Button
                        onClick={handleDownloadQR}
                        variant="secondary"
                        className="w-full"
                        leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
                    >
                        Download Badge QR
                    </Button>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

                {/* Access Code Section */}
                {loadingCode ? (
                    <div className="text-center py-4 text-slate-500">Loading access details...</div>
                ) : (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Digital Access Code</h4>

                        {currentCode && currentCode.status !== 'none' ? (
                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                                            {currentCode.code}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Expires: {new Date(currentCode.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500"
                                        title="Copy Code"
                                    >
                                        📋
                                    </button>
                                </div>

                                {/* Email Tracking Status */}
                                {tracking && (
                                    <div className="text-xs space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Email Status:</span>
                                            <div className="flex items-center gap-2">
                                                {tracking.status === 'sent' && <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-medium">Sent</span>}
                                                {tracking.status === 'delivered' && <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium">Delivered</span>}
                                                {tracking.status === 'opened' && <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 font-medium">Opened</span>}
                                                {tracking.status === 'clicked' && <span className="px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 font-medium">Clicked</span>}
                                                {tracking.status === 'failed' && <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 font-medium">Failed</span>}
                                            </div>
                                        </div>
                                        {tracking.openedAt && (
                                            <p className="text-right text-purple-600 dark:text-purple-400">
                                                By user at {new Date(tracking.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <Button
                                    onClick={handleResend}
                                    disabled={resending || !attendee.email}
                                    className="w-full"
                                    variant="primary"
                                >
                                    {resending ? 'Sending Email...' : '📧 Resend Access Email'}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-lg dashed border border-slate-300 dark:border-slate-700">
                                <p className="text-slate-500 mb-3 text-sm">No code generated yet</p>
                                <Button
                                    onClick={handleResend}
                                    disabled={resending || !attendee.email}
                                    variant="primary"
                                    size="sm"
                                >
                                    {resending ? 'Generating...' : 'Generate & Send Code'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
