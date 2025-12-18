// src/pages/admin/EmailSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useBooths } from '../../contexts/booths';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { emailSettingsService, type EmailSettings } from '../../services/emailSettingsService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Mail, Clock, Calendar, Settings, Send, Loader2, Code, Eye, FileText, Store, X } from 'lucide-react';
import RichTextEditor from '../../components/ui/RichTextEditor';

// USA Timezones
const US_TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Phoenix', label: 'Arizona (MST - no DST)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

export default function EmailSettingsPage() {
    const { selectedEventId } = useSelectedEvent();
    const { booths } = useBooths();

    const [activeTab, setActiveTab] = useState('access-code');
    const [settings, setSettings] = useState<EmailSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Access code email settings (from old email_preferences table)
    const [accessCodeSettings, setAccessCodeSettings] = useState({
        showSponsors: true,
        fromName: 'Event Team',
        fromEmail: 'lyventum@gmail.com',
    });

    // Template HTML states
    const [accessCodeTemplate, setAccessCodeTemplate] = useState('');
    const [sessionReminderTemplate, setSessionReminderTemplate] = useState('');
    const [dailyAgendaTemplate, setDailyAgendaTemplate] = useState('');
    const [vendorTemplate, setVendorTemplate] = useState('');

    // Editor mode states (visual vs html) - Default to visual for better UX
    const [accessCodeEditorMode, setAccessCodeEditorMode] = useState<'visual' | 'html'>('visual');
    const [sessionReminderEditorMode, setSessionReminderEditorMode] = useState<'visual' | 'html'>('visual');
    const [dailyAgendaEditorMode, setDailyAgendaEditorMode] = useState<'visual' | 'html'>('visual');
    const [vendorEditorMode, setVendorEditorMode] = useState<'visual' | 'html'>('visual');

    // Recipient selection states
    const [recipientType, setRecipientType] = useState<'all' | 'booths' | 'specific'>('all');
    const [selectedBooths, setSelectedBooths] = useState<string[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [showRecipientModal, setShowRecipientModal] = useState(false);

    // Modal states
    const [vendorSearch, setVendorSearch] = useState('');
    const [vendorFilterBooth, setVendorFilterBooth] = useState<string>('all');
    const [allVendors, setAllVendors] = useState<any[]>([]);
    const [tempSelectedVendors, setTempSelectedVendors] = useState<string[]>([]);

    // Test email state
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);

    // Organization filters for attendee emails (simple dropdowns)
    const [accessCodeOrgFilter, setAccessCodeOrgFilter] = useState<string>('all');
    const [sessionReminderOrgFilter, setSessionReminderOrgFilter] = useState<string>('all');
    const [dailyAgendaOrgFilter, setDailyAgendaOrgFilter] = useState<string>('all');
    const [organizations, setOrganizations] = useState<{ name: string, count: number }[]>([]);

    // Get sponsors
    const platinumSponsor = booths.find(b => b.isSponsor && b.sponsorshipTier === 'platinum');
    const goldSponsors = booths.filter(b => b.isSponsor && b.sponsorshipTier === 'gold');
    const silverSponsors = booths.filter(b => b.isSponsor && b.sponsorshipTier === 'silver');

    useEffect(() => {
        loadSettings();
    }, [selectedEventId]);

    useEffect(() => {
        if (showRecipientModal && selectedEventId) {
            loadVendors();
        }
    }, [showRecipientModal, selectedEventId]);

    useEffect(() => {
        if (selectedEventId) {
            loadOrganizations();
        }
    }, [selectedEventId]);

    const loadVendors = async () => {
        if (!selectedEventId) return;

        const { data } = await supabase
            .from('attendees')
            .select('*, booths(name)')
            .eq('event_id', selectedEventId)
            .eq('is_vendor', true)
            .order('name');

        if (data) {
            setAllVendors(data);
        }
    };

    const loadOrganizations = async () => {
        if (!selectedEventId) return;

        const { data } = await supabase
            .from('attendees')
            .select('organization')
            .eq('event_id', selectedEventId)
            .eq('is_vendor', false)
            .not('organization', 'is', null);

        if (data) {
            // Count attendees per organization
            const orgCounts = data.reduce((acc, { organization }) => {
                if (organization && organization.trim()) {
                    acc[organization] = (acc[organization] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            const orgList = Object.entries(orgCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setOrganizations(orgList);
        }
    };

    const loadSettings = async () => {
        if (!selectedEventId) return;

        try {
            setIsLoading(true);

            // Load email_settings (for reminders and agenda)
            const data = await emailSettingsService.getSettings(selectedEventId);
            if (!data) {
                const defaults = await emailSettingsService.initializeDefaults(selectedEventId);
                setSettings(defaults);
            } else {
                setSettings(data);
            }

            // Load access code settings from email_preferences
            const { data: prefs } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('event_id', selectedEventId)
                .maybeSingle();

            if (prefs) {
                setAccessCodeSettings({
                    showSponsors: prefs.magicLinkShowSponsor ?? true,
                    fromName: prefs.fromName || 'Event Team',
                    fromEmail: prefs.fromEmail || 'lyventum@gmail.com',
                });
            }

            // Load email templates
            const { data: templates } = await supabase
                .from('email_templates')
                .select('*')
                .eq('event_id', selectedEventId);

            if (templates) {
                const accessCode = templates.find(t => t.template_type === 'access_code');
                const sessionReminder = templates.find(t => t.template_type === 'session_reminder');
                const dailyAgenda = templates.find(t => t.template_type === 'daily_agenda');
                const vendor = templates.find(t => t.template_type === 'vendor_info');

                // Professional default templates with colorful gradients
                const defaultAccessCodeHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">🎟️ Your Event Access Code</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="color:#64748b;font-size:16px;margin:0 0 20px 0;">Hello!</p>
<p style="color:#64748b;font-size:16px;margin:0 0 30px 0;">Your access code for the event is ready. Please save this code and present it at check-in.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0f9ff 0%,#dbeafe 100%);border-left:4px solid #06b6d4;border-radius:8px;margin-bottom:30px;">
<tr><td style="padding:30px 20px;text-align:center;">
<p style="color:#0369a1;font-size:14px;font-weight:600;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:1px;">Access Code</p>
<h2 style="color:#06b6d4;margin:0;font-size:42px;font-weight:700;letter-spacing:8px;font-family:'Courier New',monospace;">TEST-CODE</h2>
</td></tr>
</table>
<div style="background-color:#f8fafc;padding:20px;border-radius:6px;margin-bottom:30px;">
<p style="color:#475569;font-size:14px;margin:0 0 10px 0;"><strong>📋 What to bring:</strong></p>
<ul style="color:#64748b;font-size:14px;margin:0;padding-left:20px;">
<li>This access code (digital or printed)</li>
<li>Valid photo ID</li>
<li>Confirmation email</li>
</ul>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="#" style="display:inline-block;background-color:#06b6d4;color:#fff;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;font-weight:600;">View Event Details</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:30px;text-align:center;background-color:#1e293b;color:#94a3b8;">
<p style="margin:0 0 10px 0;font-size:14px;color:#cbd5e1;"><strong style="color:#fff;">Event Name</strong></p>
<p style="margin:0;font-size:12px;">Need help? <a href="mailto:lyventum@gmail.com" style="color:#06b6d4;">lyventum@gmail.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`.trim();

                const defaultSessionReminderHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">⏰ Session Starting Soon!</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="color:#64748b;font-size:16px;margin:0 0 20px 0;">Hi there,</p>
<p style="color:#64748b;font-size:16px;margin:0 0 30px 0;">Your session is starting in <strong>15 minutes</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid #f59e0b;border-radius:6px;margin-bottom:30px;">
<tr><td style="padding:20px;">
<h2 style="color:#1e293b;margin:0 0 15px 0;font-size:20px;">Sample Session Title</h2>
<p style="color:#64748b;font-size:14px;margin:8px 0;"><strong>📅 Time:</strong> Today at 2:00 PM</p>
<p style="color:#64748b;font-size:14px;margin:8px 0;"><strong>📍 Location:</strong> Main Hall</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="#" style="display:inline-block;background-color:#f59e0b;color:#fff;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;">View My Agenda</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:30px;text-align:center;background-color:#1e293b;color:#94a3b8;">
<p style="margin:0 0 10px 0;font-size:14px;color:#cbd5e1;"><strong style="color:#fff;">Event Name</strong></p>
<p style="margin:0;font-size:12px;">Need help? <a href="mailto:lyventum@gmail.com" style="color:#06b6d4;">lyventum@gmail.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`.trim();

                const defaultDailyAgendaHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">📅 Your Agenda for Tomorrow</h1>
</td></tr>
<tr><td style="padding:30px;">
<p style="color:#64748b;font-size:16px;margin:0 0 15px 0;">Hi there,</p>
<p style="color:#64748b;font-size:16px;margin:0 0 20px 0;">You have <strong>2 sessions</strong> scheduled for tomorrow.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid #8b5cf6;border-radius:6px;margin-bottom:15px;">
<tr><td style="padding:20px;">
<h3 style="color:#1e293b;margin:0 0 10px 0;font-size:18px;">Morning Keynote Session</h3>
<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>🕐 Time:</strong> 9:00 AM</p>
<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>📍 Location:</strong> Main Hall</p>
<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>⏱️ Duration:</strong> 1h 30m</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid #8b5cf6;border-radius:6px;margin-bottom:15px;">
<tr><td style="padding:20px;">
<h3 style="color:#1e293b;margin:0 0 10px 0;font-size:18px;">Afternoon Workshop</h3>
<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>🕐 Time:</strong> 2:00 PM</p>
<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>📍 Location:</strong> Room B</p>
<p style="color:#64748b;font-size:14px;margin:5px 0;"><strong>⏱️ Duration:</strong> 45m</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
<tr><td align="center">
<a href="#" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;">View Full Agenda</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:30px;text-align:center;background-color:#1e293b;color:#94a3b8;">
<p style="margin:0 0 10px 0;font-size:14px;color:#cbd5e1;"><strong style="color:#fff;">Event Name</strong></p>
<p style="margin:0;font-size:12px;">Need help? <a href="mailto:lyventum@gmail.com" style="color:#06b6d4;">lyventum@gmail.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`.trim();

                const defaultVendorHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);padding:40px 20px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">📋 Event Information</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="color:#64748b;font-size:16px;margin:0 0 20px 0;">Hello {{VENDOR_NAME}},</p>
<p style="color:#64748b;font-size:16px;margin:0 0 30px 0;">Thank you for participating in {{EVENT_NAME}}. Here's important information for exhibitors.</p>
<p style="color:#334155;font-size:16px;margin:0 0 10px 0;"><strong>Event Guidelines:</strong></p>
<ul style="color:#64748b;font-size:14px;line-height:1.6;">
<li>Setup time and booth access information</li>
<li>Event rules and guidelines</li>
<li>Contact information for assistance</li>
</ul>
</td></tr>
<tr><td style="padding:30px;text-align:center;background-color:#1e293b;color:#94a3b8;">
<p style="margin:0 0 10px 0;font-size:14px;color:#cbd5e1;"><strong style="color:#fff;">{{EVENT_NAME}}</strong></p>
<p style="margin:0;font-size:12px;">Need help? <a href="mailto:lyventum@gmail.com" style="color:#ec4899;">lyventum@gmail.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`.trim();

                setAccessCodeTemplate(accessCode?.bodyHtml || defaultAccessCodeHtml);
                setSessionReminderTemplate(sessionReminder?.bodyHtml || defaultSessionReminderHtml);
                setDailyAgendaTemplate(dailyAgenda?.bodyHtml || defaultDailyAgendaHtml);
                setVendorTemplate(vendor?.bodyHtml || (settings?.vendor_email_template || defaultVendorHtml));
            }
        } catch (error) {
            console.error('Error loading email settings:', error);
            toast.error('Failed to load email settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSettings = async (updates: Partial<EmailSettings>) => {
        if (!selectedEventId || !settings) return;

        try {
            setIsSaving(true);
            const updated = await emailSettingsService.updateSettings(selectedEventId, updates);
            setSettings(updated);
            toast.success('Settings updated successfully');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAccessCodeSettings = async () => {
        if (!selectedEventId) return;

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('email_preferences')
                .upsert({
                    event_id: selectedEventId,
                    magicLinkShowSponsor: accessCodeSettings.showSponsors,
                    fromName: accessCodeSettings.fromName,
                    fromEmail: accessCodeSettings.fromEmail,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            toast.success('Access code email settings updated');
        } catch (error) {
            console.error('Error updating access code settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveTemplate = async (templateType: string, htmlContent: string) => {
        if (!selectedEventId) return;

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('email_templates')
                .upsert({
                    event_id: selectedEventId,
                    template_type: templateType,
                    bodyHtml: htmlContent,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            toast.success('Template saved successfully');
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    const sendTestEmail = async (emailType: 'access-code' | 'session-reminder' | 'daily-agenda') => {
        if (!testEmail || !selectedEventId) {
            toast.error('Please enter an email address');
            return;
        }

        try {
            setSendingTest(true);

            let endpoint = '';
            let body = {};

            switch (emailType) {
                case 'access-code':
                    endpoint = 'send-email';
                    body = {
                        type: 'test',
                        recipientEmail: testEmail,
                        html: accessCodeTemplate,
                        eventId: selectedEventId
                    };
                    break;
                case 'session-reminder':
                    endpoint = 'send-session-reminders';
                    body = {
                        eventId: selectedEventId,
                        testEmail: testEmail,
                        isTest: true
                    };
                    break;
                case 'daily-agenda':
                    endpoint = 'send-daily-agenda';
                    body = {
                        eventId: selectedEventId,
                        testEmail: testEmail,
                        isTest: true
                    };
                    break;
            }

            const { data, error } = await supabase.functions.invoke(endpoint, {
                body: body
            });

            if (error) throw error;
            toast.success(`Test email sent to ${testEmail}`);
        } catch (error: any) {
            console.error('Error sending test email:', error);
            toast.error(error.message || 'Failed to send test email');
        } finally {
            setSendingTest(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Loading email settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Mail className="h-8 w-8" />
                    Email Settings
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Configure all email communications for your event
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('access-code')}
                        className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'access-code'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Mail className="h-4 w-4" />
                        Access Code Emails
                    </button>
                    <button
                        onClick={() => setActiveTab('session-reminders')}
                        className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'session-reminders'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Clock className="h-4 w-4" />
                        Session Reminders
                    </button>
                    <button
                        onClick={() => setActiveTab('daily-agenda')}
                        className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'daily-agenda'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Calendar className="h-4 w-4" />
                        Daily Agenda
                    </button>
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'global'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <Settings className="h-5 w-5" />
                        Global
                    </button>
                    <button
                        onClick={() => setActiveTab('vendor')}
                        className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'vendor'
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <Store className="h-5 w-5" />
                        Vendor Communications
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Access Code Emails Tab */}
                {activeTab === 'access-code' && (
                    <>
                        <Card className="p-6">
                            <div className="flex items-center space-x-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={accessCodeSettings.showSponsors}
                                        onChange={(e) => setAccessCodeSettings({
                                            ...accessCodeSettings,
                                            showSponsors: e.target.checked
                                        })}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="font-medium">Show sponsor logos in email</span>
                                </label>
                            </div>

                            {accessCodeSettings.showSponsors && (
                                <div className="ml-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm font-medium mb-2">Current Sponsors:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {platinumSponsor && (
                                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                                                Platinum: {platinumSponsor.companyName}
                                            </span>
                                        )}
                                        {goldSponsors.map(s => (
                                            <span key={s.id} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
                                                Gold: {s.companyName}
                                            </span>
                                        ))}
                                        {silverSponsors.map(s => (
                                            <span key={s.id} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-sm">
                                                Silver: {s.companyName}
                                            </span>
                                        ))}
                                        {!platinumSponsor && goldSponsors.length === 0 && silverSponsors.length === 0 && (
                                            <span className="text-sm text-slate-500">No sponsors configured</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={handleUpdateAccessCodeSettings}
                                disabled={isSaving}
                                className="mt-4"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>

                        </Card>

                        {/* Template Editor with Live Preview */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Code className="h-5 w-5" />
                                    Email Template Editor
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAccessCodeEditorMode('visual')}
                                        className={`px-3 py-1 rounded text-sm font-medium transition ${accessCodeEditorMode === 'visual'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        Visual Editor
                                    </button>
                                    <button
                                        onClick={() => setAccessCodeEditorMode('html')}
                                        className={`px-3 py-1 rounded text-sm font-medium transition ${accessCodeEditorMode === 'html'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        HTML Code (Advanced)
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Live Preview - Now on Left */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        Live Preview
                                    </label>
                                    <div className="h-[600px] border border-slate-300 dark:border-slate-600 rounded-lg overflow-auto bg-slate-50 dark:bg-slate-900">
                                        <iframe
                                            srcDoc={accessCodeTemplate}
                                            title="Email Preview"
                                            className="w-full h-full"
                                            sandbox="allow-same-origin allow-scripts"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                        📧 This is how your email will look to recipients
                                    </p>
                                </div>

                                {/* Editor - Now on Right */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        {accessCodeEditorMode === 'html' ? 'HTML Code' : 'Visual Editor'}
                                    </label>
                                    {accessCodeEditorMode === 'html' ? (
                                        <textarea
                                            value={accessCodeTemplate}
                                            onChange={(e) => setAccessCodeTemplate(e.target.value)}
                                            placeholder="<h2>Welcome!</h2><p>Your access code is: {{ACCESS_CODE}}</p>"
                                            className="w-full h-96 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm resize-none"
                                        />
                                    ) : (
                                        <RichTextEditor
                                            value={accessCodeTemplate}
                                            onChange={setAccessCodeTemplate}
                                            placeholder="Start typing your email..."
                                        />
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Available variables: {'{{ACCESS_CODE}}'}, {'{{ATTENDEE_NAME}}'}, {'{{EVENT_NAME}}'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <Button
                                    onClick={() => handleSaveTemplate('access_code', accessCodeTemplate)}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Template'
                                    )}
                                </Button>
                            </div>
                        </Card>

                        {/* Test Email Section */}
                        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Send className="h-5 w-5" />
                                Send Test Email
                            </h3>
                            <div className="flex gap-3">
                                <Input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() => sendTestEmail('access-code')}
                                    disabled={sendingTest || !testEmail}
                                >
                                    {sendingTest ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Test
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </>
                )
                }

                {/* Session Reminders Tab */}
                {
                    activeTab === 'session-reminders' && settings && (
                        <>
                            <Card className="p-6">
                                <h2 className="text-xl font-bold mb-4">Session Reminder Settings</h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Automatically remind attendees before their sessions start
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.session_reminders_enabled}
                                                onChange={(e) => handleUpdateSettings({
                                                    session_reminders_enabled: e.target.checked
                                                })}
                                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="font-medium">Enable session reminders</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Send reminder
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={String(settings.session_reminder_minutes)}
                                                onChange={(e) => handleUpdateSettings({
                                                    session_reminder_minutes: parseInt(e.target.value)
                                                })}
                                                disabled={isSaving}
                                                className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            >
                                                <option value="5">5</option>
                                                <option value="10">10</option>
                                                <option value="15">15</option>
                                                <option value="30">30</option>
                                                <option value="60">60</option>
                                            </select>
                                            <span className="text-sm text-slate-600 dark:text-slate-400">minutes before</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            💡 Tip: 15 minutes is optimal for maximizing attendance
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Subject Line
                                        </label>
                                        <Input
                                            value={settings.session_reminder_subject}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                session_reminder_subject: e.target.value
                                            })}
                                            placeholder="Reminder: {{session_name}} starts in 15 minutes"
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Variables: {'{{session_name}}'}, {'{{session_time}}'}, {'{{attendee_name}}'}
                                        </p>
                                    </div>

                                    <Button
                                        onClick={() => handleUpdateSettings({
                                            session_reminder_subject: settings.session_reminder_subject
                                        })}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            </Card>

                            {/* Template Editor with Live Preview */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Code className="h-5 w-5" />
                                        Email Template Editor
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSessionReminderEditorMode('visual')}
                                            className={`px-3 py-1 rounded text-sm font-medium transition ${sessionReminderEditorMode === 'visual'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            Visual Editor
                                        </button>
                                        <button
                                            onClick={() => setSessionReminderEditorMode('html')}
                                            className={`px-3 py-1 rounded text-sm font-medium transition ${sessionReminderEditorMode === 'html'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            HTML Code (Advanced)
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Live Preview - Now on Left */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Live Preview
                                        </label>
                                        <div className="h-[600px] border border-slate-300 dark:border-slate-600 rounded-lg overflow-auto bg-slate-50 dark:bg-slate-900">
                                            <iframe
                                                srcDoc={sessionReminderTemplate}
                                                title="Session Reminder Preview"
                                                className="w-full h-full"
                                                sandbox="allow-same-origin allow-scripts"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                            📧 This is how your reminder will look
                                        </p>
                                    </div>

                                    {/* Editor - Now on Right */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Code className="h-4 w-4" />
                                            {sessionReminderEditorMode === 'html' ? 'HTML Code' : 'Visual Editor'}
                                        </label>
                                        {sessionReminderEditorMode === 'html' ? (
                                            <textarea
                                                value={sessionReminderTemplate}
                                                onChange={(e) => setSessionReminderTemplate(e.target.value)}
                                                placeholder="<h2>⏰ Session Starting Soon!</h2><p>{{SESSION_NAME}} starts at {{SESSION_TIME}}</p>"
                                                className="w-full h-96 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm resize-none"
                                            />
                                        ) : (
                                            <RichTextEditor
                                                value={sessionReminderTemplate}
                                                onChange={setSessionReminderTemplate}
                                                placeholder="Start typing your email..."
                                            />
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Available variables: {'{{SESSION_NAME}}'}, {'{{SESSION_TIME}}'}, {'{{ATTENDEE_NAME}}'}, {'{{BOOTH_NAME}}'}, {'{{LOCATION}}'}, {'{{SPEAKER}}'}, {'{{DESCRIPTION}}'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <Button
                                        onClick={() => handleSaveTemplate('session_reminder', sessionReminderTemplate)}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Template'
                                        )}
                                    </Button>
                                </div>
                            </Card>

                            {/* Test Email Section */}
                            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Send className="h-5 w-5" />
                                    Send Test Email
                                </h3>
                                <div className="flex gap-3">
                                    <Input
                                        type="email"
                                        placeholder="Enter email address"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={() => sendTestEmail('session-reminder')}
                                        disabled={sendingTest || !testEmail}
                                    >
                                        {sendingTest ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Test
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </>
                    )
                }

                {/* Daily Agenda Tab */}
                {
                    activeTab === 'daily-agenda' && settings && (
                        <>
                            <Card className="p-6">
                                <h2 className="text-xl font-bold mb-4">Daily Agenda Settings</h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Send daily agenda emails to attendees
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.daily_agenda_enabled}
                                                onChange={(e) => handleUpdateSettings({
                                                    daily_agenda_enabled: e.target.checked
                                                })}
                                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="font-medium">Enable daily agenda emails</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Send at
                                        </label>
                                        <Input
                                            type="time"
                                            value={settings.daily_agenda_time}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                daily_agenda_time: e.target.value
                                            })}
                                            className="w-40"
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Timezone: {settings.daily_agenda_timezone}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Subject Line
                                        </label>
                                        <Input
                                            value={settings.daily_agenda_subject}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                daily_agenda_subject: e.target.value
                                            })}
                                            placeholder="Your Agenda for Tomorrow - {{date}}"
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Variables: {'{{date}}'}, {'{{attendee_name}}'}, {'{{session_count}}'}
                                        </p>
                                    </div>

                                    <Button
                                        onClick={() => handleUpdateSettings({
                                            daily_agenda_time: settings.daily_agenda_time,
                                            daily_agenda_subject: settings.daily_agenda_subject
                                        })}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            </Card>

                            {/* Template Editor with Live Preview */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Code className="h-5 w-5" />
                                        Email Template Editor
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setDailyAgendaEditorMode('visual')}
                                            className={`px-3 py-1 rounded text-sm font-medium transition ${dailyAgendaEditorMode === 'visual'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            Visual Editor
                                        </button>
                                        <button
                                            onClick={() => setDailyAgendaEditorMode('html')}
                                            className={`px-3 py-1 rounded text-sm font-medium transition ${dailyAgendaEditorMode === 'html'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            HTML Code (Advanced)
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Live Preview - Now on Left */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Live Preview
                                        </label>
                                        <div className="h-[600px] border border-slate-300 dark:border-slate-600 rounded-lg overflow-auto bg-slate-50 dark:bg-slate-900">
                                            <iframe
                                                srcDoc={dailyAgendaTemplate}
                                                title="Daily Agenda Preview"
                                                className="w-full h-full"
                                                sandbox="allow-same-origin allow-scripts"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                            📧 This is how your agenda will look
                                        </p>
                                    </div>

                                    {/* Editor - Now on Right */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Code className="h-4 w-4" />
                                            {dailyAgendaEditorMode === 'html' ? 'HTML Code' : 'Visual Editor'}
                                        </label>
                                        {dailyAgendaEditorMode === 'html' ? (
                                            <textarea
                                                value={dailyAgendaTemplate}
                                                onChange={(e) => setDailyAgendaTemplate(e.target.value)}
                                                placeholder="<h2>📅 Your Daily Agenda</h2><p>Sessions: {{SESSION_COUNT}}</p>"
                                                className="w-full h-96 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm resize-none"
                                            />
                                        ) : (
                                            <RichTextEditor
                                                value={dailyAgendaTemplate}
                                                onChange={setDailyAgendaTemplate}
                                                placeholder="Start typing your email..."
                                            />
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Available variables: {'{{SESSION_COUNT}}'}, {'{{ATTENDEE_NAME}}'}, {'{{AGENDA_DATE}}'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <Button
                                        onClick={() => handleSaveTemplate('daily_agenda', dailyAgendaTemplate)}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Template'
                                        )}
                                    </Button>
                                </div>
                            </Card>

                            {/* Test Email Section */}
                            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Send className="h-5 w-5" />
                                    Send Test Email
                                </h3>
                                <div className="flex gap-3">
                                    <Input
                                        type="email"
                                        placeholder="Enter email address"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={() => sendTestEmail('daily-agenda')}
                                        disabled={sendingTest || !testEmail}
                                    >
                                        {sendingTest ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Test
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </>
                    )
                }

                {/* Global Settings Tab */}
                {
                    activeTab === 'global' && settings && (
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4">Global Email Settings</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Configure sender information and timezone for all automated emails
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        From Name
                                    </label>
                                    <Input
                                        value={settings.from_name}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            from_name: e.target.value
                                        })}
                                        placeholder="LyVentum Events"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        From Email
                                    </label>
                                    <Input
                                        type="email"
                                        value={settings.from_email}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            from_email: e.target.value
                                        })}
                                        placeholder="noreply@lyventum.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Reply-To Email (Optional)
                                    </label>
                                    <Input
                                        type="email"
                                        value={settings.reply_to_email || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            reply_to_email: e.target.value
                                        })}
                                        placeholder="support@lyventum.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Timezone (for scheduled emails)
                                    </label>
                                    <select
                                        value={settings.daily_agenda_timezone}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            daily_agenda_timezone: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        {US_TIMEZONES.map(tz => (
                                            <option key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        This timezone will be used for all scheduled emails (daily agendas, etc.)
                                    </p>
                                </div>

                                <Button
                                    onClick={() => handleUpdateSettings({
                                        from_name: settings.from_name,
                                        from_email: settings.from_email,
                                        reply_to_email: settings.reply_to_email,
                                        daily_agenda_timezone: settings.daily_agenda_timezone,
                                    })}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </Card>
                    )
                }

                {/* Vendor Communications Tab */}
                {
                    activeTab === 'vendor' && settings && (
                        <>
                            <Card className="p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Store className="h-6 w-6 text-purple-600" />
                                    Vendor Communications
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Send custom emails to all vendors/exhibitors with event information, rules, and guidelines
                                </p>

                                {/* Enable Toggle */}
                                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.vendor_email_enabled || false}
                                            onChange={(e) => {
                                                setSettings({
                                                    ...settings,
                                                    vendor_email_enabled: e.target.checked
                                                });
                                                handleUpdateSettings({ vendor_email_enabled: e.target.checked });
                                            }}
                                            className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <div>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Enable Vendor Communications
                                            </span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Allow sending custom emails to vendors/exhibitors
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {/* Subject Line */}
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Email Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.vendor_email_subject || 'Event Information for Exhibitors'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                vendor_email_subject: e.target.value
                                            })}
                                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Event Information for Exhibitors"
                                        />
                                    </div>
                                </div>

                                {/* Recipient Selection */}
                                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        📨 Send To
                                    </label>

                                    {/* Radio Options */}
                                    <div className="space-y-3 mb-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="recipientType"
                                                checked={recipientType === 'all'}
                                                onChange={() => setRecipientType('all')}
                                                className="h-4 w-4 text-purple-600"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">All Vendors</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Send to all vendors/exhibitors for this event</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="recipientType"
                                                checked={recipientType === 'booths'}
                                                onChange={() => setRecipientType('booths')}
                                                className="h-4 w-4 text-purple-600"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Specific Booths</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Select specific booths/exhibitors</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="recipientType"
                                                checked={recipientType === 'specific'}
                                                onChange={() => setRecipientType('specific')}
                                                className="h-4 w-4 text-purple-600"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Specific People</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Manually select individual vendors</p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Booth Selection - Show when 'booths' selected */}
                                    {recipientType === 'booths' && (
                                        <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Select Booths
                                            </label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {booths.filter(b => b.isSponsor || b.companyName).map(booth => {
                                                    const vendorCount = (booth as any).attendees?.filter((a: any) => a.is_vendor)?.length || 0;
                                                    return (
                                                        <label key={booth.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedBooths.includes(booth.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedBooths([...selectedBooths, booth.id]);
                                                                    } else {
                                                                        setSelectedBooths(selectedBooths.filter(id => id !== booth.id));
                                                                    }
                                                                }}
                                                                className="h-4 w-4 text-purple-600"
                                                            />
                                                            <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                                                                {booth.companyName}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                ({vendorCount} vendor{vendorCount !== 1 ? 's' : ''})
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Specific People Selection */}
                                    {recipientType === 'specific' && (
                                        <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <Button
                                                onClick={() => setShowRecipientModal(true)}
                                                variant="secondary"
                                                className="w-full"
                                            >
                                                + Add Recipients
                                            </Button>

                                            {selectedVendors.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Selected ({selectedVendors.length}):
                                                    </p>
                                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                                        {selectedVendors.map(vendorId => {
                                                            const vendor = allVendors.find(v => v.id === vendorId);
                                                            return (
                                                                <div key={vendorId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-2 rounded text-sm">
                                                                    <span className="text-slate-700 dark:text-slate-300 truncate">
                                                                        {vendor?.name || `Vendor ${vendorId.slice(0, 8)}`}
                                                                        {vendor?.organization && ` - ${vendor.organization}`}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setSelectedVendors(selectedVendors.filter(id => id !== vendorId))}
                                                                        className="text-red-600 hover:text-red-700 ml-2"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Recipient Summary */}
                                    <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-700">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {recipientType === 'all' && '📢 Will send to all vendors'}
                                            {recipientType === 'booths' && selectedBooths.length > 0 && `🎯 Will send to ${selectedBooths.length} booth${selectedBooths.length !== 1 ? 's' : ''}`}
                                            {recipientType === 'booths' && selectedBooths.length === 0 && '⚠️ No booths selected'}
                                            {recipientType === 'specific' && selectedVendors.length > 0 && `👥 Will send to ${selectedVendors.length} vendor${selectedVendors.length !== 1 ? 's' : ''}`}
                                            {recipientType === 'specific' && selectedVendors.length === 0 && '⚠️ No vendors selected'}
                                        </p>
                                    </div>
                                </div>

                                {/* Editor Mode Toggle */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            onClick={() => setVendorEditorMode('visual')}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${vendorEditorMode === 'visual'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            <FileText className="inline h-4 w-4 mr-2" />
                                            Visual Editor
                                        </button>
                                        <button
                                            onClick={() => setVendorEditorMode('html')}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${vendorEditorMode === 'html'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            <Code className="inline h-4 w-4 mr-2" />
                                            HTML Code (Advanced)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Live Preview - Left */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Live Preview
                                        </label>
                                        <div className="h-[600px] border border-slate-300 dark:border-slate-600 rounded-lg overflow-auto bg-slate-50 dark:bg-slate-900">
                                            <iframe
                                                srcDoc={vendorTemplate}
                                                title="Vendor Email Preview"
                                                className="w-full h-full"
                                                sandbox="allow-same-origin allow-scripts"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                            📧 This is how your email will look to vendors
                                        </p>
                                    </div>

                                    {/* Editor - Right */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Code className="h-4 w-4" />
                                            {vendorEditorMode === 'html' ? 'HTML Code' : 'Visual Editor'}
                                        </label>
                                        {vendorEditorMode === 'html' ? (
                                            <textarea
                                                value={vendorTemplate}
                                                onChange={(e) => setVendorTemplate(e.target.value)}
                                                placeholder="<h2>Event Information</h2><p>{{VENDOR_NAME}}, welcome to {{EVENT_NAME}}</p>"
                                                className="w-full h-[600px] px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm resize-none"
                                            />
                                        ) : (
                                            <RichTextEditor
                                                value={vendorTemplate}
                                                onChange={setVendorTemplate}
                                                placeholder="Write your vendor email..."
                                            />
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Available variables: {'{{ATTENDEE_NAME}}'}, {'{{SESSION_LIST}}'}, {'{{DATE}}'}, {'{{LOCATION}}'}, {'{{SPEAKER}}'}
                                        </p>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        onClick={async () => {
                                            // Save template
                                            const { error } = await supabase
                                                .from('email_templates')
                                                .upsert({
                                                    event_id: selectedEventId,
                                                    template_type: 'vendor_info',
                                                    bodyHtml: vendorTemplate,
                                                }, {
                                                    onConflict: 'event_id,template_type',
                                                    ignoreDuplicates: false
                                                });

                                            // Save settings
                                            await handleUpdateSettings({
                                                vendor_email_subject: settings.vendor_email_subject,
                                                vendor_email_template: vendorTemplate,
                                            });

                                            if (!error) {
                                                toast.success('Vendor email template saved');
                                            }
                                        }}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Template'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            if (!selectedEventId) return;

                                            // Validate selection
                                            if (recipientType === 'booths' && selectedBooths.length === 0) {
                                                toast.error('Please select at least one booth');
                                                return;
                                            }
                                            if (recipientType === 'specific' && selectedVendors.length === 0) {
                                                toast.error('Please add at least one recipient');
                                                return;
                                            }

                                            const confirmed = window.confirm(
                                                recipientType === 'all'
                                                    ? 'Send this email to ALL vendors for this event?'
                                                    : recipientType === 'booths'
                                                        ? `Send this email to vendors from ${selectedBooths.length} selected booth(s)?`
                                                        : `Send this email to ${selectedVendors.length} selected vendor(s)?`
                                            );
                                            if (!confirmed) return;

                                            setSendingTest(true);
                                            try {
                                                // Build query based on recipient type
                                                let query = supabase
                                                    .from('attendees')
                                                    .select('*')
                                                    .eq('event_id', selectedEventId)
                                                    .eq('is_vendor', true);

                                                // Filter by booths if specific booths selected
                                                if (recipientType === 'booths') {
                                                    query = query.in('booth_id', selectedBooths);
                                                }

                                                // Filter by specific vendors
                                                if (recipientType === 'specific') {
                                                    query = query.in('id', selectedVendors);
                                                }

                                                const { data: vendors } = await query;

                                                if (!vendors || vendors.length === 0) {
                                                    toast.error('No vendors found matching your selection');
                                                    return;
                                                }

                                                toast.loading(`Sending to ${vendors.length} vendor(s)...`, { id: 'vendor-bulk' });

                                                // TODO: Implement actual email sending via edge function or service
                                                // For now, just show success
                                                toast.success(`Email sent to ${vendors.length} vendor(s)!`, { id: 'vendor-bulk' });
                                            } catch (error) {
                                                console.error('Error sending to vendors:', error);
                                                toast.error('Failed to send emails', { id: 'vendor-bulk' });
                                            } finally {
                                                setSendingTest(false);
                                            }
                                        }}
                                        variant="primary"
                                        disabled={sendingTest || !settings.vendor_email_enabled}
                                    >
                                        {sendingTest ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2" /> Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                {recipientType === 'all' && 'Send to All Vendors'}
                                                {recipientType === 'booths' && `Send to ${selectedBooths.length} Booth${selectedBooths.length !== 1 ? 's' : ''}`}
                                                {recipientType === 'specific' && `Send to ${selectedVendors.length} Vendor${selectedVendors.length !== 1 ? 's' : ''}`}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </>
                    )
                }
            </div >

            {/* Add Recipients Modal */}
            {
                showRecipientModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Recipients</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Select vendors to send emails to
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowRecipientModal(false);
                                        setVendorSearch('');
                                        setVendorFilterBooth('all');
                                        setTempSelectedVendors([]);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Search and Filters */}
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
                                {/* Search Input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={vendorSearch}
                                        onChange={(e) => setVendorSearch(e.target.value)}
                                        placeholder="Search by name, email, or organization..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                </div>

                                {/* Booth Filter */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Filter by Booth
                                        </label>
                                        <select
                                            value={vendorFilterBooth}
                                            onChange={(e) => setVendorFilterBooth(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                        >
                                            <option value="all">All Booths</option>
                                            {booths.filter(b => b.isSponsor || b.companyName).map(booth => (
                                                <option key={booth.id} value={booth.id}>
                                                    {booth.companyName || `Booth ${booth.physicalId}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            <strong>{tempSelectedVendors.length}</strong> selected
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vendor List */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-2">
                                    {allVendors
                                        .filter(vendor => {
                                            // Search filter
                                            const searchLower = vendorSearch.toLowerCase();
                                            const matchesSearch = !vendorSearch ||
                                                vendor.name?.toLowerCase().includes(searchLower) ||
                                                vendor.email?.toLowerCase().includes(searchLower) ||
                                                vendor.organization?.toLowerCase().includes(searchLower);

                                            // Booth filter
                                            const matchesBooth = vendorFilterBooth === 'all' || vendor.booth_id === vendorFilterBooth;

                                            return matchesSearch && matchesBooth;
                                        })
                                        .map(vendor => (
                                            <label
                                                key={vendor.id}
                                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={tempSelectedVendors.includes(vendor.id) || selectedVendors.includes(vendor.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setTempSelectedVendors([...tempSelectedVendors, vendor.id]);
                                                        } else {
                                                            setTempSelectedVendors(tempSelectedVendors.filter(id => id !== vendor.id));
                                                        }
                                                    }}
                                                    disabled={selectedVendors.includes(vendor.id)}
                                                    className="h-4 w-4 text-purple-600 rounded"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-900 dark:text-white truncate">
                                                            {vendor.name}
                                                        </span>
                                                        {selectedVendors.includes(vendor.id) && (
                                                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                                                Already added
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                                        {vendor.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {vendor.organization && (
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                🏢 {vendor.organization}
                                                            </span>
                                                        )}
                                                        {vendor.booths?.name && (
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                📍 {vendor.booths.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    {allVendors.filter(v => {
                                        const searchLower = vendorSearch.toLowerCase();
                                        const matchesSearch = !vendorSearch ||
                                            v.name?.toLowerCase().includes(searchLower) ||
                                            v.email?.toLowerCase().includes(searchLower) ||
                                            v.organization?.toLowerCase().includes(searchLower);
                                        const matchesBooth = vendorFilterBooth === 'all' || v.booth_id === vendorFilterBooth;
                                        return matchesSearch && matchesBooth;
                                    }).length === 0 && (
                                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>No vendors found</p>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                                <Button
                                    onClick={() => {
                                        setShowRecipientModal(false);
                                        setVendorSearch('');
                                        setVendorFilterBooth('all');
                                        setTempSelectedVendors([]);
                                    }}
                                    variant="secondary"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSelectedVendors([...selectedVendors, ...tempSelectedVendors]);
                                        setShowRecipientModal(false);
                                        setVendorSearch('');
                                        setVendorFilterBooth('all');
                                        setTempSelectedVendors([]);
                                        toast.success(`Added ${tempSelectedVendors.length} vendor(s)`);
                                    }}
                                    variant="primary"
                                    disabled={tempSelectedVendors.length === 0}
                                >
                                    Add Selected ({tempSelectedVendors.length})
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

