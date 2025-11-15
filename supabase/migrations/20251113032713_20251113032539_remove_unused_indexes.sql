/*
  # Remove Unused Indexes

  1. Performance Optimization
    - Remove indexes that are not being used by queries
    - Reduces storage overhead and improves write performance
    - Frees up resources for actively used indexes

  2. Indexes Removed
    - `idx_deployments_deployed_by` - Not used by queries
    - `idx_multi_modal_uploads_project_id` - Not used by queries (duplicate)
    - `idx_project_sessions_user_id` - Not used by queries
    - `idx_user_roles_granted_by` - Not used by queries

  3. Notes
    - These indexes were created earlier but analysis shows they're not utilized
    - If future queries need these indexes, they can be recreated
    - Use IF EXISTS to prevent errors if indexes were already removed
*/

-- Remove unused index on deployments.deployed_by
DROP INDEX IF EXISTS idx_deployments_deployed_by;

-- Remove unused index on multi_modal_uploads.project_id (duplicate of one we're adding)
DROP INDEX IF EXISTS idx_multi_modal_uploads_project_id;

-- Remove unused index on project_sessions.user_id
DROP INDEX IF EXISTS idx_project_sessions_user_id;

-- Remove unused index on user_roles.granted_by
DROP INDEX IF EXISTS idx_user_roles_granted_by;
