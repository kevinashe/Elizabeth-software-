/*
  # Fix Duplicate RLS Policies

  1. Security Enhancement
    - Remove duplicate permissive SELECT policies that can cause security confusion
    - Consolidate multiple policies into single, clear policies
    - Maintain security while improving policy clarity

  2. Tables Updated
    - `auto_documentation` - Consolidate view and manage policies
    - `codebase_index` - Consolidate view and manage policies
    - `collaboration_sessions` - Consolidate host and member view policies
    - `dependency_graph` - Consolidate view and manage policies
    - `knowledge_base` - Consolidate read and manage policies
    - `live_cursors` - Consolidate view and manage policies
    - `performance_profiles` - Consolidate view policies
    - `shared_selections` - Consolidate view and manage policies
    - `user_presence` - Consolidate manage and view policies
    - `user_roles` - Consolidate view and manage policies
    - `web_search_cache` - Consolidate read and manage policies

  3. Strategy
    - Drop duplicate policies
    - Keep or create single consolidated policy per action
    - Use OR conditions to combine access rules
*/

-- auto_documentation: Consolidate SELECT policies
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
      AND projects.user_id = auth.uid()
    )
  );

-- codebase_index: Consolidate SELECT policies
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
      AND projects.user_id = auth.uid()
    )
  );

-- collaboration_sessions: Consolidate SELECT policies
DROP POLICY IF EXISTS "Hosts can manage sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Project members can view sessions" ON collaboration_sessions;

CREATE POLICY "Users can view collaboration sessions"
  ON collaboration_sessions
  FOR SELECT
  TO authenticated
  USING (
    host_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaboration_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- dependency_graph: Consolidate SELECT policies
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
      AND projects.user_id = auth.uid()
    )
  );

-- knowledge_base: Consolidate SELECT policies
DROP POLICY IF EXISTS "Anyone can read knowledge base" ON knowledge_base;
DROP POLICY IF EXISTS "System can manage knowledge base" ON knowledge_base;

CREATE POLICY "Authenticated users can read knowledge base"
  ON knowledge_base
  FOR SELECT
  TO authenticated
  USING (true);

-- live_cursors: Consolidate SELECT policies
DROP POLICY IF EXISTS "Project members can view cursors" ON live_cursors;
DROP POLICY IF EXISTS "Users can manage own cursors" ON live_cursors;

CREATE POLICY "Users can view project cursors"
  ON live_cursors
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = live_cursors.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- performance_profiles: Consolidate SELECT policies
DROP POLICY IF EXISTS "Project members can view profiles" ON performance_profiles;
DROP POLICY IF EXISTS "Users can view profiles for their projects" ON performance_profiles;

CREATE POLICY "Project members can view profiles"
  ON performance_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = performance_profiles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- shared_selections: Consolidate SELECT policies
DROP POLICY IF EXISTS "Project members can view selections" ON shared_selections;
DROP POLICY IF EXISTS "Users can manage own selections" ON shared_selections;

CREATE POLICY "Users can view project selections"
  ON shared_selections
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = shared_selections.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- user_presence: Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can manage own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can view presence of project members" ON user_presence;

CREATE POLICY "Users can view project presence"
  ON user_presence
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = user_presence.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- user_roles: Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Users can view relevant roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = user_roles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- web_search_cache: Consolidate SELECT policies
DROP POLICY IF EXISTS "Anyone can read search cache" ON web_search_cache;
DROP POLICY IF EXISTS "System can manage search cache" ON web_search_cache;

CREATE POLICY "Authenticated users can read search cache"
  ON web_search_cache
  FOR SELECT
  TO authenticated
  USING (true);
