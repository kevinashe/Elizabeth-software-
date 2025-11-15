/*
  # Optimize RLS Policies - Part 4: Collaboration Tables

  1. Tables Updated
    - conversation_memory
    - codebase_index
    - user_presence
    - collaboration_sessions
    - live_cursors
    - shared_selections
*/

-- conversation_memory table
DROP POLICY IF EXISTS "Users can view own conversation memory" ON conversation_memory;
DROP POLICY IF EXISTS "Users can insert own conversation memory" ON conversation_memory;
DROP POLICY IF EXISTS "Users can update own conversation memory" ON conversation_memory;
DROP POLICY IF EXISTS "Users can delete own conversation memory" ON conversation_memory;

CREATE POLICY "Users can view own conversation memory"
  ON conversation_memory
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own conversation memory"
  ON conversation_memory
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own conversation memory"
  ON conversation_memory
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own conversation memory"
  ON conversation_memory
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- codebase_index table
DROP POLICY IF EXISTS "Project members can view codebase index" ON codebase_index;
DROP POLICY IF EXISTS "Project owners can manage codebase index" ON codebase_index;

CREATE POLICY "Project members can view codebase index"
  ON codebase_index
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = codebase_index.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Project owners can manage codebase index"
  ON codebase_index
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = codebase_index.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = codebase_index.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- user_presence table
DROP POLICY IF EXISTS "Users can view presence of project members" ON user_presence;
DROP POLICY IF EXISTS "Users can manage own presence" ON user_presence;

CREATE POLICY "Users can view presence of project members"
  ON user_presence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = user_presence.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage own presence"
  ON user_presence
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- collaboration_sessions table
DROP POLICY IF EXISTS "Project members can view sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Hosts can manage sessions" ON collaboration_sessions;

CREATE POLICY "Project members can view sessions"
  ON collaboration_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = collaboration_sessions.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Hosts can manage sessions"
  ON collaboration_sessions
  FOR ALL
  TO authenticated
  USING (host_user_id = (select auth.uid()))
  WITH CHECK (host_user_id = (select auth.uid()));

-- live_cursors table
DROP POLICY IF EXISTS "Project members can view cursors" ON live_cursors;
DROP POLICY IF EXISTS "Users can manage own cursors" ON live_cursors;

CREATE POLICY "Project members can view cursors"
  ON live_cursors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = live_cursors.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage own cursors"
  ON live_cursors
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- shared_selections table
DROP POLICY IF EXISTS "Project members can view selections" ON shared_selections;
DROP POLICY IF EXISTS "Users can manage own selections" ON shared_selections;

CREATE POLICY "Project members can view selections"
  ON shared_selections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = shared_selections.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage own selections"
  ON shared_selections
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));