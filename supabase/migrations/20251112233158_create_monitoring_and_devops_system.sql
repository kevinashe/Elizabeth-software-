/*
  # Monitoring and DevOps System

  1. New Tables
    - `deployments`
      - Tracks deployment history
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `version` (text)
      - `environment` (text) - dev, staging, production
      - `status` (text) - pending, deploying, success, failed
      - `commit_hash` (text)
      - `deployed_by` (uuid, references auth.users)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `logs` (text)
      - `metadata` (jsonb)
    
    - `ci_cd_pipelines`
      - CI/CD pipeline configurations
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `pipeline_name` (text)
      - `config` (jsonb) - pipeline configuration
      - `triggers` (text[]) - push, pr, manual
      - `last_run` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)
    
    - `application_metrics`
      - Real-time application metrics
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `metric_type` (text) - cpu, memory, requests, errors
      - `metric_name` (text)
      - `value` (float)
      - `unit` (text)
      - `tags` (jsonb)
      - `timestamp` (timestamp)
    
    - `error_tracking`
      - Error and exception tracking
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `error_type` (text)
      - `error_message` (text)
      - `stack_trace` (text)
      - `severity` (text) - critical, high, medium, low
      - `frequency` (int)
      - `first_seen` (timestamp)
      - `last_seen` (timestamp)
      - `resolved` (boolean)
      - `metadata` (jsonb)
    
    - `performance_profiles`
      - Performance profiling data
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `profile_type` (text) - cpu, memory, network
      - `duration_ms` (float)
      - `data` (jsonb)
      - `created_at` (timestamp)
    
    - `cost_tracking`
      - Cloud cost tracking and optimization
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `service` (text) - compute, storage, network
      - `cost` (float)
      - `currency` (text)
      - `period_start` (date)
      - `period_end` (date)
      - `usage_details` (jsonb)
    
    - `container_registry`
      - Container image tracking
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `image_name` (text)
      - `tag` (text)
      - `digest` (text)
      - `size_bytes` (bigint)
      - `pushed_at` (timestamp)
      - `pulled_count` (int)

  2. Security
    - Enable RLS on all tables
    - Project members can view metrics
    - Only authorized users can trigger deployments
    - Error tracking visible to project team
*/

CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('dev', 'staging', 'production')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'success', 'failed', 'rolled_back')),
  commit_hash text,
  deployed_by uuid REFERENCES auth.users(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  logs text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_env ON deployments(environment);
CREATE INDEX IF NOT EXISTS idx_deployments_started ON deployments(started_at DESC);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view deployments"
  ON deployments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deployments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create deployments"
  ON deployments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deployments.project_id
      AND projects.user_id = auth.uid()
    ) AND auth.uid() = deployed_by
  );

CREATE POLICY "Project members can update deployments"
  ON deployments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deployments.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deployments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS ci_cd_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  pipeline_name text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  triggers text[] DEFAULT ARRAY['push']::text[],
  last_run timestamptz,
  status text DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'success', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_project ON ci_cd_pipelines(project_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_status ON ci_cd_pipelines(status);

ALTER TABLE ci_cd_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can manage pipelines"
  ON ci_cd_pipelines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = ci_cd_pipelines.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = ci_cd_pipelines.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS application_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  value float NOT NULL,
  unit text,
  tags jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_project ON application_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON application_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON application_metrics(timestamp DESC);

ALTER TABLE application_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view metrics"
  ON application_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = application_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert metrics"
  ON application_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS error_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  frequency int DEFAULT 1,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_errors_project ON error_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_errors_severity ON error_tracking(severity);
CREATE INDEX IF NOT EXISTS idx_errors_resolved ON error_tracking(resolved);
CREATE INDEX IF NOT EXISTS idx_errors_last_seen ON error_tracking(last_seen DESC);

ALTER TABLE error_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can manage errors"
  ON error_tracking FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = error_tracking.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = error_tracking.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS performance_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  profile_type text NOT NULL CHECK (profile_type IN ('cpu', 'memory', 'network', 'database')),
  duration_ms float,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_project ON performance_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON performance_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON performance_profiles(created_at DESC);

ALTER TABLE performance_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view profiles"
  ON performance_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = performance_profiles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert profiles"
  ON performance_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cost_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  service text NOT NULL,
  cost float NOT NULL,
  currency text DEFAULT 'USD',
  period_start date NOT NULL,
  period_end date NOT NULL,
  usage_details jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_costs_project ON cost_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_costs_period ON cost_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_costs_service ON cost_tracking(service);

ALTER TABLE cost_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view costs"
  ON cost_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = cost_tracking.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert costs"
  ON cost_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS container_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  image_name text NOT NULL,
  tag text NOT NULL,
  digest text NOT NULL,
  size_bytes bigint,
  pushed_at timestamptz DEFAULT now(),
  pulled_count int DEFAULT 0,
  UNIQUE(project_id, image_name, tag)
);

CREATE INDEX IF NOT EXISTS idx_containers_project ON container_registry(project_id);
CREATE INDEX IF NOT EXISTS idx_containers_image ON container_registry(image_name);
CREATE INDEX IF NOT EXISTS idx_containers_pushed ON container_registry(pushed_at DESC);

ALTER TABLE container_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can manage containers"
  ON container_registry FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = container_registry.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = container_registry.project_id
      AND projects.user_id = auth.uid()
    )
  );
