/*
  # Create resources table

  1. New Tables
    - `resources`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `project_id` (uuid, references projects, optional)
      - `name` (text) - Resource name
      - `type` (text) - Type of resource (e.g., "VM", "Storage", "Database", "Network")
      - `status` (text) - Resource status (e.g., "running", "stopped", "provisioning")
      - `region` (text) - Azure region (e.g., "eastus", "westeurope")
      - `cost_per_month` (numeric) - Estimated monthly cost
      - `tags` (jsonb) - Resource tags
      - `metadata` (jsonb) - Additional resource information
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `resources` table
    - Add policy for users to view their own resources
    - Add policy for users to insert their own resources
    - Add policy for users to update their own resources
    - Add policy for users to delete their own resources

  3. Indexes
    - Add index on user_id for faster lookups
    - Add index on project_id for filtering by project
    - Add index on type for filtering by resource type
    - Add index on status for filtering by status
*/

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  region text NOT NULL DEFAULT 'eastus',
  cost_per_month numeric(10, 2) DEFAULT 0.00,
  tags jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources"
  ON resources
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS resources_user_id_idx ON resources(user_id);
CREATE INDEX IF NOT EXISTS resources_project_id_idx ON resources(project_id);
CREATE INDEX IF NOT EXISTS resources_type_idx ON resources(type);
CREATE INDEX IF NOT EXISTS resources_status_idx ON resources(status);
