// src/utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Event, Booth, Session, ScanRecord, Attendee } from '../types';
import { APP_NAME } from '../constants';

interface ChartImages {
    attendanceTrend?: string;
    boothTraffic?: string;
    sessionParticipation?: string;
}

interface PDFBranding {
    companyLogoUrl?: string | null;
    eventLogoUrl?: string | null;
    companyName?: string | null;
    primaryColor?: [number, number, number];
    secondaryColor?: [number, number, number];
}

// --- Professional Design System ---

// Color Palette
const PRIMARY_COLOR: [number, number, number] = [37, 99, 235]; // Blue
const SECONDARY_COLOR: [number, number, number] = [22, 163, 74]; // Green
const ACCENT_COLOR: [number, number, number] = [139, 92, 246]; // Purple
const SUCCESS_COLOR: [number, number, number] = [16, 185, 129]; // Teal
const WARNING_COLOR: [number, number, number] = [245, 158, 11]; // Amber
const TEXT_COLOR_DARK: [number, number, number] = [15, 23, 42]; // slate-900
const TEXT_COLOR_LIGHT: [number, number, number] = [100, 116, 139]; // slate-500
const INFO_BG: [number, number, number] = [248, 250, 252]; // slate-50
const BORDER_COLOR: [number, number, number] = [226, 232, 240]; // slate-200
const DIVIDER_COLOR: [number, number, number] = [203, 213, 225]; // slate-300

// Spacing System (in points)
const SPACING = {
    SECTION_TOP: 60,          // Before main section
    SECTION_AFTER_TITLE: 30,  // After section title
    SUBSECTION_BEFORE: 25,    // Before subsection
    ELEMENT_BEFORE: 20,       // Before element (chart/table)
    ELEMENT_AFTER: 30,        // After element
    PARAGRAPH: 12,            // Between paragraphs
    LINE: 5,                  // Between text lines
    TABLE_CELL: 8,            // Table cell padding
    PAGE_MARGIN: 50,          // Page margins (increased from 40)
    HEADER_HEIGHT: 80,        // Header total height (increased from 70)
    HEADER_TOP: 20,           // Header top padding
};

// Typography Sizes
const FONT_SIZE = {
    TITLE: 24,          // Main section titles
    SUBTITLE: 16,       // Subsection titles
    HEADER: 12,         // Page header text
    BODY: 10,           // Normal body text
    CAPTION: 8,         // Captions, footer text
    LARGE: 20,          // Large emphasis text
};

const MARGIN = SPACING.PAGE_MARGIN;

// --- Image Loading Utilities ---

/**
 * Converts an image URL to base64 for embedding in PDF
 * @param url Image URL (can be external or data URL)
 * @returns Promise<string> base64 encoded image
 */
const loadImageAsBase64 = async (url: string): Promise<string> => {
    try {
        // If already base64/data URL, return as is
        if (url.startsWith('data:')) {
            return url;
        }

        // Fetch the image
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Convert to blob then to base64
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error loading image:', error);
        throw error;
    }
};

