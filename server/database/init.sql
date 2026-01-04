CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  instagram_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  profile_picture TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  attending BOOLEAN DEFAULT NULL,
  invited_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  inviter_id INTEGER NOT NULL REFERENCES users(id),
  invitee_instagram_id VARCHAR(255) UNIQUE NOT NULL,
  invitee_username VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_config (
  id SERIAL PRIMARY KEY,
  event_date TIMESTAMP NOT NULL,
  max_participants INTEGER NOT NULL,
  member_count_release_date TIMESTAMP NOT NULL,
  ticket_price_tier1 DECIMAL(10, 2),
  ticket_price_tier2 DECIMAL(10, 2),
  ticket_price_tier3 DECIMAL(10, 2),
  ticket_price DECIMAL(10, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  max_invites_per_user INTEGER DEFAULT 5,
  max_discount_percent DECIMAL(5, 2) DEFAULT 0.00,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  ticket_code VARCHAR(255) UNIQUE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bot_messages (
  id SERIAL PRIMARY KEY,
  message_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  sent_to_user_id INTEGER REFERENCES users(id),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_users_instagram_id ON users(instagram_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter ON invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_username ON invitations(invitee_username);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_instagram_id ON invitations(invitee_instagram_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);

INSERT INTO event_config (event_date, max_participants, member_count_release_date, ticket_price_tier1, ticket_price_tier2, ticket_price_tier3, ticket_price, currency, max_invites_per_user, max_discount_percent)
VALUES (NOW() + INTERVAL '30 days', 1000, NOW() + INTERVAL '15 days', 50.00, 75.00, 100.00, 50.00, 'USD', 5, 10.00)
ON CONFLICT DO NOTHING;
