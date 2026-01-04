-- Migration: Add user ban system and new event config fields
-- Run this if you have an existing database

-- Add is_banned column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Add attending column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS attending BOOLEAN DEFAULT NULL;

-- Add new columns to event_config table
ALTER TABLE event_config ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE event_config ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE event_config ADD COLUMN IF NOT EXISTS max_invites_per_user INTEGER DEFAULT 5;
ALTER TABLE event_config ADD COLUMN IF NOT EXISTS max_discount_percent DECIMAL(5, 2) DEFAULT 0.00;

-- If you have an existing event_config, set some reasonable defaults
UPDATE event_config SET ticket_price = 50.00, currency = 'USD', max_invites_per_user = 5, max_discount_percent = 10.00 WHERE id = 1;