const addHeaderAndFooter = async (
    doc: jsPDF,
    eventName: string,
    reportTitle: string,
    branding?: PDFBranding
) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Try to load company logo if available
    let companyLogo: string | null = null;
    if (branding?.companyLogoUrl) {
        try {
            companyLogo = await loadImageAsBase64(branding.companyLogoUrl);
        } catch (error) {
            console.warn('Could not load company logo for PDF header:', error);
        }
    }

    const primaryColor = branding?.primaryColor || PRIMARY_COLOR;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Don't add header/footer to the title page
        if (i === 1 && reportTitle.includes('Comprehensive')) continue;

        // --- PROFESSIONAL 2-COLUMN HEADER ---
        const headerY = SPACING.HEADER_TOP;
        const logoSize = 40; // Slightly smaller logo for header

        // Define columns
        const leftColX = MARGIN;
        const rightColX = pageWidth - MARGIN;
        const colWidth = (pageWidth - (MARGIN * 2)) / 2;

        // --- LEFT COLUMN: Logo & Company Name ---
        if (companyLogo) {
            try {
                doc.addImage(companyLogo, 'PNG', leftColX, headerY, logoSize, logoSize);

                // Company name next to logo
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(TEXT_COLOR_DARK[0], TEXT_COLOR_DARK[1], TEXT_COLOR_DARK[2]);

                const companyName = branding?.companyName || APP_NAME;
                // Allow wrapping if needed, but keep it tight
                const companyNameLines = doc.splitTextToSize(companyName, colWidth - logoSize - 10);
                doc.text(companyNameLines[0], leftColX + logoSize + 10, headerY + 15);

                if (companyNameLines.length > 1) {
                    doc.setFontSize(10);
                    doc.text(companyNameLines[1], leftColX + logoSize + 10, headerY + 28);
                } else {
                    // Tagline if space permits
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);
                    doc.text('Event Analytics Report', leftColX + logoSize + 10, headerY + 28);
                }

            } catch (error) {
                // Fallback text
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text(branding?.companyName || APP_NAME, leftColX, headerY + 20);
            }
        } else {
            // Text only
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(branding?.companyName || APP_NAME, leftColX, headerY + 20);
        }

        // --- RIGHT COLUMN: Report Details (Right Aligned) ---
        // 1. Report Title (Bold, Primary Color)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(reportTitle, rightColX, headerY + 12, { align: 'right' });

        // 2. Event Name | Date (Normal, Dark Text)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(TEXT_COLOR_DARK[0], TEXT_COLOR_DARK[1], TEXT_COLOR_DARK[2]);
        const dateStr = new Date().toLocaleDateString();
        // Truncate event name if too long
        let eventNameStr = eventName;
        if (doc.getTextWidth(eventName) > 150) {
            eventNameStr = eventName.substring(0, 25) + '...';
        }
        doc.text(`${eventNameStr} | ${dateStr}`, rightColX, headerY + 24, { align: 'right' });

        // 3. Page Number (Subtle)
        doc.setFontSize(8);
        doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);
        doc.text(`Page ${i} of ${pageCount}`, rightColX, headerY + 36, { align: 'right' });

        // Header divider line
        const headerBottom = SPACING.HEADER_HEIGHT;
        doc.setDrawColor(DIVIDER_COLOR[0], DIVIDER_COLOR[1], DIVIDER_COLOR[2]); // Lighter divider
        doc.setLineWidth(0.5);
        doc.line(MARGIN, headerBottom, pageWidth - MARGIN, headerBottom);

        // --- FOOTER (Simplified) ---
        const footerY = pageHeight - 20;
        doc.setFontSize(8);
        doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);
        doc.text(`Generated by ${APP_NAME}`, MARGIN, footerY);
        doc.text(new Date().toLocaleString(), pageWidth - MARGIN, footerY, { align: 'right' });
    }
};

const drawSectionTitle = (doc: jsPDF, title: string, yPos: number): number => {
    doc.setFontSize(FONT_SIZE.TITLE);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK[0], TEXT_COLOR_DARK[1], TEXT_COLOR_DARK[2]);
    doc.text(title, MARGIN, yPos);
    return yPos + SPACING.SECTION_AFTER_TITLE;
};

/**
 * Draws a professional section header with colored accent bar
 * @param doc jsPDF document
 * @param title Section title
 * @param yPos Vertical position
 * @param color Optional accent color
 * @returns New Y position after header
 */
const drawSectionHeader = (
    doc: jsPDF,
    title: string,
    yPos: number,
    color?: [number, number, number]
): number => {
    const accentColor = color || PRIMARY_COLOR;

    // Colored accent bar on left
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(MARGIN, yPos, 4, 18, 'F');

    // Title text
    doc.setFontSize(FONT_SIZE.TITLE);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK[0], TEXT_COLOR_DARK[1], TEXT_COLOR_DARK[2]);
    doc.text(title, MARGIN + 12, yPos + 13);

    // Underline
    doc.setDrawColor(DIVIDER_COLOR[0], DIVIDER_COLOR[1], DIVIDER_COLOR[2]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, yPos + 22, doc.internal.pageSize.getWidth() - MARGIN, yPos + 22);

    return yPos + 22 + SPACING.SECTION_AFTER_TITLE;
};

/**
 * Draws a stats card for the cover page
 * @param doc jsPDF document
 * @param x X position
 * @param y Y position
 * @param width Card width
 * @param icon Icon/emoji
 * @param value Main value
 * @param label Description label
 */
