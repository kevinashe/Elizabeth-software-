/*
  # Optimize RLS Policies for Performance - Part 1

  1. Performance Improvements
    - Wrap auth functions in SELECT to prevent re-evaluation for each row
    - Improves query performance at scale
  
  2. Tables Updated (Part 1)
    - requirements
    - projects  
    - ai_memories
    - code_analyses
    - project_sessions
*/

-- requirements table
DROP POLICY IF EXISTS "Users can update their own requirements" ON requirements;
DROP POLICY IF EXISTS "Users can delete their own requirements" ON requirements;

CREATE POLICY "Users can update their own requirements"
  ON requirements
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own requirements"
  ON requirements
  FOR DELETE
  TO authenticated
  USING ((select auth.uid())::text = user_id);

-- projects table
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ai_memories table
DROP POLICY IF EXISTS "Users can view own memories" ON ai_memories;
DROP POLICY IF EXISTS "Users can create own memories" ON ai_memories;
DROP POLICY IF EXISTS "Users can update own memories" ON ai_memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON ai_memories;

CREATE POLICY "Users can view own memories"
  ON ai_memories
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own memories"
  ON ai_memories
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own memories"
  ON ai_memories
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own memories"
  ON ai_memories
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- code_analyses table
DROP POLICY IF EXISTS "Users can view analyses for their projects" ON code_analyses;
DROP POLICY IF EXISTS "Users can create analyses for their projects" ON code_analyses;
DROP POLICY IF EXISTS "Users can update analyses for their projects" ON code_analyses;

CREATE POLICY "Users can view analyses for their projects"
  ON code_analyses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = code_analyses.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create analyses for their projects"
  ON code_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = code_analyses.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update analyses for their projects"
  ON code_analyses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = code_analyses.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = code_analyses.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- project_sessions table
DROP POLICY IF EXISTS "Users can view own sessions" ON project_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON project_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON project_sessions;

CREATE POLICY "Users can view own sessions"
  ON project_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own sessions"
  ON project_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own sessions"
  ON project_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));