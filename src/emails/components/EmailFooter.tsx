// src/emails/components/EmailFooter.tsx
import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';

interface EmailFooterProps {
    sponsorWebsite?: string;
    sponsorName?: string;
    showSponsor?: boolean;
}

export function EmailFooter({ sponsorWebsite, sponsorName, showSponsor }: EmailFooterProps) {
    return (
        <>
            {showSponsor && sponsorWebsite && (
                <Section style={sponsorFooterStyle}>
                    <Text style={thankYouStyle}>Thank you to our sponsors</Text>
                    <Link href={sponsorWebsite} style={linkStyle}>
                        Visit {sponsorName} →
                    </Link>
                </Section>
            )}

            <Section style={disclaimerStyle}>
                <Text style={disclaimerTextStyle}>
                    © 2025 LyVenTum. All rights reserved.<br />
                    Powered by LyVenTum Event Management
                </Text>
            </Section>
        </>
    );
}

const sponsorFooterStyle = {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e9ecef',
};

const thankYouStyle = {
    fontSize: '12px',
    color: '#6c757d',
    margin: '0 0 8px 0',
};

const linkStyle = {
    fontSize: '14px',
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600' as const,
};

const disclaimerStyle = {
    backgroundColor: '#212529',
    padding: '20px',
    textAlign: 'center' as const,
};

const disclaimerTextStyle = {
    fontSize: '12px',
    color: '#adb5bd',
    lineHeight: '1.5',
    margin: 0,
};
