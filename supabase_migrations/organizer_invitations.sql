-- Organizer Invitations System
-- Allows event organizers to invite other users to help manage their events

-- Create invitations table
CREATE TABLE IF NOT EXISTS organizer_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_role TEXT NOT NULL DEFAULT 'organizer', -- 'organizer' or 'staff'
    invitation_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_role CHECK (invitee_role IN ('organizer', 'staff')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizer_invitations_token ON organizer_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_organizer_invitations_event ON organizer_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_organizer_invitations_email ON organizer_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_organizer_invitations_status ON organizer_invitations(status);

-- RLS Policies
ALTER TABLE organizer_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations for events they organize
CREATE POLICY "Organizers can view invitations for their events"
    ON organizer_invitations
    FOR SELECT
    USING (
        event_id IN (
            SELECT event_id 
            FROM event_organizers 
            WHERE user_id = auth.uid()
        )
        OR inviter_id = auth.uid()
    );

-- Users can create invitations for events they organize
CREATE POLICY "Organizers can create invitations"
    ON organizer_invitations
    FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT event_id 
            FROM event_organizers 
            WHERE user_id = auth.uid()
        )
        AND inviter_id = auth.uid()
    );

-- Users can update their own invitations
CREATE POLICY "Users can update their invitations"
    ON organizer_invitations
    FOR UPDATE
    USING (inviter_id = auth.uid())
    WITH CHECK (inviter_id = auth.uid());

-- Users can delete their own pending invitations
CREATE POLICY "Users can delete pending invitations"
    ON organizer_invitations
    FOR DELETE
    USING (
        inviter_id = auth.uid() 
        AND status = 'pending'
    );

-- SuperAdmins can do everything
CREATE POLICY "SuperAdmins have full access to invitations"
    ON organizer_invitations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Function to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE organizer_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizer_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_organizer_invitations_updated_at
    BEFORE UPDATE ON organizer_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizer_invitations_updated_at();

-- Comments
COMMENT ON TABLE organizer_invitations IS 'Stores organizer invitations for events';
COMMENT ON COLUMN organizer_invitations.invitation_token IS 'Unique token for accepting invitation via email link';
COMMENT ON COLUMN organizer_invitations.expires_at IS 'Invitation expires 7 days after creation';
