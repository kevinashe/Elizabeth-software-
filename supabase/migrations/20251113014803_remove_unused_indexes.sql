/*
  # Remove Unused Indexes

  1. Performance Improvements
    - Remove indexes that are not being used
    - Reduces storage overhead and write performance impact
    - Can be re-added later if query patterns change
  
  2. Note
    - These indexes were identified as unused by Supabase advisor
    - Monitor query performance after removal
*/

-- Chat and requirements indexes
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_requirements_user_id;
DROP INDEX IF EXISTS idx_requirements_created_at;
DROP INDEX IF EXISTS idx_requirements_tags;

-- User settings and team
DROP INDEX IF EXISTS idx_user_settings_user_id;
DROP INDEX IF EXISTS idx_team_invitations_email;

-- Projects
DROP INDEX IF EXISTS idx_projects_status;

-- Codebase and knowledge base
DROP INDEX IF EXISTS idx_codebase_project;
DROP INDEX IF EXISTS idx_codebase_file_type;
DROP INDEX IF EXISTS idx_codebase_embedding;
DROP INDEX IF EXISTS idx_knowledge_category;
DROP INDEX IF EXISTS idx_knowledge_tags;
DROP INDEX IF EXISTS idx_knowledge_embedding;

-- Search cache
DROP INDEX IF EXISTS idx_search_cache_query;
DROP INDEX IF EXISTS idx_search_cache_expires;
DROP INDEX IF EXISTS idx_search_cache_embedding;

-- Resources
DROP INDEX IF EXISTS resources_project_id_idx;
DROP INDEX IF EXISTS resources_type_idx;
DROP INDEX IF EXISTS resources_status_idx;

-- AI memories and analysis
DROP INDEX IF EXISTS idx_ai_memories_user_id;
DROP INDEX IF EXISTS idx_ai_memories_project_id;
DROP INDEX IF EXISTS idx_code_analyses_project_id;
DROP INDEX IF EXISTS idx_code_analyses_status;

-- Project sessions and testing
DROP INDEX IF EXISTS idx_project_sessions_project_id;
DROP INDEX IF EXISTS idx_test_generations_project_id;
DROP INDEX IF EXISTS idx_performance_profiles_project_id;

-- Documentation and git
DROP INDEX IF EXISTS idx_documentation_auto_project_id;
DROP INDEX IF EXISTS idx_git_insights_project_id;

-- Multi-modal uploads
DROP INDEX IF EXISTS idx_multi_modal_uploads_user_id;

-- Conversation memory
DROP INDEX IF EXISTS idx_conversation_memory_created;
DROP INDEX IF EXISTS idx_conversation_memory_embedding;

-- User presence
DROP INDEX IF EXISTS idx_presence_user;
DROP INDEX IF EXISTS idx_presence_project;
DROP INDEX IF EXISTS idx_presence_status;
DROP INDEX IF EXISTS idx_presence_last_seen;

-- Collaboration
DROP INDEX IF EXISTS idx_collab_sessions_project;
DROP INDEX IF EXISTS idx_collab_sessions_host;
DROP INDEX IF EXISTS idx_collab_sessions_active;
DROP INDEX IF EXISTS idx_live_cursors_project_file;
DROP INDEX IF EXISTS idx_live_cursors_user;
DROP INDEX IF EXISTS idx_shared_selections_project_file;
DROP INDEX IF EXISTS idx_shared_selections_user;

-- Security
DROP INDEX IF EXISTS idx_api_keys_user;
DROP INDEX IF EXISTS idx_api_keys_prefix;
DROP INDEX IF EXISTS idx_api_keys_expires;
DROP INDEX IF EXISTS idx_mfa_settings_user;

-- Audit logs
DROP INDEX IF EXISTS idx_audit_logs_user;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_created;
DROP INDEX IF EXISTS idx_audit_logs_resource;

-- User roles
DROP INDEX IF EXISTS idx_user_roles_user;
DROP INDEX IF EXISTS idx_user_roles_project;
DROP INDEX IF EXISTS idx_user_roles_role;

-- Deployments
DROP INDEX IF EXISTS idx_deployments_project;
DROP INDEX IF EXISTS idx_deployments_status;
DROP INDEX IF EXISTS idx_deployments_env;
DROP INDEX IF EXISTS idx_deployments_started;

-- Pipelines
DROP INDEX IF EXISTS idx_pipelines_project;
DROP INDEX IF EXISTS idx_pipelines_status;

-- Metrics and errors
DROP INDEX IF EXISTS idx_metrics_project;
DROP INDEX IF EXISTS idx_metrics_type;
DROP INDEX IF EXISTS idx_metrics_timestamp;
DROP INDEX IF EXISTS idx_errors_project;
DROP INDEX IF EXISTS idx_errors_severity;
DROP INDEX IF EXISTS idx_errors_resolved;
DROP INDEX IF EXISTS idx_errors_last_seen;

-- Performance profiles
DROP INDEX IF EXISTS idx_profiles_project;
DROP INDEX IF EXISTS idx_profiles_type;
DROP INDEX IF EXISTS idx_profiles_created;

-- Cost tracking
DROP INDEX IF EXISTS idx_costs_project;
DROP INDEX IF EXISTS idx_costs_period;
DROP INDEX IF EXISTS idx_costs_service;

-- Container registry
DROP INDEX IF EXISTS idx_containers_project;
DROP INDEX IF EXISTS idx_containers_image;
DROP INDEX IF EXISTS idx_containers_pushed;

-- Documentation
DROP INDEX IF EXISTS idx_docs_project;
DROP INDEX IF EXISTS idx_docs_type;
DROP INDEX IF EXISTS idx_docs_updated;

-- Git and commits
DROP INDEX IF EXISTS idx_git_project;
DROP INDEX IF EXISTS idx_git_provider;
DROP INDEX IF EXISTS idx_commits_project;
DROP INDEX IF EXISTS idx_commits_hash;
DROP INDEX IF EXISTS idx_commits_timestamp;

-- Dependencies
DROP INDEX IF EXISTS idx_deps_project;
DROP INDEX IF EXISTS idx_deps_package;
DROP INDEX IF EXISTS idx_deps_outdated;
DROP INDEX IF EXISTS idx_deps_vulnerable;

-- Test coverage and results
DROP INDEX IF EXISTS idx_coverage_project;
DROP INDEX IF EXISTS idx_coverage_file;
DROP INDEX IF EXISTS idx_coverage_date;
DROP INDEX IF EXISTS idx_test_results_project;
DROP INDEX IF EXISTS idx_test_results_status;
DROP INDEX IF EXISTS idx_test_results_run;