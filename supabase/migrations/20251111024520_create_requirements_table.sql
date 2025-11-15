/*
  # Create Requirements Table for SD Platform

  1. New Tables
    - `requirements`
      - `id` (text, primary key) - Unique requirement identifier
      - `title` (text) - Short requirement title
      - `description` (text) - Full requirement description
      - `tags` (text[]) - Array of tags for categorization
      - `metadata` (jsonb) - Additional metadata as JSON
      - `user_id` (text) - User who created the requirement
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `requirements` table
    - Add policy for authenticated users to read all requirements
    - Add policy for authenticated users to create their own requirements
    - Add policy for authenticated users to update their own requirements
    - Add policy for authenticated users to delete their own requirements
*/

CREATE TABLE IF NOT EXISTS requirements (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  tags text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can read all requirements"
  ON requirements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create requirements"
  ON requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own requirements"
  ON requirements
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own requirements"
  ON requirements
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_requirements_user_id ON requirements(user_id);
CREATE INDEX IF NOT EXISTS idx_requirements_created_at ON requirements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requirements_tags ON requirements USING GIN(tags);
