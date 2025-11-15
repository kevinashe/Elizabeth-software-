/*
  # Add AI Assistant Name to User Settings

  1. Changes
    - Add `ai_assistant_name` column to `user_settings` table
    - Default value is 'Elizabeth' to match the system name

  2. Notes
    - Users can customize their AI assistant's name
    - The name will be used in chat conversations
    - No breaking changes to existing settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'ai_assistant_name'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN ai_assistant_name text DEFAULT 'Elizabeth';
  END IF;
END $$;