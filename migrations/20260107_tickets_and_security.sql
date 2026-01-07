DROP TABLE IF EXISTS security_incident_assignments CASCADE;
DROP TABLE IF EXISTS security_incidents CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_incidents (
  id SERIAL PRIMARY KEY,
  reported_by INTEGER NOT NULL REFERENCES users(id),
  incident_type VARCHAR(100) NOT NULL,
  description TEXT,
  people_needed INTEGER DEFAULT 1,
  people_available INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_incident_assignments (
  incident_id INTEGER NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (incident_id, user_id)
);

ALTER TABLE event_config ADD COLUMN IF NOT EXISTS ticket_qr_enabled BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_security_incidents_reported_by ON security_incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incident_assignments_incident_id ON security_incident_assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_security_incident_assignments_user_id ON security_incident_assignments(user_id);
