/*
  # Remove Duplicate Indexes

  1. Issue
    - Multiple identical indexes waste storage and slow down writes
    - Keep only one index from each duplicate set
  
  2. Duplicates Removed
    - performance_profiles: Keep idx_performance_profiles_project_id, drop idx_profiles_project
    - user_settings: Keep user_settings_user_id_key (unique constraint), drop user_settings_user_id_idx
*/

-- performance_profiles: Remove duplicate project_id index
DROP INDEX IF EXISTS idx_profiles_project;

-- user_settings: Remove duplicate user_id index (keep the unique constraint)
DROP INDEX IF EXISTS user_settings_user_id_idx;