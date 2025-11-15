/*
  # Create user settings table

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `theme` (text) - UI theme preference (light, dark, auto)
      - `notifications_enabled` (boolean) - Email notifications
      - `auto_save_enabled` (boolean) - Auto-save in code editor
      - `default_region` (text) - Default Azure region
      - `display_name` (text) - User display name
      - `avatar_url` (text) - Profile picture URL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for users to view their own settings
    - Add policy for users to insert their own settings
    - Add policy for users to update their own settings

  3. Indexes
    - Add unique index on user_id

  4. Notes
    - Each user can have only one settings record
    - Settings are created on first access or can be explicitly initialized
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme text DEFAULT 'light',
  notifications_enabled boolean DEFAULT true,
  auto_save_enabled boolean DEFAULT false,
  default_region text DEFAULT 'eastus',
  display_name text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);
