/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes on foreign key columns that are missing covering indexes
    - Improves JOIN performance and query optimization
  
  2. Tables Updated
    - `deployments` - Add index on `deployed_by`
    - `multi_modal_uploads` - Add index on `project_id`
    - `project_sessions` - Add index on `user_id`
    - `user_roles` - Add index on `granted_by`
*/

-- Add index for deployments.deployed_by foreign key
CREATE INDEX IF NOT EXISTS idx_deployments_deployed_by 
  ON deployments(deployed_by);

-- Add index for multi_modal_uploads.project_id foreign key
CREATE INDEX IF NOT EXISTS idx_multi_modal_uploads_project_id 
  ON multi_modal_uploads(project_id);

-- Add index for project_sessions.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_project_sessions_user_id 
  ON project_sessions(user_id);

-- Add index for user_roles.granted_by foreign key
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by 
  ON user_roles(granted_by);