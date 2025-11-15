/*
  # AI Memory & Intelligence System

  1. New Tables
    - `conversation_memory`
      - Stores conversation history with embeddings for semantic search
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (text) - groups related conversations
      - `message_role` (text) - user/assistant/system
      - `message_content` (text) - the actual message
      - `embedding` (vector) - semantic embedding for similarity search
      - `tokens_used` (int) - track token usage
      - `metadata` (jsonb) - additional context
      - `created_at` (timestamp)
    
    - `codebase_index`
      - Indexes and analyzes codebase files
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `file_path` (text) - relative file path
      - `file_type` (text) - extension/language
      - `content_hash` (text) - detect changes
      - `summary` (text) - AI-generated summary
      - `embedding` (vector) - semantic embedding
      - `symbols` (jsonb) - functions, classes, exports
      - `dependencies` (jsonb) - imports and dependencies
      - `last_indexed` (timestamp)
    
    - `knowledge_base`
      - Stores learned patterns and best practices
      - `id` (uuid, primary key)
      - `category` (text) - framework, pattern, solution
      - `title` (text)
      - `content` (text)
      - `embedding` (vector)
      - `source_url` (text) - if from web search
      - `relevance_score` (float)
      - `tags` (text[])
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `web_search_cache`
      - Cache web search results
      - `id` (uuid, primary key)
      - `query` (text)
      - `results` (jsonb)
      - `embedding` (vector)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own conversation memory
    - Project members can access codebase index
    - Knowledge base is readable by all authenticated users
*/

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversation Memory Table
CREATE TABLE IF NOT EXISTS conversation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  message_role text NOT NULL CHECK (message_role IN ('user', 'assistant', 'system')),
  message_content text NOT NULL,
  embedding vector(1536),
  tokens_used int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_session ON conversation_memory(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_created ON conversation_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_embedding ON conversation_memory USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation memory"
  ON conversation_memory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation memory"
  ON conversation_memory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation memory"
  ON conversation_memory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation memory"
  ON conversation_memory FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Codebase Index Table
CREATE TABLE IF NOT EXISTS codebase_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  content_hash text NOT NULL,
  summary text,
  embedding vector(1536),
  symbols jsonb DEFAULT '{}'::jsonb,
  dependencies jsonb DEFAULT '[]'::jsonb,
  last_indexed timestamptz DEFAULT now(),
  UNIQUE(project_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_codebase_project ON codebase_index(project_id);
CREATE INDEX IF NOT EXISTS idx_codebase_file_type ON codebase_index(file_type);
CREATE INDEX IF NOT EXISTS idx_codebase_embedding ON codebase_index USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE codebase_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view codebase index"
  ON codebase_index FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = codebase_index.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage codebase index"
  ON codebase_index FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = codebase_index.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = codebase_index.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Knowledge Base Table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  source_url text,
  relevance_score float DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read knowledge base"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage knowledge base"
  ON knowledge_base FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Web Search Cache Table
CREATE TABLE IF NOT EXISTS web_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  results jsonb NOT NULL,
  embedding vector(1536),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_cache_query ON web_search_cache(query);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON web_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_embedding ON web_search_cache USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE web_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read search cache"
  ON web_search_cache FOR SELECT
  TO authenticated
  USING (expires_at > now());

CREATE POLICY "System can manage search cache"
  ON web_search_cache FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
