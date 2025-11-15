import { useState, useEffect } from 'react';
import { Brain, Database, Search, Code, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from '../utils/storage';

export default function Intelligence() {
  const [stats, setStats] = useState({
    conversationMemory: 0,
    codebaseFiles: 0,
    knowledgeItems: 0,
    searchCache: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntelligenceStats();
  }, []);

  const loadIntelligenceStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [conversations, codebase, knowledge, cache] = await Promise.all([
        supabase.from('conversation_memory').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('codebase_index').select('id', { count: 'exact', head: true }),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }),
        supabase.from('web_search_cache').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        conversationMemory: conversations.count || 0,
        codebaseFiles: codebase.count || 0,
        knowledgeItems: knowledge.count || 0,
        searchCache: cache.count || 0,
      });
    } catch (error) {
      console.error('Error loading intelligence stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Database,
      title: 'Long-term Memory',
      description: 'AI remembers all conversations with vector embeddings for semantic recall',
      stat: stats.conversationMemory,
      color: '#3b82f6',
    },
    {
      icon: Code,
      title: 'Codebase Analysis',
      description: 'Deep understanding of your project structure, functions, and dependencies',
      stat: stats.codebaseFiles,
      color: '#10b981',
    },
    {
      icon: Search,
      title: 'Web Search',
      description: 'Real-time access to latest documentation and best practices',
      stat: stats.searchCache,
      color: '#f59e0b',
    },
    {
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Curated patterns, solutions, and learned expertise',
      stat: stats.knowledgeItems,
      color: '#8b5cf6',
    },
    {
      icon: Brain,
      title: 'Semantic Search',
      description: 'Find code and conversations by meaning, not just keywords',
      stat: 'Active',
      color: '#ec4899',
    },
    {
      icon: TrendingUp,
      title: 'Context Management',
      description: 'Smart context window for better reasoning and responses',
      stat: 'Active',
      color: '#06b6d4',
    },
  ];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Brain size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading intelligence systems...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <Brain size={32} color="#3b82f6" />
          <div>
            <h2 style={styles.title}>AI Intelligence Systems</h2>
            <p style={styles.subtitle}>Enhanced capabilities for smarter assistance</p>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {features.map((feature, index) => (
          <div key={index} style={styles.card}>
            <div style={{ ...styles.iconContainer, background: `${feature.color}15` }}>
              <feature.icon size={24} color={feature.color} />
            </div>
            <h3 style={styles.cardTitle}>{feature.title}</h3>
            <p style={styles.cardDescription}>{feature.description}</p>
            <div style={styles.statBadge}>
              {typeof feature.stat === 'number'
                ? `${feature.stat.toLocaleString()} items`
                : feature.stat}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.infoSection}>
        <h3 style={styles.infoTitle}>How It Works</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <h4 style={styles.infoCardTitle}>1. Memory Storage</h4>
            <p style={styles.infoCardText}>
              Every conversation is stored with semantic embeddings, allowing the AI to recall
              relevant context from past discussions.
            </p>
          </div>
          <div style={styles.infoCard}>
            <h4 style={styles.infoCardTitle}>2. Code Understanding</h4>
            <p style={styles.infoCardText}>
              Your codebase is analyzed and indexed, tracking functions, classes, imports,
              and dependencies for intelligent suggestions.
            </p>
          </div>
          <div style={styles.infoCard}>
            <h4 style={styles.infoCardTitle}>3. Knowledge Integration</h4>
            <p style={styles.infoCardText}>
              Web search results and learned patterns are stored in a knowledge base,
              continuously improving the AI's expertise.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
  },
  header: {
    marginBottom: '32px',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  statBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: '#f3f4f6',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  },
  infoSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    padding: '32px',
    color: 'white',
  },
  infoTitle: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 24px 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  infoCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
  },
  infoCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  infoCardText: {
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0,
    opacity: 0.9,
  },
};
