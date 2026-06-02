CREATE TABLE IF NOT EXISTS tickets (
  id            text PRIMARY KEY,
  ticket_number text NOT NULL,
  status        text NOT NULL,
  status_type   text NOT NULL,
  created_time  timestamptz,
  modified_time timestamptz,
  raw           jsonb NOT NULL,
  synced_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id             text PRIMARY KEY,
  ticket_id      text NOT NULL,
  commented_time timestamptz,
  raw            jsonb NOT NULL,
  synced_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status_type ON tickets (status_type);
CREATE INDEX IF NOT EXISTS idx_conversations_ticket ON conversations (ticket_id);
