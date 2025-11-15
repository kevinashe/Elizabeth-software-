/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes on all foreign key columns that are missing covering indexes
    - Improves JOIN performance, query optimization, and foreign key constraint checks
    - Reduces table scans and speeds up cascading operations

  2. Tables Updated
    - `ai_memories` - Add indexes on project_id and user_id
    - `api_keys` - Add index on user_id
    - `application_metrics` - Add index on project_id
    - `audit_logs` - Add index on user_id
    - `auto_documentation` - Add index on project_id
    - `ci_cd_pipelines` - Add index on project_id
    - `code_analyses` - Add index on project_id
    - `collaboration_sessions` - Add indexes on host_user_id and project_id
    - `commit_history` - Add index on project_id
    - `cost_tracking` - Add index on project_id
    - `deployments` - Add index on project_id
    - `documentation_auto` - Add index on project_id
    - `error_tracking` - Add index on project_id
    - `git_insights` - Add index on project_id
    - `live_cursors` - Add index on project_id
    - `multi_modal_uploads` - Add index on user_id
    - `performance_profiles` - Add index on project_id
    - `project_sessions` - Add index on project_id
    - `resources` - Add index on project_id
    - `shared_selections` - Add indexes on project_id and user_id
    - `test_coverage` - Add index on project_id
    - `test_generations` - Add index on project_id
    - `test_results` - Add index on project_id
    - `user_presence` - Add index on project_id
    - `user_roles` - Add indexes on project_id and user_id

  3. Notes
    - All indexes use IF NOT EXISTS to prevent errors if they already exist
    - Indexes are named consistently: idx_tablename_columnname
    - This significantly improves query performance for JOIN operations and foreign key lookups
*/

-- ai_memories indexes
CREATE INDEX IF NOT EXISTS idx_ai_memories_project_id
  ON ai_memories(project_id);

CREATE INDEX IF NOT EXISTS idx_ai_memories_user_id
  ON ai_memories(user_id);

-- api_keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id
  ON api_keys(user_id);

-- application_metrics indexes
CREATE INDEX IF NOT EXISTS idx_application_metrics_project_id
  ON application_metrics(project_id);

-- audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs(user_id);

-- auto_documentation indexes
CREATE INDEX IF NOT EXISTS idx_auto_documentation_project_id
  ON auto_documentation(project_id);

-- ci_cd_pipelines indexes
CREATE INDEX IF NOT EXISTS idx_ci_cd_pipelines_project_id
  ON ci_cd_pipelines(project_id);

-- code_analyses indexes
CREATE INDEX IF NOT EXISTS idx_code_analyses_project_id
  ON code_analyses(project_id);

-- collaboration_sessions indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_host_user_id
  ON collaboration_sessions(host_user_id);

CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_project_id
  ON collaboration_sessions(project_id);

-- commit_history indexes
CREATE INDEX IF NOT EXISTS idx_commit_history_project_id
  ON commit_history(project_id);

-- cost_tracking indexes
CREATE INDEX IF NOT EXISTS idx_cost_tracking_project_id
  ON cost_tracking(project_id);

-- deployments indexes
CREATE INDEX IF NOT EXISTS idx_deployments_project_id
  ON deployments(project_id);

-- documentation_auto indexes
CREATE INDEX IF NOT EXISTS idx_documentation_auto_project_id
  ON documentation_auto(project_id);

-- error_tracking indexes
CREATE INDEX IF NOT EXISTS idx_error_tracking_project_id
  ON error_tracking(project_id);

-- git_insights indexes
CREATE INDEX IF NOT EXISTS idx_git_insights_project_id
  ON git_insights(project_id);

-- live_cursors indexes
CREATE INDEX IF NOT EXISTS idx_live_cursors_project_id
  ON live_cursors(project_id);

-- multi_modal_uploads indexes
CREATE INDEX IF NOT EXISTS idx_multi_modal_uploads_user_id
  ON multi_modal_uploads(user_id);

-- performance_profiles indexes
CREATE INDEX IF NOT EXISTS idx_performance_profiles_project_id
  ON performance_profiles(project_id);

-- project_sessions indexes
CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id
  ON project_sessions(project_id);

-- resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_project_id
  ON resources(project_id);

-- shared_selections indexes
CREATE INDEX IF NOT EXISTS idx_shared_selections_project_id
  ON shared_selections(project_id);

CREATE INDEX IF NOT EXISTS idx_shared_selections_user_id
  ON shared_selections(user_id);

-- test_coverage indexes
CREATE INDEX IF NOT EXISTS idx_test_coverage_project_id
  ON test_coverage(project_id);

-- test_generations indexes
CREATE INDEX IF NOT EXISTS idx_test_generations_project_id
  ON test_generations(project_id);

-- test_results indexes
CREATE INDEX IF NOT EXISTS idx_test_results_project_id
  ON test_results(project_id);

-- user_presence indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_project_id
  ON user_presence(project_id);

-- user_roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_project_id
  ON user_roles(project_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON user_roles(user_id);
