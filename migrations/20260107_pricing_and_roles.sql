-- Add role to users
aLTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Drop unused tiered price columns
ALTER TABLE event_config
  DROP COLUMN IF EXISTS ticket_price_tier1,
  DROP COLUMN IF EXISTS ticket_price_tier2,
  DROP COLUMN IF EXISTS ticket_price_tier3;
