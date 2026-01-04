-- Migration Script: Add Multi-Project Support
-- Run this AFTER your initial schema if you have existing data
-- This will migrate existing tasks/todos/tags/notes to a default project

-- ============================================
-- STEP 1: Create projects table
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#e59500',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON projects;
CREATE POLICY "Public access" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- ============================================
-- STEP 2: Create a default project for migration
-- ============================================

INSERT INTO projects (id, name, color, description, created_at)
VALUES ('default-project', 'My Project', '#e59500', 'Default project for migrated data', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: Add project_id columns
-- ============================================

-- Add project_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
UPDATE tasks SET project_id = 'default-project' WHERE project_id IS NULL;

-- Add project_id to todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
UPDATE todos SET project_id = 'default-project' WHERE project_id IS NULL;

-- Add project_id to tags
ALTER TABLE tags ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
UPDATE tags SET project_id = 'default-project' WHERE project_id IS NULL;

-- ============================================
-- STEP 4: Migrate notes table
-- ============================================

-- Add project_id to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;

-- Change notes id from INTEGER to TEXT if needed
-- First, update existing notes to have proper ids
UPDATE notes SET project_id = 'default-project' WHERE project_id IS NULL;

-- ============================================
-- STEP 5: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_project ON todos(project_id);
CREATE INDEX IF NOT EXISTS idx_tags_project ON tags(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);

-- ============================================
-- DONE! Your existing data is now in the "My Project" project
-- ============================================
