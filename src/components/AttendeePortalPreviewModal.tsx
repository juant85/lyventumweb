// src/components/AttendeePortalPreviewModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Attendee, SessionRegistration } from '../types';
import { useEventData } from '../contexts/EventDataContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import { toast } from 'react-hot-toast';
import { ArrowPathIcon, BuildingStorefrontIcon, PresentationChartLineIcon, PrinterIcon } from '../components/Icons';
import AttendeeBadge from './AttendeeBadge';
import Alert from './ui/Alert';
import Card from './ui/Card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

interface AttendeePortalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendee: Attendee | null;
}

type AttendeeAgendaItem = SessionRegistration & { 
    sessionName: string; 
    sessionStartTime: string; 
    boothName?: string;
    boothDetails?: { physicalId: string; };
};

const AttendeePortalPreviewModal: React.FC<AttendeePortalPreviewModalProps> = ({ isOpen, onClose, attendee }) => {
    const { getSessionRegistrationsForAttendee } = useEventData();
    const { currentEvent } = useSelectedEvent();
    const [agenda, setAgenda] = useState<AttendeeAgendaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && attendee) {
            setIsLoading(true);
            setError(null);
            getSessionRegistrationsForAttendee(attendee.id)
                .then(result => {
                    if (result.success) {
                        const sortedAgenda = (result.data as AttendeeAgendaItem[]).sort((a, b) => 
                            new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime()
                        );
                        setAgenda(sortedAgenda);
                    } else {
                        setError(result.message || "Failed to load attendee's agenda.");
                        toast.error(result.message || "Failed to load attendee's agenda.");
                    }
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, attendee, getSessionRegistrationsForAttendee]);

    const generatePdf = async () => {
        if (!attendee || !currentEvent) {
            toast.error("Required data is not available.");
            return;
        }

        const toastId = toast.loading('Generating your personalized PDF...');
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'in',
                format: 'letter'
            });
            doc.deletePage(1); 

            // --- DEFINE STYLES & HELPERS ---
            const FONT_SANS = 'helvetica';
            const PRIMARY_COLOR = '#2563EB'; // Blue-600
            const TEXT_COLOR_DARK = '#0F172A'; // Slate-900
            const TEXT_COLOR_MEDIUM = '#475569'; // Slate-600
            const TEXT_COLOR_WHITE = '#FFFFFF';
            const ROLE_COLORS = {
                attendee: '#2563EB', // Blue-600
                vendor: '#7C3AED',   // Violet-600
            };
            const BADGE_WIDTH_IN = 3.5;
            const BADGE_HEIGHT_IN = 5.5;

            const imageToDataUrlWithDims = (url: string): Promise<{data: string, w: number, h: number}> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width; canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return resolve({data: '', w: 0, h: 0});
                        ctx.drawImage(img, 0, 0);
                        resolve({data: canvas.toDataURL('image/png'), w: img.width, h: img.height});
                    };
                    img.onerror = () => resolve({data: '', w: 0, h: 0});
                    img.src = url;
                });
            };
            
            const getLogoDisplayDimensions = (originalW: number, originalH: number, maxHeight: number): {w: number, h: number} => {
                if (!originalW || !originalH) return {w: maxHeight, h: maxHeight};
                const aspectRatio = originalW / originalH;
                const newWidth = maxHeight * aspectRatio;
                const maxAllowedWidth = 1.5; // Prevent single logo from taking too much horizontal space
                if (newWidth > maxAllowedWidth) {
                    return { w: maxAllowedWidth, h: maxAllowedWidth / aspectRatio };
                }
                return { w: newWidth, h: maxHeight };
            };

            const [companyLogoResult, eventLogoResult] = await Promise.all([
                currentEvent.companyLogoUrl ? imageToDataUrlWithDims(currentEvent.companyLogoUrl) : Promise.resolve(null),
                currentEvent.eventLogoUrl ? imageToDataUrlWithDims(currentEvent.eventLogoUrl) : Promise.resolve(null),
            ]);

            // ===================================
            // =========== PAGE 1: BADGE ===========
            // ===================================
            doc.addPage([BADGE_WIDTH_IN, BADGE_HEIGHT_IN]);
            const margin = 0.25;

            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, BADGE_WIDTH_IN, BADGE_HEIGHT_IN, 'F');
            
            // Header with Logos
            const logoMaxHeight = 0.5;
            if (companyLogoResult && companyLogoResult.data) {
                const dims = getLogoDisplayDimensions(companyLogoResult.w, companyLogoResult.h, logoMaxHeight);
                doc.addImage(companyLogoResult.data, 'PNG', margin, 0.2, dims.w, dims.h, undefined, 'FAST');
            }
            if (eventLogoResult && eventLogoResult.data) {
                const dims = getLogoDisplayDimensions(eventLogoResult.w, eventLogoResult.h, logoMaxHeight);
                doc.addImage(eventLogoResult.data, 'PNG', BADGE_WIDTH_IN - margin - dims.w, 0.2, dims.w, dims.h, undefined, 'FAST');
            }
            
            // QR Code
            const qrSize = 1.8;
            const qrX = (BADGE_WIDTH_IN - qrSize) / 2;
            const qrY = 1.0;
            const qrCodeDataUrl = await QRCode.toDataURL(attendee.id, {
                errorCorrectionLevel: 'H', margin: 1, width: 400, color: { dark: '#000000', light: '#FFFFFFFF' }
            });
            doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

            // Attendee Name & Organization
            const nameY = qrY + qrSize + 0.45;
            doc.setFont(FONT_SANS, 'bold');
            doc.setFontSize(28); // Reduced size
            doc.setTextColor(TEXT_COLOR_DARK);
            const nameLines = doc.splitTextToSize(attendee.name, BADGE_WIDTH_IN - (margin * 2));
            doc.text(nameLines, BADGE_WIDTH_IN / 2, nameY, { align: 'center', lineHeightFactor: 1.1 });

            const nameHeight = nameLines.length * (28 * 1.1) / 72; // Adjusted calculation for new font size
            const orgY = nameY + nameHeight;
            doc.setFontSize(16); // Reduced size
            doc.setFont(FONT_SANS, 'normal');
            doc.setTextColor(TEXT_COLOR_MEDIUM);
            const orgLines = doc.splitTextToSize(attendee.organization || 'No Organization', BADGE_WIDTH_IN - (margin*2));
            doc.text(orgLines, BADGE_WIDTH_IN / 2, orgY, { align: 'center' });

            // Role Indicator Bar
            const roleColor = attendee.is_vendor ? ROLE_COLORS.vendor : ROLE_COLORS.attendee;
            doc.setFillColor(roleColor);
            doc.rect(0, BADGE_HEIGHT_IN - 0.25, BADGE_WIDTH_IN, 0.25, 'F');
            doc.setFont(FONT_SANS, 'bold');
            doc.setFontSize(10);
            doc.setTextColor(TEXT_COLOR_WHITE);
            doc.text((attendee.is_vendor ? 'VENDOR / STAFF' : 'ATTENDEE'), BADGE_WIDTH_IN / 2, BADGE_HEIGHT_IN - 0.1, { align: 'center' });

            // ===================================
            // ======== PAGE 2+: AGENDA ==========
            // ===================================
            if (agenda.length > 0) {
                doc.addPage('letter');
                const agendaPageWidth = doc.internal.pageSize.getWidth();
                const agendaMargin = 0.5;
                
                // Agenda Header with Logos
                const agendaLogoMaxHeight = 0.75; // Enlarged
                if(companyLogoResult && companyLogoResult.data) {
                    const dims = getLogoDisplayDimensions(companyLogoResult.w, companyLogoResult.h, agendaLogoMaxHeight);
                    doc.addImage(companyLogoResult.data, 'PNG', agendaMargin, 0.4, dims.w, dims.h, undefined, 'FAST');
                }
                if(eventLogoResult && eventLogoResult.data) {
                    const dims = getLogoDisplayDimensions(eventLogoResult.w, eventLogoResult.h, agendaLogoMaxHeight);
                    doc.addImage(eventLogoResult.data, 'PNG', agendaPageWidth - agendaMargin - dims.w, 0.4, dims.w, dims.h, undefined, 'FAST');
                }
                
                let lastFinalY = agendaLogoMaxHeight + 0.5;
                doc.setFontSize(28); // New Title Size
                doc.setFont(FONT_SANS, 'bold');
                doc.setTextColor(TEXT_COLOR_DARK);
                doc.text('Your Personalized Agenda', agendaPageWidth / 2, lastFinalY, { align: 'center' });
                lastFinalY += 0.4;
                
                // Group agenda items by date
                const groupedAgenda = agenda.reduce((acc, item) => {
                    const itemDate = new Date(item.sessionStartTime);
                    // Use a consistent timezone-agnostic date string for grouping
                    const dateKey = `${itemDate.getUTCFullYear()}-${itemDate.getUTCMonth()}-${itemDate.getUTCDate()}`;
                    if (!acc.has(dateKey)) {
                        acc.set(dateKey, { date: itemDate, items: [] });
                    }
                    acc.get(dateKey)!.items.push(item);
                    return acc;
                }, new Map<string, { date: Date; items: AttendeeAgendaItem[] }>());

                let dayCounter = 1;
                for (const [_, group] of groupedAgenda.entries()) {
                    // Day Header
                    const dayHeaderText = `Day ${dayCounter} - ${group.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}`;
                    doc.setFontSize(14);
                    doc.setFont(FONT_SANS, 'bold');
                    doc.setTextColor(PRIMARY_COLOR);
                    doc.text(dayHeaderText, agendaMargin, lastFinalY + 0.2);
                    lastFinalY += 0.4;

                    const body = group.items.map(item => {
                        const timeText = new Date(item.sessionStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                        const vendorText = item.boothName || 'N/A';
                        const locationText = item.boothDetails?.physicalId || 'N/A';
                        return [timeText, vendorText, locationText];
                    });

                    autoTable(doc, {
                        head: [['Time', 'Meeting with (Vendor)', 'Location (Booth ID)']],
                        body,
                        startY: lastFinalY,
                        theme: 'grid',
                        margin: { left: agendaMargin, right: agendaMargin },
                        styles: { font: FONT_SANS, fontSize: 11, cellPadding: 0.2, valign: 'middle' },
                        headStyles: { fillColor: PRIMARY_COLOR, textColor: TEXT_COLOR_WHITE, fontStyle: 'bold', halign: 'center' },
                        alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
                        columnStyles: {
                            0: { cellWidth: 1.5, fontStyle: 'bold', halign: 'center' },
                            1: { cellWidth: 'auto' },
                            2: { cellWidth: 2, fontStyle: 'italic', halign: 'center' },
                        },
                        didDrawPage: (data) => {
                            // Reset Y for new page
                            lastFinalY = data.cursor?.y || 1;
                        }
                    });
                    
                    lastFinalY = (doc as any).lastAutoTable.finalY + 0.4;
                    dayCounter++;
                }
            }
            
            const safeFileName = `${attendee.name.replace(/[^a-z0-9]/gi, '_')}_LyVenTum_Info.pdf`;
            doc.save(safeFileName);
            
            toast.success('PDF generated successfully!', { id: toastId });

        } catch (error: any) {
            console.error('Failed to generate PDF:', error);
            toast.error(`Could not generate PDF: ${error.message || 'Unknown error'}`, { id: toastId });
        }
    };

    const footerContent = (
        <div className="flex items-center gap-3">
            <Button onClick={generatePdf} variant="secondary" leftIcon={<PrinterIcon className="w-5 h-5" />}>
                Download PDF
            </Button>
            <Button onClick={onClose} variant="primary">
                Close
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Portal Preview for ${attendee?.name || ''}`}
            size="lg"
            footerContent={footerContent}
        >
            <div id="printable-area">
                {isLoading && (
                    <div className="text-center p-8">
                        <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-primary-500" />
                        <p className="mt-2 text-slate-500">Loading Agenda...</p>
                    </div>
                )}
                {error && <Alert type="error" message={error} />}
                {!isLoading && !error && attendee && (
                     <div className="space-y-6">
                         <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <AttendeeBadge attendee={attendee} />
                         </div>
                         <Card title="My Agenda" className="bg-white dark:bg-slate-800">
                            {agenda.length > 0 ? (
                                <ul className="space-y-4">
                                    {agenda.map(reg => (
                                        <li key={reg.id} className="flex items-start space-x-4">
                                            <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${reg.status === 'Attended' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                                <PresentationChartLineIcon className={`h-6 w-6 ${reg.status === 'Attended' ? 'text-green-600' : 'text-blue-600'}`} />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{reg.sessionName}</p>
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${reg.status === 'Attended' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{reg.status}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(reg.sessionStartTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {reg.boothName && (
                                                    <div className="mt-2 flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                        <BuildingStorefrontIcon className="w-4 h-4 mr-2 text-slate-400" />
                                                        <span>Location: <strong>{reg.boothName} ({reg.boothDetails?.physicalId})</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 dark:text-slate-400 text-center p-4">This attendee has no scheduled meetings.</p>
                            )}
                        </Card>
                     </div>
                )}
            </div>
        </Modal>
    );
};

export default AttendeePortalPreviewModal;
