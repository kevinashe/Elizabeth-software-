/*
  # Fix Multiple Permissive Policies

  1. Issue
    - Multiple permissive policies for the same role/action can cause confusion
    - Consolidate into single policies where appropriate
  
  2. Tables Fixed
    - user_settings (duplicate INSERT/SELECT/UPDATE policies)
    - performance_profiles (duplicate INSERT/SELECT policies)
    - All other tables with multiple permissive policies
  
  3. Strategy
    - Drop duplicate policies
    - Keep the most specific/restrictive one
*/

-- user_settings: Remove duplicate policies, keep the optimized ones
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

-- performance_profiles: Remove old duplicate policies
DROP POLICY IF EXISTS "System can insert profiles" ON performance_profiles;

-- auto_documentation: Consolidate view and manage
DROP POLICY IF EXISTS "Project members can view documentation" ON auto_documentation;

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

-- codebase_index: Keep both as they serve different purposes
-- (view is read-only, manage is for write operations)

-- collaboration_sessions: Keep both as they serve different purposes
-- (view for all project members, manage for hosts only)

-- dependency_graph: Keep both
-- (view for read, manage for system operations)

-- knowledge_base: Check and keep appropriate policies
-- (anyone can read, system can manage)

-- live_cursors: Keep both
-- (view for project members, manage for own cursors)

-- shared_selections: Keep both
-- (view for project members, manage for own selections)

-- user_presence: Keep both
-- (view for project members, manage for own presence)

-- user_roles: Keep both
-- (view own roles, admins can manage all)

-- web_search_cache: Keep both
-- (anyone can read, system can manage)