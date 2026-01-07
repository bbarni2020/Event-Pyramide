-- Add event place and location coordinates
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS event_place VARCHAR(500),
ADD COLUMN IF NOT EXISTS event_place_lat NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS event_place_lng NUMERIC(11, 8);

-- Add public visibility flags for each info type
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS participants_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS event_date_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS event_place_public BOOLEAN DEFAULT FALSE;

-- Add release dates for each info type
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS release_date_participants TIMESTAMP,
ADD COLUMN IF NOT EXISTS release_date_event_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS release_date_event_place TIMESTAMP;
