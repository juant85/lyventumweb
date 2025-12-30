-- Push Notifications Tables for Lyventum
-- Run this migration in Supabase SQL Editor

-- Table to store push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Table to store notification events (history)
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'session_starting', 'booth_crowded', 'vip_arrived', etc.
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_event 
    ON push_subscriptions(user_id, event_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_event 
    ON push_subscriptions(event_id);

CREATE INDEX IF NOT EXISTS idx_notification_events_event 
    ON notification_events(event_id);

CREATE INDEX IF NOT EXISTS idx_notification_events_type 
    ON notification_events(type);

CREATE INDEX IF NOT EXISTS idx_notification_events_created 
    ON notification_events(created_at DESC);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
    ON push_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" 
    ON push_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" 
    ON push_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" 
    ON push_subscriptions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Users can view notification history for their events
CREATE POLICY "Users can view notification events" 
    ON notification_events
    FOR SELECT
    USING (
        event_id IN (
            SELECT event_id 
            FROM event_staff 
            WHERE user_id = auth.uid()
        )
    );

-- Only system/admins can create notification events (via backend)
CREATE POLICY "Admins can create notification events" 
    ON notification_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM event_staff 
            WHERE user_id = auth.uid() 
            AND event_id = notification_events.event_id
            AND role IN ('organizer', 'superadmin')
        )
    );

-- Comments for documentation
COMMENT ON TABLE push_subscriptions IS 'Stores Web Push subscription information for users';
COMMENT ON TABLE notification_events IS 'History of push notifications sent for events';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Client public key for encryption';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret for encryption';
COMMENT ON COLUMN notification_events.type IS 'Notification type: session_starting, booth_crowded, vip_arrived, attendee_missing, system_alert';
COMMENT ON COLUMN notification_events.data IS 'Additional data payload (sessionId, boothId, etc.)';
