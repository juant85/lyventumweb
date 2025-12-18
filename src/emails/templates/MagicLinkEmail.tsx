// src/emails/templates/MagicLinkEmail.tsx
import { Html, Head, Body, Container, Section, Heading, Text, Button } from '@react-email/components';
import * as React from 'react';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';

interface MagicLinkEmailProps {
    magicLink: string;
    attendeeName?: string;
    companyLogo?: string;
    companyName: string;
    sponsorLogo?: string;
    sponsorName?: string;
    sponsorWebsite?: string;
    showSponsor?: boolean;
}

export function MagicLinkEmail({
    magicLink,
    attendeeName,
    companyLogo,
    companyName,
    sponsorLogo,
    sponsorName,
    sponsorWebsite,
    showSponsor = false
}: MagicLinkEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={bodyStyle}>
                <Container style={containerStyle}>

                    <EmailHeader
                        companyLogo={companyLogo}
                        companyName={companyName}
                        sponsorLogo={sponsorLogo}
                        sponsorName={sponsorName}
                        showSponsor={showSponsor}
                    />

                    <Section style={contentStyle}>
                        <Heading style={headingStyle}>
                            Welcome to Your Event! 🎉
                        </Heading>

                        {attendeeName && (
                            <Text style={greetingStyle}>
                                Hi {attendeeName},
                            </Text>
                        )}

                        <Text style={textStyle}>
                            Click the button below to securely access your personalized event portal:
                        </Text>

                        <Button href={magicLink} style={buttonStyle}>
                            Access Event Portal →
                        </Button>

                        <Text style={disclaimerStyle}>
                            This link expires in <strong>24 hours</strong> for your security.<br />
                            If you didn't request this email, you can safely ignore it.
                        </Text>
                    </Section>

                    <EmailFooter
                        sponsorWebsite={sponsorWebsite}
                        sponsorName={sponsorName}
                        showSponsor={showSponsor}
                    />

                </Container>
            </Body>
        </Html>
    );
}

const bodyStyle = {
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const containerStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
};

const contentStyle = {
    padding: '40px 30px',
};

const headingStyle = {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#212529',
    marginBottom: '20px',
    textAlign: 'center' as const,
};

const greetingStyle = {
    fontSize: '16px',
    color: '#495057',
    marginBottom: '15px',
};

const textStyle = {
    fontSize: '16px',
    color: '#495057',
    lineHeight: '1.5',
    marginBottom: '25px',
};

const buttonStyle = {
    backgroundColor: '#667eea',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600' as const,
    fontSize: '16px',
    display: 'inline-block',
    textAlign: 'center' as const,
};

const disclaimerStyle = {
    fontSize: '13px',
    color: '#6c757d',
    marginTop: '25px',
    lineHeight: '1.5',
    textAlign: 'center' as const,
};

// Default export for preview
export default MagicLinkEmail;
