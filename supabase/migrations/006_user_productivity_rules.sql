-- Migration 006: Add optional user_id to productivity_rules table if desired
ALTER TABLE productivity_rules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
