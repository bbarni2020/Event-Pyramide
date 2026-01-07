-- Create role_salaries table
CREATE TABLE IF NOT EXISTS role_salaries (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) UNIQUE NOT NULL,
  salary NUMERIC(10, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default role salaries
INSERT INTO role_salaries (role, salary, currency) VALUES
('staff', 0.00, 'USD'),
('ticket-inspector', 0.00, 'USD'),
('security', 0.00, 'USD'),
('bartender', 0.00, 'USD')
ON CONFLICT (role) DO NOTHING;
