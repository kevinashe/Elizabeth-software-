/*
  # Documentation and Testing System

  1. New Tables
    - `auto_documentation`
      - AI-generated project documentation
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `doc_type` (text) - readme, api, architecture, guide
      - `title` (text)
      - `content` (text)
      - `generated_at` (timestamp)
      - `updated_at` (timestamp)
      - `auto_generated` (boolean)
      - `version` (text)
    
    - `git_integration`
      - Git repository integration
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `repo_url` (text)
      - `branch` (text)
      - `last_commit` (text)
      - `last_sync` (timestamp)
      - `access_token` (text) - encrypted
      - `provider` (text) - github, gitlab, bitbucket
    
    - `commit_history`
      - Version history from git
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `commit_hash` (text)
      - `author` (text)
      - `message` (text)
      - `files_changed` (jsonb)
      - `timestamp` (timestamp)
    
    - `dependency_graph`
      - Project dependencies visualization
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `package_name` (text)
      - `version` (text)
      - `dependencies` (jsonb)
      - `dev_dependency` (boolean)
      - `outdated` (boolean)
      - `vulnerabilities` (jsonb)
    
    - `test_coverage`
      - Test coverage reports
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `file_path` (text)
      - `coverage_percentage` (float)
      - `lines_covered` (int)
      - `lines_total` (int)
      - `branches_covered` (int)
      - `branches_total` (int)
      - `functions_covered` (int)
      - `functions_total` (int)
      - `report_date` (timestamp)
    
    - `test_results`
      - Test execution results
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `test_suite` (text)
      - `status` (text) - passed, failed, skipped
      - `duration_ms` (float)
      - `tests_passed` (int)
      - `tests_failed` (int)
      - `tests_skipped` (int)
      - `failures` (jsonb)
      - `run_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Project members can view documentation
    - Only project owners can manage git integration
    - Test results visible to team members
*/

CREATE TABLE IF NOT EXISTS auto_documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('readme', 'api', 'architecture', 'guide', 'changelog')),
  title text NOT NULL,
  content text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  auto_generated boolean DEFAULT true,
  version text
);

CREATE INDEX IF NOT EXISTS idx_docs_project ON auto_documentation(project_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON auto_documentation(doc_type);
CREATE INDEX IF NOT EXISTS idx_docs_updated ON auto_documentation(updated_at DESC);

ALTER TABLE auto_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view documentation"
  ON auto_documentation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = auto_documentation.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can manage documentation"
  ON auto_documentation FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = auto_documentation.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = auto_documentation.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS git_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  repo_url text NOT NULL,
  branch text DEFAULT 'main',
  last_commit text,
  last_sync timestamptz,
  access_token text,
  provider text NOT NULL CHECK (provider IN ('github', 'gitlab', 'bitbucket', 'azure')),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_git_project ON git_integration(project_id);
CREATE INDEX IF NOT EXISTS idx_git_provider ON git_integration(provider);

ALTER TABLE git_integration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners can manage git integration"
  ON git_integration FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = git_integration.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = git_integration.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS commit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  commit_hash text NOT NULL,
  author text NOT NULL,
  message text NOT NULL,
  files_changed jsonb DEFAULT '[]'::jsonb,
  timestamp timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_commits_project ON commit_history(project_id);
CREATE INDEX IF NOT EXISTS idx_commits_hash ON commit_history(commit_hash);
CREATE INDEX IF NOT EXISTS idx_commits_timestamp ON commit_history(timestamp DESC);

ALTER TABLE commit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view commit history"
  ON commit_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = commit_history.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert commit history"
  ON commit_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS dependency_graph (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  package_name text NOT NULL,
  version text NOT NULL,
  dependencies jsonb DEFAULT '[]'::jsonb,
  dev_dependency boolean DEFAULT false,
  outdated boolean DEFAULT false,
  vulnerabilities jsonb DEFAULT '[]'::jsonb,
  UNIQUE(project_id, package_name)
);

CREATE INDEX IF NOT EXISTS idx_deps_project ON dependency_graph(project_id);
CREATE INDEX IF NOT EXISTS idx_deps_package ON dependency_graph(package_name);
CREATE INDEX IF NOT EXISTS idx_deps_outdated ON dependency_graph(outdated);
CREATE INDEX IF NOT EXISTS idx_deps_vulnerable ON dependency_graph((jsonb_array_length(vulnerabilities) > 0));

ALTER TABLE dependency_graph ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view dependencies"
  ON dependency_graph FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = dependency_graph.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage dependencies"
  ON dependency_graph FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = dependency_graph.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = dependency_graph.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS test_coverage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  coverage_percentage float NOT NULL,
  lines_covered int NOT NULL,
  lines_total int NOT NULL,
  branches_covered int DEFAULT 0,
  branches_total int DEFAULT 0,
  functions_covered int DEFAULT 0,
  functions_total int DEFAULT 0,
  report_date timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coverage_project ON test_coverage(project_id);
CREATE INDEX IF NOT EXISTS idx_coverage_file ON test_coverage(file_path);
CREATE INDEX IF NOT EXISTS idx_coverage_date ON test_coverage(report_date DESC);

ALTER TABLE test_coverage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view coverage"
  ON test_coverage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = test_coverage.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert coverage"
  ON test_coverage FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  test_suite text NOT NULL,
  status text NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
  duration_ms float NOT NULL,
  tests_passed int DEFAULT 0,
  tests_failed int DEFAULT 0,
  tests_skipped int DEFAULT 0,
  failures jsonb DEFAULT '[]'::jsonb,
  run_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_results_project ON test_results(project_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_run ON test_results(run_at DESC);

ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = test_results.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert test results"
  ON test_results FOR INSERT
  TO authenticated
  WITH CHECK (true);
