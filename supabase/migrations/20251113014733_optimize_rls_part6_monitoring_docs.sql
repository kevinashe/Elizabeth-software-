/*
  # Optimize RLS Policies - Part 6: Monitoring & Documentation

  1. Tables Updated
    - performance_profiles (additional policies)
    - cost_tracking
    - container_registry
    - auto_documentation
    - git_integration
    - commit_history
    - dependency_graph
    - test_coverage
    - test_results
*/

-- performance_profiles table (additional policy)
DROP POLICY IF EXISTS "Project members can view profiles" ON performance_profiles;

CREATE POLICY "Project members can view profiles"
  ON performance_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = performance_profiles.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- cost_tracking table
DROP POLICY IF EXISTS "Project members can view costs" ON cost_tracking;

CREATE POLICY "Project members can view costs"
  ON cost_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = cost_tracking.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- container_registry table
DROP POLICY IF EXISTS "Project members can manage containers" ON container_registry;

CREATE POLICY "Project members can manage containers"
  ON container_registry
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = container_registry.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = container_registry.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- auto_documentation table
DROP POLICY IF EXISTS "Project members can view documentation" ON auto_documentation;
DROP POLICY IF EXISTS "Project members can manage documentation" ON auto_documentation;

CREATE POLICY "Project members can view documentation"
  ON auto_documentation
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = auto_documentation.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Project members can manage documentation"
  ON auto_documentation
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = auto_documentation.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = auto_documentation.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- git_integration table
DROP POLICY IF EXISTS "Project owners can manage git integration" ON git_integration;

CREATE POLICY "Project owners can manage git integration"
  ON git_integration
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = git_integration.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = git_integration.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- commit_history table
DROP POLICY IF EXISTS "Project members can view commit history" ON commit_history;

CREATE POLICY "Project members can view commit history"
  ON commit_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = commit_history.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- dependency_graph table
DROP POLICY IF EXISTS "Project members can view dependencies" ON dependency_graph;
DROP POLICY IF EXISTS "System can manage dependencies" ON dependency_graph;

CREATE POLICY "Project members can view dependencies"
  ON dependency_graph
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = dependency_graph.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can manage dependencies"
  ON dependency_graph
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = dependency_graph.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = dependency_graph.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- test_coverage table
DROP POLICY IF EXISTS "Project members can view coverage" ON test_coverage;

CREATE POLICY "Project members can view coverage"
  ON test_coverage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = test_coverage.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- test_results table
DROP POLICY IF EXISTS "Project members can view test results" ON test_results;

CREATE POLICY "Project members can view test results"
  ON test_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = test_results.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );