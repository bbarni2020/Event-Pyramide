-- Add performance indexes to speed up slow queries (~5.8s down to <100ms)

-- Primary key indexes (usually auto-created)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_invitations_id ON invitations(id);

-- User table indexes (for /auth/status, getAllUsers endpoints)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_instagram_id ON users(instagram_id);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Invitation table indexes (for getInvitations endpoints)
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_username ON invitations(invitee_username);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_instagram_id ON invitations(invitee_instagram_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_created_at ON invitations(created_at DESC);

-- Tickets table indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);

-- Bot messages table indexes
CREATE INDEX IF NOT EXISTS idx_bot_messages_sent_to_user_id ON bot_messages(sent_to_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_messages_message_type ON bot_messages(message_type);

-- Composite indexes for common query patterns (JOIN optimization)
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_status ON invitations(inviter_id, status);
CREATE INDEX IF NOT EXISTS idx_users_banned_admin ON users(is_banned, is_admin);
CREATE INDEX IF NOT EXISTS idx_users_instagram_id_banned ON users(instagram_id, is_banned);
