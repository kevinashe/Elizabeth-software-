/*
  # Create project files table

  1. New Tables
    - `project_files`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, references auth.users)
      - `file_name` (text) - Name of the file (e.g., "index.html")
      - `file_path` (text) - Path within project (e.g., "/src/index.html")
      - `content` (text) - File contents
      - `language` (text) - Programming language/type (e.g., "html", "javascript")
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `project_files` table
    - Add policy for users to read their own project files
    - Add policy for users to insert their own project files
    - Add policy for users to update their own project files
    - Add policy for users to delete their own project files

  3. Indexes
    - Add index on project_id for faster lookups
    - Add index on user_id for faster user queries
*/

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'plaintext',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project files"
  ON project_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project files"
  ON project_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project files"
  ON project_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project files"
  ON project_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS project_files_project_id_idx ON project_files(project_id);
CREATE INDEX IF NOT EXISTS project_files_user_id_idx ON project_files(user_id);
