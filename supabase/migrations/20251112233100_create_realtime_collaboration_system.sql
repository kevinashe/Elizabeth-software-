/*
  # Real-time Collaboration System

  1. New Tables
    - `user_presence`
      - Tracks online users and their current activity
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `project_id` (uuid, references projects)
      - `status` (text) - online, away, busy
      - `current_file` (text) - file they're viewing/editing
      - `cursor_position` (jsonb) - line, column
      - `last_seen` (timestamp)
      - `metadata` (jsonb) - browser, device info
    
    - `collaboration_sessions`
      - Manages active collaboration sessions
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `session_name` (text)
      - `host_user_id` (uuid, references auth.users)
      - `participants` (jsonb) - array of user IDs
      - `started_at` (timestamp)
      - `ended_at` (timestamp)
    
    - `live_cursors`
      - Tracks real-time cursor positions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `project_id` (uuid, references projects)
      - `file_path` (text)
      - `position` (jsonb) - line, column, selection
      - `color` (text) - user's cursor color
      - `updated_at` (timestamp)
    
    - `shared_selections`
      - Tracks text selections for collaboration
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `project_id` (uuid, references projects)
      - `file_path` (text)
      - `selection_range` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can view presence of project members
    - Only authenticated users in sessions can see cursors
    - Real-time subscriptions enabled
*/

CREATE TABLE IF NOT EXISTS user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy')),
  current_file text,
  cursor_position jsonb DEFAULT '{}'::jsonb,
  last_seen timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_presence_user ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_project ON user_presence(project_id);
CREATE INDEX IF NOT EXISTS idx_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen DESC);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence of project members"
  ON user_presence FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = user_presence.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own presence"
  ON user_presence FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  session_name text NOT NULL,
  host_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participants jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_collab_sessions_project ON collaboration_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_host ON collaboration_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_active ON collaboration_sessions(ended_at) WHERE ended_at IS NULL;

ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view sessions"
  ON collaboration_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaboration_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can manage sessions"
  ON collaboration_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

CREATE TABLE IF NOT EXISTS live_cursors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  position jsonb NOT NULL,
  color text DEFAULT '#3b82f6',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_live_cursors_project_file ON live_cursors(project_id, file_path);
CREATE INDEX IF NOT EXISTS idx_live_cursors_user ON live_cursors(user_id);

ALTER TABLE live_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view cursors"
  ON live_cursors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = live_cursors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own cursors"
  ON live_cursors FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS shared_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  selection_range jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_selections_project_file ON shared_selections(project_id, file_path);
CREATE INDEX IF NOT EXISTS idx_shared_selections_user ON shared_selections(user_id);

ALTER TABLE shared_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view selections"
  ON shared_selections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = shared_selections.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own selections"
  ON shared_selections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
