/*
  # Optimize RLS Policies - Part 3: User & Chat Tables

  1. Tables Updated
    - chat_messages
    - user_settings (optimize existing policies)
    - team_invitations
    - project_files
    - resources
*/

-- chat_messages table
DROP POLICY IF EXISTS "Users can read own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;

CREATE POLICY "Users can read own chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- user_settings table
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- team_invitations table
DROP POLICY IF EXISTS "Users can read own invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can update own invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can delete own invitations" ON team_invitations;

CREATE POLICY "Users can read own invitations"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (inviter_id = (select auth.uid()));

CREATE POLICY "Users can create invitations"
  ON team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = (select auth.uid()));

CREATE POLICY "Users can update own invitations"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (inviter_id = (select auth.uid()))
  WITH CHECK (inviter_id = (select auth.uid()));

CREATE POLICY "Users can delete own invitations"
  ON team_invitations
  FOR DELETE
  TO authenticated
  USING (inviter_id = (select auth.uid()));

-- project_files table
DROP POLICY IF EXISTS "Users can view their own project files" ON project_files;
DROP POLICY IF EXISTS "Users can insert their own project files" ON project_files;
DROP POLICY IF EXISTS "Users can update their own project files" ON project_files;
DROP POLICY IF EXISTS "Users can delete their own project files" ON project_files;

CREATE POLICY "Users can view their own project files"
  ON project_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their own project files"
  ON project_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own project files"
  ON project_files
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their own project files"
  ON project_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

-- resources table
DROP POLICY IF EXISTS "Users can view their own resources" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;

CREATE POLICY "Users can view their own resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = resources.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their own resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = resources.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = resources.project_id 
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = resources.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their own resources"
  ON resources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = resources.project_id 
      AND projects.user_id = (select auth.uid())
    )
  );