const drawStatsCard = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    value: string,
    label: string
) => {
    const height = 60;

    // Background with subtle shadow effect
    doc.setFillColor(INFO_BG[0], INFO_BG[1], INFO_BG[2]);
    doc.roundedRect(x, y, width, height, 3, 3, 'F');

    // Border
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, width, height, 3, 3);

    // Value (large, centered)
    doc.setFontSize(FONT_SIZE.LARGE);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK[0], TEXT_COLOR_DARK[1], TEXT_COLOR_DARK[2]);
    doc.text(value, x + width / 2, y + 25, { align: 'center' });

    // Label (small, centered)
    doc.setFontSize(FONT_SIZE.BODY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);
    doc.text(label, x + width / 2, y + 42, { align: 'center' });
};

const checkPageBreak = (doc: jsPDF, yPos: number, contentHeight: number): number => {
    const pageHeight = doc.internal.pageSize.getHeight();
    // Increase bottom margin to 60 to avoid footer overlap
    if (yPos + contentHeight > pageHeight - 60) {
        doc.addPage();
        // Reset Y to below the header height + padding
        return SPACING.HEADER_HEIGHT + 30;
    }
    return yPos;
};

/**
 * Creates a professional branded title page with company logo and stats cards
 * @param doc jsPDF document
 * @param event Event data
 * @param reportTitle Title of the report
 * @param branding Branding configuration
 * @param stats Optional statistics to display on cover
 */
const createBrandedTitlePage = async (
    doc: jsPDF,
    event: Event,
    reportTitle: string,
    branding?: PDFBranding,
    stats?: { totalAttendees: number; totalScans: number; totalBooths: number; totalSessions: number }
) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    const primaryColor = branding?.primaryColor || PRIMARY_COLOR;

    // Try to load logos
    let companyLogo: string | null = null;
    let eventLogo: string | null = null;

    try {
        if (branding?.companyLogoUrl) {
            companyLogo = await loadImageAsBase64(branding.companyLogoUrl);
        }
        if (branding?.eventLogoUrl) {
            eventLogo = await loadImageAsBase64(branding.eventLogoUrl);
        }
    } catch (error) {
        console.warn('Error loading logos for title page:', error);
    }

    // --- Background Design ---
    // Subtle accent bar on top
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 15, 'F');

    let currentY = 100;

    // --- 1. LOGO SECTION ---
    const logoSize = 100;
    const logoToUse = eventLogo || companyLogo;

    if (logoToUse) {
        try {
            doc.addImage(logoToUse, 'PNG', centerX - logoSize / 2, currentY, logoSize, logoSize);
            currentY += logoSize + 40;
        } catch (error) {
            console.warn('Could not add logo to title page:', error);
            currentY += 40;
        }
    } else {
        currentY += 60;
    }

    // --- 2. TITLE SECTION ---
    // Report Title (e.g., "Event Summary Report")
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(reportTitle.toUpperCase(), centerX, currentY, { align: 'center' });
    currentY += 40; // Increased spacing (was 25)

    // Event Name (Large, Bold)
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK[0], TEXT_COLOR_DARK[1], TEXT_COLOR_DARK[2]);
    const eventNameLines = doc.splitTextToSize(event.name, pageWidth - 100);
    doc.text(eventNameLines, centerX, currentY, { align: 'center' });
    currentY += (eventNameLines.length * 35) + 10;

    // Date & Location
    if (event.startDate && event.endDate) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);

        const start = new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'long' });
        const end = new Date(event.endDate).toLocaleDateString(undefined, { dateStyle: 'long' });
        const dateText = `${start} - ${end}`;
        const locationText = event.location ? ` • ${event.location}` : '';

        doc.text(dateText + locationText, centerX, currentY, { align: 'center' });
        currentY += 50;
    }

    // --- 3. STATS SECTION (Grid) ---
    if (stats) {
        currentY += 20;
        const cardWidth = 160;
        const cardHeight = 70;
        const gap = 20;
        const totalWidth = (cardWidth * 2) + gap;
        const startX = (pageWidth - totalWidth) / 2;

        // Row 1
        drawStatsCard(doc, startX, currentY, cardWidth, stats.totalAttendees.toLocaleString(), 'Attendees');
        drawStatsCard(doc, startX + cardWidth + gap, currentY, cardWidth, stats.totalScans.toLocaleString(), 'Total Scans');

        currentY += cardHeight + gap;

        // Row 2
        drawStatsCard(doc, startX, currentY, cardWidth, stats.totalBooths.toString(), 'Exhibitors');
        drawStatsCard(doc, startX + cardWidth + gap, currentY, cardWidth, stats.totalSessions.toString(), 'Sessions');
    }

    // --- 4. FOOTER ---
    const footerY = pageHeight - 60;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);

    if (branding?.companyName) {
        doc.text(`Prepared for ${branding.companyName}`, centerX, footerY, { align: 'center' });
    }
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, centerX, footerY + 15, { align: 'center' });
};


