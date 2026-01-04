-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_username ON invitations(invitee_username);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_instagram_id ON invitations(invitee_instagram_id);
