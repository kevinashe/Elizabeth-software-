/*
  # AI Enhancement System Schema

  1. New Tables
    - `ai_memories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, nullable, foreign key to projects)
      - `memory_type` (text) - 'preference', 'pattern', 'decision', 'learning'
      - `context` (text) - what was happening when memory was created
      - `content` (jsonb) - the actual memory data
      - `confidence` (float) - how confident we are about this memory
      - `created_at` (timestamptz)
      - `last_accessed` (timestamptz)
      - `access_count` (integer)

    - `code_analyses`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `file_path` (text)
      - `analysis_type` (text) - 'security', 'performance', 'quality', 'documentation'
      - `severity` (text) - 'critical', 'high', 'medium', 'low', 'info'
      - `title` (text)
      - `description` (text)
      - `suggestions` (jsonb)
      - `code_snippet` (text)
      - `line_number` (integer)
      - `status` (text) - 'open', 'acknowledged', 'resolved', 'ignored'
      - `created_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)

    - `project_sessions`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_data` (jsonb) - context, decisions made, patterns observed
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz, nullable)
      - `files_modified` (jsonb)
      - `key_decisions` (jsonb)

    - `test_generations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `file_path` (text)
      - `test_type` (text) - 'unit', 'integration', 'e2e'
      - `test_code` (text)
      - `coverage_data` (jsonb)
      - `status` (text) - 'generated', 'applied', 'passing', 'failing'
      - `created_at` (timestamptz)

    - `performance_profiles`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `profile_type` (text) - 'build', 'runtime', 'memory', 'network'
      - `metrics` (jsonb)
      - `bottlenecks` (jsonb)
      - `recommendations` (jsonb)
      - `created_at` (timestamptz)

    - `documentation_auto`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `file_path` (text)
      - `doc_type` (text) - 'function', 'class', 'module', 'api'
      - `generated_content` (text)
      - `status` (text) - 'draft', 'reviewed', 'published'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `git_insights`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `commit_hash` (text)
      - `file_path` (text)
      - `insight_type` (text) - 'refactor_reason', 'bug_fix', 'feature_addition'
      - `analysis` (jsonb)
      - `related_commits` (jsonb)
      - `created_at` (timestamptz)

    - `multi_modal_uploads`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, nullable, foreign key to projects)
      - `file_type` (text) - 'video', 'audio', 'image', 'diagram'
      - `file_url` (text)
      - `processed_data` (jsonb) - transcriptions, analysis results
      - `status` (text) - 'uploaded', 'processing', 'completed', 'failed'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for project-based access control
*/

-- AI Memories Table
CREATE TABLE IF NOT EXISTS ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  memory_type text NOT NULL CHECK (memory_type IN ('preference', 'pattern', 'decision', 'learning')),
  context text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  confidence float DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 0
);

ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories"
  ON ai_memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own memories"
  ON ai_memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON ai_memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON ai_memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Code Analyses Table
CREATE TABLE IF NOT EXISTS code_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  analysis_type text NOT NULL CHECK (analysis_type IN ('security', 'performance', 'quality', 'documentation')),
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  title text NOT NULL,
  description text NOT NULL,
  suggestions jsonb DEFAULT '[]',
  code_snippet text,
  line_number integer,
  status text DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE code_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses for their projects"
  ON code_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_analyses.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create analyses for their projects"
  ON code_analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_analyses.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analyses for their projects"
  ON code_analyses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_analyses.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_analyses.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project Sessions Table
CREATE TABLE IF NOT EXISTS project_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_data jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  files_modified jsonb DEFAULT '[]',
  key_decisions jsonb DEFAULT '[]'
);

ALTER TABLE project_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON project_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON project_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON project_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Test Generations Table
CREATE TABLE IF NOT EXISTS test_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  test_type text NOT NULL CHECK (test_type IN ('unit', 'integration', 'e2e')),
  test_code text NOT NULL,
  coverage_data jsonb DEFAULT '{}',
  status text DEFAULT 'generated' CHECK (status IN ('generated', 'applied', 'passing', 'failing')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tests for their projects"
  ON test_generations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = test_generations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tests for their projects"
  ON test_generations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = test_generations.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Performance Profiles Table
CREATE TABLE IF NOT EXISTS performance_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  profile_type text NOT NULL CHECK (profile_type IN ('build', 'runtime', 'memory', 'network')),
  metrics jsonb DEFAULT '{}',
  bottlenecks jsonb DEFAULT '[]',
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE performance_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles for their projects"
  ON performance_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = performance_profiles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create profiles for their projects"
  ON performance_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = performance_profiles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Documentation Auto Table
CREATE TABLE IF NOT EXISTS documentation_auto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('function', 'class', 'module', 'api')),
  generated_content text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documentation_auto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view docs for their projects"
  ON documentation_auto FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documentation_auto.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create docs for their projects"
  ON documentation_auto FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documentation_auto.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update docs for their projects"
  ON documentation_auto FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documentation_auto.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documentation_auto.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Git Insights Table
CREATE TABLE IF NOT EXISTS git_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  commit_hash text NOT NULL,
  file_path text NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('refactor_reason', 'bug_fix', 'feature_addition')),
  analysis jsonb DEFAULT '{}',
  related_commits jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE git_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view insights for their projects"
  ON git_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = git_insights.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create insights for their projects"
  ON git_insights FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = git_insights.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Multi-Modal Uploads Table
CREATE TABLE IF NOT EXISTS multi_modal_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  file_type text NOT NULL CHECK (file_type IN ('video', 'audio', 'image', 'diagram')),
  file_url text NOT NULL,
  processed_data jsonb DEFAULT '{}',
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE multi_modal_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own uploads"
  ON multi_modal_uploads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own uploads"
  ON multi_modal_uploads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads"
  ON multi_modal_uploads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_memories_user_id ON ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_project_id ON ai_memories(project_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_project_id ON code_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_status ON code_analyses(status);
CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id ON project_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_test_generations_project_id ON test_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_profiles_project_id ON performance_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_documentation_auto_project_id ON documentation_auto(project_id);
CREATE INDEX IF NOT EXISTS idx_git_insights_project_id ON git_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_multi_modal_uploads_user_id ON multi_modal_uploads(user_id);