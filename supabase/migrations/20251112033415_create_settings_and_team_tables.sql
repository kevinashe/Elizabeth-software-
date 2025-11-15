/*
  # Create settings and team management tables

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_notifications` (boolean, default true)
      - `slack_notifications` (boolean, default false)
      - `weekly_reports` (boolean, default true)
      - `two_factor_auth` (boolean, default false)
      - `session_timeout` (text, default '30')
      - `theme` (text, default 'light')
      - `language` (text, default 'en')
      - `updated_at` (timestamptz, default now())
    
    - `team_invitations`
      - `id` (uuid, primary key)
      - `inviter_id` (uuid, references auth.users)
      - `email` (text)
      - `role` (text, default 'member')
      - `status` (text, default 'pending')
      - `created_at` (timestamptz, default now())
      
  2. Security
    - Enable RLS on both tables
    - Users can read and update their own settings
    - Users can manage their own team invitations
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_notifications boolean DEFAULT true,
  slack_notifications boolean DEFAULT false,
  weekly_reports boolean DEFAULT true,
  two_factor_auth boolean DEFAULT false,
  session_timeout text DEFAULT '30',
  theme text DEFAULT 'light',
  language text DEFAULT 'en',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'member',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own invitations"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invitations"
  ON team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update own invitations"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = inviter_id)
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can delete own invitations"
  ON team_invitations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = inviter_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_inviter_id ON team_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);