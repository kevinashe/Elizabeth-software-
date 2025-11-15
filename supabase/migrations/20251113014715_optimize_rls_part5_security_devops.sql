/*
  # Optimize RLS Policies - Part 5: Security & DevOps Tables

  1. Tables Updated
    - api_keys
    - mfa_settings
    - audit_logs
    - user_roles
    - deployments
    - ci_cd_pipelines
    - application_metrics
    - error_tracking
*/

-- api_keys table
DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;

CREATE POLICY "Users can view own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- mfa_settings table
DROP POLICY IF EXISTS "Users can manage own MFA settings" ON mfa_settings;

CREATE POLICY "Users can manage own MFA settings"
  ON mfa_settings
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- audit_logs table
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- user_roles table
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role = 'admin'
    )
  );

-- deployments table
DROP POLICY IF EXISTS "Project members can view deployments" ON deployments;
DROP POLICY IF EXISTS "Project members can create deployments" ON deployments;
DROP POLICY IF EXISTS "Project members can update deployments" ON deployments;

CREATE POLICY "Project members can view deployments"
  ON deployments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = deployments.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Project members can create deployments"
  ON deployments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = deployments.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Project members can update deployments"
  ON deployments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = deployments.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = deployments.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- ci_cd_pipelines table
DROP POLICY IF EXISTS "Project members can manage pipelines" ON ci_cd_pipelines;

CREATE POLICY "Project members can manage pipelines"
  ON ci_cd_pipelines
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = ci_cd_pipelines.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = ci_cd_pipelines.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- application_metrics table
DROP POLICY IF EXISTS "Project members can view metrics" ON application_metrics;

CREATE POLICY "Project members can view metrics"
  ON application_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = application_metrics.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- error_tracking table
DROP POLICY IF EXISTS "Project members can manage errors" ON error_tracking;

CREATE POLICY "Project members can manage errors"
  ON error_tracking
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = error_tracking.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = error_tracking.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );