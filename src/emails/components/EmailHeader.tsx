// src/emails/components/EmailHeader.tsx
import { Img, Section, Text } from '@react-email/components';
import * as React from 'react';

interface EmailHeaderProps {
    companyLogo?: string;
    companyName: string;
    sponsorLogo?: string;
    sponsorName?: string;
    showSponsor?: boolean;
}

export function EmailHeader({
    companyLogo,
    companyName,
    sponsorLogo,
    sponsorName,
    showSponsor = false
}: EmailHeaderProps) {
    return (
        <>
            {/* Company Header */}
            <Section style={headerStyle}>
                {companyLogo ? (
                    <Img src={companyLogo} alt={companyName} style={logoStyle} />
                ) : (
                    <Text style={companyNameStyle}>{companyName}</Text>
                )}
            </Section>

            {/* Sponsor Section */}
            {showSponsor && sponsorLogo && (
                <Section style={sponsorSectionStyle}>
                    <Text style={sponsorLabelStyle}>SPONSORED BY</Text>
                    <Img src={sponsorLogo} alt={sponsorName || 'Sponsor'} style={sponsorLogoStyle} />
                </Section>
            )}
        </>
    );
}

const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '30px 20px',
    textAlign: 'center' as const,
};

const logoStyle = {
    maxHeight: '60px',
    maxWidth: '250px',
    height: 'auto',
    width: 'auto',
    margin: '0 auto',
};

const companyNameStyle = {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: '#ffffff',
    margin: 0,
};

const sponsorSectionStyle = {
    backgroundColor: '#f8f9fa',
    padding: '15px 20px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #e9ecef',
};

const sponsorLabelStyle = {
    fontSize: '10px',
    fontWeight: '600' as const,
    color: '#6c757d',
    letterSpacing: '1px',
    margin: '0 0 8px 0',
};

const sponsorLogoStyle = {
    maxHeight: '40px',
    maxWidth: '180px',
    height: 'auto',
    width: 'auto',
    margin: '0 auto',
};
