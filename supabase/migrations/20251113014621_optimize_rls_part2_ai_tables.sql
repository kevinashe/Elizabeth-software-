/*
  # Optimize RLS Policies - Part 2: AI Tables

  1. Tables Updated
    - test_generations
    - performance_profiles
    - documentation_auto
    - git_insights
    - multi_modal_uploads
*/

-- test_generations table
DROP POLICY IF EXISTS "Users can view tests for their projects" ON test_generations;
DROP POLICY IF EXISTS "Users can create tests for their projects" ON test_generations;

CREATE POLICY "Users can view tests for their projects"
  ON test_generations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = test_generations.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create tests for their projects"
  ON test_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = test_generations.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- performance_profiles table
DROP POLICY IF EXISTS "Users can view profiles for their projects" ON performance_profiles;
DROP POLICY IF EXISTS "Users can create profiles for their projects" ON performance_profiles;

CREATE POLICY "Users can view profiles for their projects"
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

CREATE POLICY "Users can create profiles for their projects"
  ON performance_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = performance_profiles.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- documentation_auto table
DROP POLICY IF EXISTS "Users can view docs for their projects" ON documentation_auto;
DROP POLICY IF EXISTS "Users can create docs for their projects" ON documentation_auto;
DROP POLICY IF EXISTS "Users can update docs for their projects" ON documentation_auto;

CREATE POLICY "Users can view docs for their projects"
  ON documentation_auto
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documentation_auto.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create docs for their projects"
  ON documentation_auto
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documentation_auto.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update docs for their projects"
  ON documentation_auto
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documentation_auto.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documentation_auto.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- git_insights table
DROP POLICY IF EXISTS "Users can view insights for their projects" ON git_insights;
DROP POLICY IF EXISTS "Users can create insights for their projects" ON git_insights;

CREATE POLICY "Users can view insights for their projects"
  ON git_insights
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = git_insights.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create insights for their projects"
  ON git_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = git_insights.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- multi_modal_uploads table
DROP POLICY IF EXISTS "Users can view own uploads" ON multi_modal_uploads;
DROP POLICY IF EXISTS "Users can create own uploads" ON multi_modal_uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON multi_modal_uploads;

CREATE POLICY "Users can view own uploads"
  ON multi_modal_uploads
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own uploads"
  ON multi_modal_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own uploads"
  ON multi_modal_uploads
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));