export const generateEventSummaryPDF = async (
    event: Event,
    booths: Booth[],
    sessions: Session[],
    scans: ScanRecord[],
    getBoothById: (boothId: string) => Booth | undefined,
    chartImages: ChartImages = {}
) => {
    const doc = new jsPDF('p', 'pt');
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - MARGIN * 2;
    let y = 0;

    // Prepare branding data
    const branding: PDFBranding = {
        companyLogoUrl: event.companyLogoUrl,
        eventLogoUrl: event.eventLogoUrl,
        companyName: event.companyName || undefined,
        primaryColor: PRIMARY_COLOR,
        secondaryColor: SECONDARY_COLOR,
    };

    // Prepare stats for cover page
    const totalUniqueAttendees = new Set(scans.map(s => s.attendeeId)).size;
    const coverStats = {
        totalAttendees: totalUniqueAttendees,
        totalScans: scans.length,
        totalBooths: booths.length,
        totalSessions: sessions.length,
    };

    // --- Professional Branded Title Page with Stats ---
    await createBrandedTitlePage(doc, event, 'Event Summary Report', branding, coverStats);

    // --- New Page for Content ---
    doc.addPage();
    y = SPACING.HEADER_HEIGHT + 30; // Start after header with spacing

    // --- Key Metrics Section ---
    y = drawSectionHeader(doc, 'Key Metrics', y);

    autoTable(doc, {
        body: [
            { label: 'Total Unique Attendees:', value: totalUniqueAttendees.toString() },
            { label: 'Total Scans Recorded:', value: scans.length.toString() },
            { label: 'Number of Configured Sessions:', value: sessions.length.toString() },
            { label: 'Number of Configured Booths:', value: booths.length.toString() },
        ],
        columns: [{ header: 'Metric', dataKey: 'label' }, { header: 'Value', dataKey: 'value' }],
        startY: y,
        theme: 'grid',
        headStyles: {
            fillColor: INFO_BG,
            textColor: TEXT_COLOR_DARK,
            fontStyle: 'bold',
            lineWidth: 0,
            cellPadding: 8
        },
        bodyStyles: {
            textColor: TEXT_COLOR_DARK,
            lineColor: BORDER_COLOR,
            cellPadding: 8
        },
        styles: {
            font: 'helvetica',
            fontSize: FONT_SIZE.BODY,
            lineColor: BORDER_COLOR,
            lineWidth: 0.5
        },
        columnStyles: { label: { fontStyle: 'bold', cellWidth: 250 } },
        alternateRowStyles: {
            fillColor: [255, 255, 255]
        }
    });
    y = (doc as any).lastAutoTable.finalY + SPACING.ELEMENT_AFTER;

    // --- Charts & Data Section ---
    const chartHeight = 180;
    const chartAndTitleHeight = chartHeight + 40; // Add space for title and padding

    // Attendance Trend
    y = checkPageBreak(doc, y, chartAndTitleHeight);
    y = drawSectionTitle(doc, "Today's Attendance Trend", y);
    if (chartImages.attendanceTrend) {
        doc.addImage(chartImages.attendanceTrend, 'PNG', MARGIN, y, contentWidth, chartHeight);
        y += chartHeight + 20;
    } else {
        doc.setFont('helvetica', 'italic').setFontSize(9).text('Chart data not available.', MARGIN + 2, y);
        y += 20;
    }

    // Booth Traffic
    y = checkPageBreak(doc, y, chartAndTitleHeight);
    y = drawSectionTitle(doc, 'Top 5 Booths by Activity', y);
    if (chartImages.boothTraffic) {
        doc.addImage(chartImages.boothTraffic, 'PNG', MARGIN, y, contentWidth, chartHeight);
        y += chartHeight + 20;
    } else {
        doc.setFont('helvetica', 'italic').setFontSize(9).text('Chart data not available.', MARGIN + 2, y);
        y += 20;
    }

    // Session Participation
    y = checkPageBreak(doc, y, chartAndTitleHeight);
    y = drawSectionTitle(doc, 'Session Participation', y);
    if (chartImages.sessionParticipation) {
        doc.addImage(chartImages.sessionParticipation, 'PNG', MARGIN, y, contentWidth, chartHeight);
        y += chartHeight + 20;
    } else {
        doc.setFont('helvetica', 'italic').setFontSize(9).text('Chart data not available.', MARGIN + 2, y);
        y += 20;
    }

    // --- Recent Scans Log ---
    if (scans.length > 0) {
        y = checkPageBreak(doc, y, 60);
        y = drawSectionTitle(doc, 'Recent Scan Activity (Last 20)', y);
        const recentScansData = scans.slice(0, 20).map(s => ([
            s.attendeeName || s.attendeeId,
            s.boothName || getBoothById(s.boothId ?? '')?.companyName || s.boothId || '',
            new Date(s.timestamp).toLocaleTimeString()
        ]));

        autoTable(doc, {
            head: [['Attendee', 'Booth', 'Time']],
            body: recentScansData,
            startY: y,
            theme: 'striped',
            headStyles: {
                fillColor: PRIMARY_COLOR,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                cellPadding: 8
            },
            bodyStyles: {
                cellPadding: 8,
                textColor: TEXT_COLOR_DARK
            },
            alternateRowStyles: {
                fillColor: INFO_BG
            }
        });
    }

    await addHeaderAndFooter(doc, event.name, 'Comprehensive Event Report', branding);
    doc.save(`LyVenTum_Report_${event.name.replace(/\s/g, '_')}.pdf`);
};


export const generateBoothReportPDF = async (
    event: Event,
    booth: Booth,
    scans: ScanRecord[],
    allAttendees: Attendee[]
) => {
    const doc = new jsPDF('p', 'pt');
    const reportTitle = `Booth Report: ${booth.companyName}`;

    // Prepare branding data
    const branding: PDFBranding = {
        companyLogoUrl: event.companyLogoUrl,
        eventLogoUrl: event.eventLogoUrl,
        companyName: event.companyName || undefined,
        primaryColor: PRIMARY_COLOR,
        secondaryColor: SECONDARY_COLOR,
    };

    // Title Page
    await createBrandedTitlePage(doc, event, reportTitle, branding);

    // Content Page
    doc.addPage();
    let y = SPACING.HEADER_HEIGHT + 30;

    const scansForBooth = scans.filter(s => s.boothId === booth.id);
    const uniqueVisitorIds = [...new Set(scansForBooth.map(s => s.attendeeId))];

    const visitors = uniqueVisitorIds.map(id => {
        const attendeeDetails = allAttendees.find(a => a.id === id);
        const firstVisit = scansForBooth.find(s => s.attendeeId === id);
        return {
            name: attendeeDetails?.name || id,
            email: attendeeDetails?.email || 'N/A',
            organization: attendeeDetails?.organization || 'N/A',
            timestamp: firstVisit ? new Date(firstVisit.timestamp).toLocaleString() : 'N/A'
        };
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    y = drawSectionHeader(doc, `Activity for ${booth.companyName} (${booth.physicalId})`, y);

    autoTable(doc, {
        body: [
            { label: 'Total Unique Visitors:', value: uniqueVisitorIds.length.toString() },
            { label: 'Total Scans Recorded:', value: scansForBooth.length.toString() },
        ],
        columns: [{ dataKey: 'label' }, { dataKey: 'value' }],
        startY: y,
        theme: 'grid',
        headStyles: {
            fillColor: INFO_BG,
            textColor: TEXT_COLOR_DARK,
            fontStyle: 'bold',
            lineWidth: 0,
            cellPadding: 8
        },
        bodyStyles: {
            textColor: TEXT_COLOR_DARK,
            lineColor: BORDER_COLOR,
            cellPadding: 8
        },
        styles: {
            font: 'helvetica',
            fontSize: FONT_SIZE.BODY,
            lineColor: BORDER_COLOR,
            lineWidth: 0.5
        },
        columnStyles: { label: { fontStyle: 'bold', cellWidth: 200 } },
        showHead: 'firstPage'
    });
    y = (doc as any).lastAutoTable.finalY + 40;

    if (visitors.length > 0) {
        y = checkPageBreak(doc, y, 60);
        y = drawSectionTitle(doc, 'Visitor List (Ordered by First Visit)', y);

        autoTable(doc, {
            head: [['Visitor Name', 'Email', 'Organization', 'First Visit Time']],
            body: visitors.map(v => [v.name, v.email, v.organization, v.timestamp]),
            startY: y,
            theme: 'striped',
            headStyles: {
                fillColor: PRIMARY_COLOR,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                cellPadding: 8
            },
            bodyStyles: {
                cellPadding: 8,
                textColor: TEXT_COLOR_DARK,
                overflow: 'linebreak'
            },
            alternateRowStyles: {
                fillColor: INFO_BG
            },
            columnStyles: {
                0: { cellWidth: 120 }, 1: { cellWidth: 150 }, 2: { cellWidth: 120 }, 3: { cellWidth: 'auto' },
            }
        });
    } else {
        doc.setFontSize(10).setFont('helvetica', 'italic').text('No visitors recorded for this booth.', MARGIN, y);
    }

    await addHeaderAndFooter(doc, event.name, reportTitle, branding);
    doc.save(`LyVenTum_Booth_Report_${booth.companyName.replace(/\s/g, '_')}.pdf`);
};

/**
 * Generates a PDF based on the selected template
 * Only includes sections specified in the template configuration
 */
export const generateTemplateBasedPDF = async (
    templateId: string,
    event: Event,
    booths: Booth[],
    sessions: Session[],
    scans: ScanRecord[],
    attendees: Attendee[],
    getBoothById: (boothId: string) => Booth | undefined,
    chartImages: ChartImages = {}
) => {
    const doc = new jsPDF('p', 'pt');
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - MARGIN * 2;
    let y = 0;

    // Get template configuration
    const template = getTemplateById(templateId);
    if (!template) {
        throw new Error(`Template ${templateId} not found`);
    }

    // Prepare branding
    const branding: PDFBranding = {
        companyLogoUrl: event.companyLogoUrl,
        eventLogoUrl: event.eventLogoUrl,
        companyName: event.companyName || undefined,
        primaryColor: PRIMARY_COLOR,
        secondaryColor: SECONDARY_COLOR,
    };

    // Calculate stats
    const totalUniqueAttendees = new Set(scans.map(s => s.attendeeId)).size;
    const coverStats = {
        totalAttendees: totalUniqueAttendees,
        totalScans: scans.length,
        totalBooths: booths.length,
        totalSessions: sessions.length,
    };

    // Title Page
    await createBrandedTitlePage(doc, event, template.name, branding, coverStats);

    // Content Page
    doc.addPage();
    y = SPACING.HEADER_HEIGHT + 30;

    // Process sections based on template
    for (const sectionId of template.sections) {
        switch (sectionId) {
            case 'overview':
                y = checkPageBreak(doc, y, 100);
                y = drawSectionHeader(doc, 'Event Overview', y);
                autoTable(doc, {
                    body: [
                        { label: 'Event Name:', value: event.name },
                        { label: 'Total Attendees:', value: totalUniqueAttendees.toString() },
                        { label: 'Total Scans:', value: scans.length.toString() },
                        { label: 'Sessions:', value: sessions.length.toString() },
                        { label: 'Exhibitors:', value: booths.length.toString() },
                    ],
                    columns: [{ dataKey: 'label' }, { dataKey: 'value' }],
                    startY: y,
                    theme: 'grid',
                    headStyles: { fillColor: INFO_BG, textColor: TEXT_COLOR_DARK, fontStyle: 'bold', lineWidth: 0, cellPadding: 8 },
                    bodyStyles: { textColor: TEXT_COLOR_DARK, lineColor: BORDER_COLOR, cellPadding: 8 },
                    styles: { font: 'helvetica', fontSize: FONT_SIZE.BODY, lineColor: BORDER_COLOR, lineWidth: 0.5 },
                    columnStyles: { label: { fontStyle: 'bold', cellWidth: 200 } },
                });
                y = (doc as any).lastAutoTable.finalY + SPACING.ELEMENT_AFTER;
                break;

            case 'attendance':
                y = checkPageBreak(doc, y, 100);
                y = drawSectionHeader(doc, 'Attendance Analysis', y);
                const checkInRate = totalUniqueAttendees > 0 ? ((scans.length / totalUniqueAttendees) * 100).toFixed(1) : '0';
                autoTable(doc, {
                    body: [
                        { label: 'Unique Attendees:', value: totalUniqueAttendees.toString() },
                        { label: 'Total Check-ins:', value: scans.length.toString() },
                        { label: 'Average Scans per Attendee:', value: (scans.length / Math.max(totalUniqueAttendees, 1)).toFixed(2) },
                    ],
                    columns: [{ dataKey: 'label' }, { dataKey: 'value' }],
                    startY: y,
                    theme: 'grid',
                    headStyles: { fillColor: INFO_BG, textColor: TEXT_COLOR_DARK, fontStyle: 'bold', lineWidth: 0, cellPadding: 8 },
                    bodyStyles: { textColor: TEXT_COLOR_DARK, lineColor: BORDER_COLOR, cellPadding: 8 },
                    styles: { font: 'helvetica', fontSize: FONT_SIZE.BODY, lineColor: BORDER_COLOR, lineWidth: 0.5 },
                    columnStyles: { label: { fontStyle: 'bold', cellWidth: 250 } },
                });
                y = (doc as any).lastAutoTable.finalY + SPACING.ELEMENT_AFTER;
                break;

            case 'booth_performance':
                y = checkPageBreak(doc, y, 150);
                y = drawSectionHeader(doc, 'Booth Performance', y);

                // Calculate booth stats
                const boothStats = booths.map(booth => {
                    const boothScans = scans.filter(s => s.boothId === booth.id);
                    const uniqueVisitors = new Set(boothScans.map(s => s.attendeeId)).size;
                    return {
                        company: booth.companyName,
                        scans: boothScans.length,
                        visitors: uniqueVisitors,
                    };
                }).sort((a, b) => b.scans - a.scans).slice(0, 10);

                if (boothStats.length > 0) {
                    autoTable(doc, {
                        head: [['Booth', 'Total Scans', 'Unique Visitors']],
                        body: boothStats.map(b => [b.company, b.scans.toString(), b.visitors.toString()]),
                        startY: y,
                        theme: 'striped',
                        headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', cellPadding: 8 },
                        bodyStyles: { cellPadding: 8, textColor: TEXT_COLOR_DARK },
                        alternateRowStyles: { fillColor: INFO_BG },
                    });
                    y = (doc as any).lastAutoTable.finalY + SPACING.ELEMENT_AFTER;
                }
                break;

            case 'session_breakdown':
                y = checkPageBreak(doc, y, 100);
                y = drawSectionHeader(doc, 'Session Breakdown', y);

                const sessionStats = sessions.map(session => {
                    const sessionScans = scans.filter(s => s.sessionId === session.id);
                    const uniqueAttendees = new Set(sessionScans.map(s => s.attendeeId)).size;
                    return {
                        name: session.name,
                        time: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        attendees: uniqueAttendees,
                        capacity: session.maxCapacity || session.boothSettings?.reduce((acc, curr) => acc + curr.capacity, 0) || '-'
                    };
                }).sort((a, b) => b.attendees - a.attendees);

                if (sessionStats.length > 0) {
                    autoTable(doc, {
                        head: [['Session', 'Time', 'Attendees', 'Capacity']],
                        body: sessionStats.map(s => [s.name, s.time, s.attendees.toString(), s.capacity.toString()]),
                        startY: y,
                        theme: 'striped',
                        headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', cellPadding: 8 },
                        bodyStyles: { cellPadding: 8, textColor: TEXT_COLOR_DARK },
                        alternateRowStyles: { fillColor: INFO_BG },
                        columnStyles: { 0: { cellWidth: 200 } }
                    });
                    y = (doc as any).lastAutoTable.finalY + SPACING.ELEMENT_AFTER;
                }
                break;

            case 'engagement':
                y = checkPageBreak(doc, y, 100);
                y = drawSectionHeader(doc, 'Engagement Analysis', y);

                // Top 10 Most Active Attendees
                const attendeeActivity = attendees.map(attendee => {
                    const attendeeScans = scans.filter(s => s.attendeeId === attendee.id);
                    return {
                        name: attendee.name,
                        organization: attendee.organization || '-',
                        scans: attendeeScans.length,
                        uniqueBooths: new Set(attendeeScans.map(s => s.boothId)).size
                    };
                }).sort((a, b) => b.scans - a.scans).slice(0, 10);

                if (attendeeActivity.length > 0) {
                    doc.setFontSize(12).setFont('helvetica', 'bold').text('Top Active Attendees', MARGIN, y);
                    y += 20;

                    autoTable(doc, {
                        head: [['Attendee', 'Organization', 'Total Scans', 'Unique Booths']],
                        body: attendeeActivity.map(a => [a.name, a.organization, a.scans.toString(), a.uniqueBooths.toString()]),
                        startY: y,
                        theme: 'striped',
                        headStyles: { fillColor: ACCENT_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', cellPadding: 8 },
                        bodyStyles: { cellPadding: 8, textColor: TEXT_COLOR_DARK },
                        alternateRowStyles: { fillColor: INFO_BG }
                    });
                    y = (doc as any).lastAutoTable.finalY + SPACING.ELEMENT_AFTER;
                }
                break;

            case 'lead_generation':
                y = checkPageBreak(doc, y, 100);
                y = drawSectionHeader(doc, 'Lead Generation', y);

                const leadStats = booths.map(booth => {
                    const boothScans = scans.filter(s => s.boothId === booth.id);
                    const uniqueLeads = new Set(boothScans.map(s => s.attendeeId)).size;
                    return {
                        company: booth.companyName,
                        leads: uniqueLeads,
                        quality: uniqueLeads > 20 ? 'High' : uniqueLeads > 10 ? 'Medium' : 'Low',
                    };
                }).sort((a, b) => b.leads - a.leads).slice(0, 10);

                if (leadStats.length > 0) {
                    autoTable(doc, {
                        head: [['Booth', 'Leads Generated', 'Quality']],
                        body: leadStats.map(l => [l.company, l.leads.toString(), l.quality]),
                        startY: y,
                        theme: 'striped',
                        headStyles: { fillColor: SUCCESS_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', cellPadding: 8 },
                        bodyStyles: { cellPadding: 8, textColor: TEXT_COLOR_DARK },
                        alternateRowStyles: { fillColor: INFO_BG },
                    });
                    y = (doc as any).lastAutoTable.finalY + SPACING.ELEMENT_AFTER;
                }
                break;

            case 'charts':
                // Attendance Trend
                if (chartImages.attendanceTrend) {
                    y = checkPageBreak(doc, y, 220);
                    y = drawSectionTitle(doc, "Attendance Trend", y);
                    doc.addImage(chartImages.attendanceTrend, 'PNG', MARGIN, y, contentWidth, 180);
                    y += 200;
                }

                // Booth Traffic
                if (chartImages.boothTraffic) {
                    y = checkPageBreak(doc, y, 220);
                    y = drawSectionTitle(doc, 'Top Booths by Activity', y);
                    doc.addImage(chartImages.boothTraffic, 'PNG', MARGIN, y, contentWidth, 180);
                    y += 200;
                }

                // Session Participation
                if (chartImages.sessionParticipation) {
                    y = checkPageBreak(doc, y, 220);
                    y = drawSectionTitle(doc, 'Session Participation', y);
                    doc.addImage(chartImages.sessionParticipation, 'PNG', MARGIN, y, contentWidth, 180);
                    y += 200;
                }
                break;
        }
    }

    await addHeaderAndFooter(doc, event.name, template.name, branding);
    doc.save(`${template.name.replace(/\s/g, '_')}_${event.name.replace(/\s/g, '_')}.pdf`);
};

// Helper to get template by ID (if not already exported)
import { REPORT_TEMPLATES } from './reportTemplates';

function getTemplateById(id: string) {
    return REPORT_TEMPLATES.find(t => t.id === id);
}