-- Project Manager Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  subtasks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick todos table
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Notes table (single row for app notes)
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default tags
INSERT INTO tags (id, name, color) VALUES
  ('bug', 'Bug', '#ef4444'),
  ('feature', 'Feature', '#3b82f6'),
  ('urgent', 'Urgent', '#f97316'),
  ('improvement', 'Improvement', '#22c55e')
ON CONFLICT (id) DO NOTHING;

-- Insert default notes row
INSERT INTO notes (id, content) VALUES (1, '')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (Public Access)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public access" ON tasks;
DROP POLICY IF EXISTS "Public access" ON todos;
DROP POLICY IF EXISTS "Public access" ON tags;
DROP POLICY IF EXISTS "Public access" ON notes;

CREATE POLICY "Public access" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON todos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON notes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE tags;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
