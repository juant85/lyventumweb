-- Migration: Add Vendor Email Settings
-- Purpose: Enable vendor-specific email communications separate from attendee emails
-- Date: 2025-12-12

-- Add vendor email template columns to email_settings table
ALTER TABLE email_settings
ADD COLUMN IF NOT EXISTS vendor_email_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_email_subject TEXT DEFAULT 'Event Information for Exhibitors',
ADD COLUMN IF NOT EXISTS vendor_email_template TEXT DEFAULT '<h2>Event Information</h2><p>Dear {{VENDOR_NAME}},</p><p>Thank you for participating in {{EVENT_NAME}}.</p>',
ADD COLUMN IF NOT EXISTS vendor_from_name TEXT,
ADD COLUMN IF NOT EXISTS vendor_from_email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN email_settings.vendor_email_enabled IS 'Enable/disable vendor-specific email communications';
COMMENT ON COLUMN email_settings.vendor_email_template IS 'HTML template for vendor emails. Available variables: {{VENDOR_NAME}}, {{BOOTH_NUMBER}}, {{EVENT_NAME}}';
