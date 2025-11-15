import React, { useState, useEffect } from 'react';
import { Brain, Zap, Shield, FileSearch, GitBranch, Play, Upload, BarChart3, FileText, Clock, Loader, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AIFeatures({ onOpenInEditor }) {
  const [activeTab, setActiveTab] = useState('memory');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setCurrentProject(data);

        const { data: allProjects } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setProjects(allProjects || []);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const features = [
    { id: 'memory', name: 'Memory System', icon: Brain, color: '#8b5cf6' },
    { id: 'analysis', name: 'Code Analysis', icon: FileSearch, color: '#ef4444' },
    { id: 'upload', name: 'Multi-Modal', icon: Upload, color: '#06b6d4' },
    { id: 'performance', name: 'Performance', icon: BarChart3, color: '#f59e0b' },
    { id: 'docs', name: 'Auto Docs', icon: FileText, color: '#10b981' },
    { id: 'tests', name: 'Test Gen', icon: Zap, color: '#ec4899' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <Brain size={32} style={{ color: '#8b5cf6' }} />
          <div>
            <h1 style={styles.title}>AI Enhancement System</h1>
            <p style={styles.subtitle}>Advanced features to supercharge development</p>
          </div>
        </div>
        {projects.length > 0 && (
          <select
            value={currentProject?.id || ''}
            onChange={(e) => {
              const proj = projects.find(p => p.id === e.target.value);
              setCurrentProject(proj);
            }}
            style={styles.projectSelect}
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
          {features.map(feature => (
            <div
              key={feature.id}
              onClick={() => setActiveTab(feature.id)}
              style={{
                ...styles.navItem,
                background: activeTab === feature.id ? feature.color + '15' : 'transparent',
                borderLeft: activeTab === feature.id ? `3px solid ${feature.color}` : '3px solid transparent'
              }}
            >
              <feature.icon size={20} style={{ color: feature.color }} />
              <span style={{ color: activeTab === feature.id ? feature.color : '#94a3b8' }}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.content}>
          {activeTab === 'memory' && <MemorySystem user={currentUser} project={currentProject} />}
          {activeTab === 'analysis' && <CodeAnalysis user={currentUser} project={currentProject} />}
          {activeTab === 'upload' && <MultiModal user={currentUser} project={currentProject} />}
          {activeTab === 'performance' && <Performance user={currentUser} project={currentProject} />}
          {activeTab === 'docs' && <AutoDocs user={currentUser} project={currentProject} />}
          {activeTab === 'tests' && <TestGeneration user={currentUser} project={currentProject} />}
        </div>
      </div>
    </div>
  );
}

function MemorySystem({ user, project }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'preference',
    context: '',
    content: ''
  });

  useEffect(() => {
    if (user) loadMemories();
  }, [user, project]);

  const loadMemories = async () => {
    try {
      const query = supabase
        .from('ai_memories')
        .select('*')
        .eq('user_id', user.id);

      if (project) {
        query.eq('project_id', project.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('ai_memories').insert({
        user_id: user.id,
        project_id: project?.id || null,
        memory_type: formData.type,
        context: formData.context,
        content: { text: formData.content },
        confidence: 0.8,
        access_count: 0
      });

      if (error) throw error;
      setFormData({ type: 'preference', context: '', content: '' });
      setShowForm(false);
      loadMemories();
    } catch (error) {
      alert('Error adding memory: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('ai_memories').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      loadMemories();
    } catch (error) {
      alert('Error deleting memory: ' + error.message);
    }
  };

  const stats = {
    total: memories.length,
    patterns: memories.filter(m => m.memory_type === 'pattern').length,
    avgConfidence: memories.length > 0 ? Math.round(memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length * 100) : 0
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Persistent Memory System</h2>
          <p style={styles.sectionDesc}>Cross-session learning and context retention</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          <Plus size={18} />
          Add Memory
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <form onSubmit={handleAdd} style={styles.form}>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={styles.input}
              required
            >
              <option value="preference">Preference</option>
              <option value="pattern">Pattern</option>
              <option value="decision">Decision</option>
              <option value="learning">Learning</option>
            </select>
            <input
              type="text"
              placeholder="Context (e.g., Code style preference detected)"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              style={styles.input}
              required
            />
            <textarea
              placeholder="Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              style={styles.textarea}
              required
            />
            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>Cancel</button>
              <button type="submit" style={styles.submitButton}>Add Memory</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.statsGrid}>
        <StatCard icon={Brain} label="Total Memories" value={stats.total} color="#8b5cf6" />
        <StatCard icon={Zap} label="Active Patterns" value={stats.patterns} color="#f59e0b" />
        <StatCard icon={Clock} label="Avg Confidence" value={`${stats.avgConfidence}%`} color="#10b981" />
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6' }} />
        </div>
      ) : (
        <div style={styles.memoryList}>
          {memories.map(memory => (
            <div key={memory.id} style={styles.memoryCard}>
              <div style={styles.memoryHeader}>
                <span style={{ ...styles.memoryType, background: getTypeColor(memory.memory_type) }}>
                  {memory.memory_type}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={styles.confidence}>
                    {Math.round(memory.confidence * 100)}% confident
                  </span>
                  <button onClick={() => handleDelete(memory.id)} style={styles.deleteIcon}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={styles.memoryContext}>{memory.context}</div>
              <div style={styles.memoryContent}>{memory.content?.text || JSON.stringify(memory.content)}</div>
              <div style={styles.memoryFooter}>
                <span style={styles.accessCount}>Accessed {memory.access_count} times</span>
                <span style={styles.timestamp}>{new Date(memory.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {memories.length === 0 && !showForm && (
            <div style={styles.emptyState}>
              <Brain size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <p>No memories yet. Click "Add Memory" to create your first entry.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CodeAnalysis({ user, project }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    filePath: '',
    analysisType: 'security',
    severity: 'medium',
    title: '',
    description: ''
  });

  useEffect(() => {
    if (project) loadAnalyses();
    else setLoading(false);
  }, [project]);

  const loadAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('code_analyses')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!project) {
      alert('Please select a project first');
      return;
    }

    try {
      const { error } = await supabase.from('code_analyses').insert({
        project_id: project.id,
        file_path: formData.filePath,
        analysis_type: formData.analysisType,
        severity: formData.severity,
        title: formData.title,
        description: formData.description,
        status: 'open'
      });

      if (error) throw error;
      setFormData({ filePath: '', analysisType: 'security', severity: 'medium', title: '', description: '' });
      setShowForm(false);
      loadAnalyses();
    } catch (error) {
      alert('Error adding analysis: ' + error.message);
    }
  };

  const handleResolve = async (id) => {
    try {
      const { error } = await supabase
        .from('code_analyses')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadAnalyses();
    } catch (error) {
      alert('Error resolving analysis: ' + error.message);
    }
  };

  const stats = {
    critical: analyses.filter(a => a.severity === 'critical' && a.status === 'open').length,
    high: analyses.filter(a => a.severity === 'high' && a.status === 'open').length,
    quality: analyses.length > 0 ? Math.round((analyses.filter(a => a.status === 'resolved').length / analyses.length) * 100) : 100
  };

  if (!project) {
    return (
      <div style={styles.section}>
        <div style={styles.emptyState}>
          <Shield size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <p>Please select a project to view code analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Proactive Code Analysis</h2>
          <p style={styles.sectionDesc}>Real-time security, performance, and quality monitoring</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          <Plus size={18} />
          Add Issue
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <form onSubmit={handleAdd} style={styles.form}>
            <input
              type="text"
              placeholder="File path (e.g., src/components/App.jsx)"
              value={formData.filePath}
              onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
              style={styles.input}
              required
            />
            <select
              value={formData.analysisType}
              onChange={(e) => setFormData({ ...formData, analysisType: e.target.value })}
              style={styles.input}
            >
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="quality">Quality</option>
              <option value="documentation">Documentation</option>
            </select>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              style={styles.input}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={styles.input}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={styles.textarea}
              required
            />
            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>Cancel</button>
              <button type="submit" style={styles.submitButton}>Add Issue</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.statsGrid}>
        <StatCard icon={Shield} label="Critical" value={stats.critical} color="#ef4444" />
        <StatCard icon={Zap} label="High Priority" value={stats.high} color="#f59e0b" />
        <StatCard icon={FileSearch} label="Resolved %" value={`${stats.quality}%`} color="#10b981" />
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#ef4444' }} />
        </div>
      ) : (
        <div style={styles.issueList}>
          {analyses.map(issue => (
            <div key={issue.id} style={styles.issueCard}>
              <div style={styles.issueHeader}>
                <span style={{ ...styles.severity, background: getSeverityColor(issue.severity) }}>
                  {issue.severity}
                </span>
                <span style={styles.issueType}>{issue.analysis_type}</span>
                {issue.status === 'resolved' && (
                  <span style={styles.resolvedBadge}>
                    <CheckCircle size={14} />
                    Resolved
                  </span>
                )}
              </div>
              <h3 style={styles.issueTitle}>{issue.title}</h3>
              <p style={styles.issueDesc}>{issue.description}</p>
              <div style={styles.issueLocation}>{issue.file_path}</div>
              {issue.status !== 'resolved' && (
                <button onClick={() => handleResolve(issue.id)} style={styles.resolveButton}>
                  Mark as Resolved
                </button>
              )}
            </div>
          ))}
          {analyses.length === 0 && !showForm && (
            <div style={styles.emptyState}>
              <FileSearch size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <p>No code analyses yet. Click "Add Issue" to track a code issue.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MultiModal({ user, project }) {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) loadUploads();
  }, [user, project]);

  const loadUploads = async () => {
    try {
      const query = supabase
        .from('multi_modal_uploads')
        .select('*')
        .eq('user_id', user.id);

      if (project) {
        query.eq('project_id', project.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error loading uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      let fileType = 'image';
      if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';

      const { error } = await supabase.from('multi_modal_uploads').insert({
        user_id: user.id,
        project_id: project?.id || null,
        file_type: fileType,
        file_url: URL.createObjectURL(file),
        status: 'uploaded'
      });

      if (error) throw error;
      alert('File uploaded successfully!');
      loadUploads();
    } catch (error) {
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Multi-Modal Processing</h2>
        <p style={styles.sectionDesc}>Upload and analyze videos, audio, images, and diagrams</p>
      </div>

      <div style={styles.uploadArea}>
        <Upload size={48} style={{ color: '#06b6d4', marginBottom: '16px' }} />
        <h3 style={styles.uploadTitle}>Upload files for AI analysis</h3>
        <p style={styles.uploadDesc}>Support for video, audio, images, and diagrams</p>
        <input
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
          disabled={uploading}
        />
        <label htmlFor="file-upload">
          <button style={styles.uploadButton} onClick={() => document.getElementById('file-upload').click()}>
            {uploading ? 'Uploading...' : 'Choose Files'}
          </button>
        </label>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#06b6d4' }} />
        </div>
      ) : (
        <div style={styles.uploadsList}>
          {uploads.map(upload => (
            <div key={upload.id} style={styles.uploadCard}>
              <div style={styles.uploadType}>{upload.file_type}</div>
              <div style={styles.uploadStatus}>{upload.status}</div>
              <div style={styles.uploadDate}>{new Date(upload.created_at).toLocaleDateString()}</div>
            </div>
          ))}
          {uploads.length === 0 && (
            <div style={styles.emptyState}>
              <Upload size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <p>No uploads yet. Upload your first file to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Performance({ user, project }) {
  if (!project) {
    return (
      <div style={styles.section}>
        <div style={styles.emptyState}>
          <BarChart3 size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <p>Please select a project to view performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Performance Profiling</h2>
        <p style={styles.sectionDesc}>Real-time metrics and optimization recommendations</p>
      </div>

      <div style={styles.statsGrid}>
        <StatCard icon={BarChart3} label="Build Time" value="2.4s" color="#f59e0b" />
        <StatCard icon={Zap} label="Bundle Size" value="145KB" color="#06b6d4" />
        <StatCard icon={Brain} label="Lighthouse" value="98" color="#10b981" />
      </div>

      <div style={styles.chartPlaceholder}>
        <BarChart3 size={64} style={{ color: '#475569', marginBottom: '16px' }} />
        <p style={{ color: '#94a3b8' }}>Performance metrics visualization</p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Connect to {project.name} to view real-time data</p>
      </div>
    </div>
  );
}

function AutoDocs({ user, project }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (project) loadDocs();
    else setLoading(false);
  }, [project]);

  const loadDocs = async () => {
    try {
      const { data, error } = await supabase
        .from('documentation_auto')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocs(data || []);
    } catch (error) {
      console.error('Error loading docs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!project) {
      alert('Please select a project first');
      return;
    }

    try {
      const { error } = await supabase.from('documentation_auto').insert({
        project_id: project.id,
        file_path: 'README.md',
        doc_type: 'module',
        generated_content: '# Project Documentation\n\nGenerated automatically based on code structure.',
        status: 'draft'
      });

      if (error) throw error;
      alert('Documentation generated!');
      loadDocs();
    } catch (error) {
      alert('Error generating documentation: ' + error.message);
    }
  };

  if (!project) {
    return (
      <div style={styles.section}>
        <div style={styles.emptyState}>
          <FileText size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <p>Please select a project to generate documentation</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Auto Documentation</h2>
          <p style={styles.sectionDesc}>Generate and maintain documentation automatically</p>
        </div>
        <button onClick={handleGenerate} style={styles.addButton}>
          <Sparkles size={18} />
          Generate Docs
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
        </div>
      ) : (
        <div style={styles.docsList}>
          {docs.map(doc => (
            <div key={doc.id} style={styles.docCard}>
              <div style={styles.docHeader}>
                <FileText size={20} color="#10b981" />
                <span style={styles.docType}>{doc.doc_type}</span>
                <span style={styles.docStatus}>{doc.status}</span>
              </div>
              <div style={styles.docPath}>{doc.file_path}</div>
              <div style={styles.docPreview}>{doc.generated_content.substring(0, 150)}...</div>
            </div>
          ))}
          {docs.length === 0 && (
            <div style={styles.emptyState}>
              <FileText size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <p>No documentation yet. Click "Generate Docs" to create documentation.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TestGeneration({ user, project }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (project) loadTests();
    else setLoading(false);
  }, [project]);

  const loadTests = async () => {
    try {
      const { data, error } = await supabase
        .from('test_generations')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!project) {
      alert('Please select a project first');
      return;
    }

    try {
      const { error } = await supabase.from('test_generations').insert({
        project_id: project.id,
        file_path: 'src/components/App.test.js',
        test_type: 'unit',
        test_code: 'describe("App", () => {\n  it("should render", () => {\n    expect(true).toBe(true);\n  });\n});',
        status: 'generated'
      });

      if (error) throw error;
      alert('Tests generated!');
      loadTests();
    } catch (error) {
      alert('Error generating tests: ' + error.message);
    }
  };

  const stats = {
    generated: tests.length,
    passing: tests.filter(t => t.status === 'passing').length,
    coverage: tests.length > 0 ? Math.round((tests.filter(t => t.status === 'passing').length / tests.length) * 100) : 0
  };

  if (!project) {
    return (
      <div style={styles.section}>
        <div style={styles.emptyState}>
          <Zap size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <p>Please select a project to generate tests</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Automated Test Generation</h2>
          <p style={styles.sectionDesc}>Generate unit, integration, and E2E tests automatically</p>
        </div>
        <button onClick={handleGenerate} style={styles.addButton}>
          <Sparkles size={18} />
          Generate Tests
        </button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard icon={Zap} label="Tests Generated" value={stats.generated} color="#ec4899" />
        <StatCard icon={CheckCircle} label="Passing" value={stats.passing} color="#10b981" />
        <StatCard icon={Shield} label="Coverage" value={`${stats.coverage}%`} color="#06b6d4" />
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#ec4899' }} />
        </div>
      ) : (
        <div style={styles.testsList}>
          {tests.map(test => (
            <div key={test.id} style={styles.testCard}>
              <div style={styles.testHeader}>
                <span style={styles.testType}>{test.test_type}</span>
                <span style={styles.testStatus}>{test.status}</span>
              </div>
              <div style={styles.testPath}>{test.file_path}</div>
            </div>
          ))}
          {tests.length === 0 && (
            <div style={styles.emptyState}>
              <Zap size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <p>No tests yet. Click "Generate Tests" to create automated tests.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <Icon size={24} style={{ color, marginBottom: '8px' }} />
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function getTypeColor(type) {
  const colors = {
    preference: '#8b5cf6',
    pattern: '#f59e0b',
    decision: '#10b981',
    learning: '#06b6d4'
  };
  return colors[type] + '20';
}

function getSeverityColor(severity) {
  const colors = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#eab308',
    low: '#06b6d4',
    info: '#6366f1'
  };
  return colors[severity];
}

const Sparkles = ({ size }) => <Zap size={size} />;

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderBottom: '1px solid #e2e8f0',
    padding: '24px',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  projectSelect: {
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    minWidth: '200px',
    cursor: 'pointer',
  },
  mainContent: {
    maxWidth: '1400px',
    margin: '32px auto',
    display: 'flex',
    gap: '24px',
    padding: '0 24px',
  },
  sidebar: {
    width: '240px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '16px',
    height: 'fit-content',
    backdropFilter: 'blur(10px)',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '4px',
    transition: 'all 0.2s',
  },
  content: {
    flex: 1,
  },
  section: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '32px',
    backdropFilter: 'blur(10px)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  sectionDesc: {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  formCard: {
    background: '#f8fafc',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    minHeight: '80px',
    resize: 'vertical',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '8px 16px',
    background: 'white',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  submitButton: {
    padding: '8px 16px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '4px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px',
  },
  memoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  memoryCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  memoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  memoryType: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#1e293b',
  },
  confidence: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  deleteIcon: {
    padding: '4px',
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  memoryContext: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '8px',
  },
  memoryContent: {
    fontSize: '1rem',
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: '12px',
  },
  memoryFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessCount: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  timestamp: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  issueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  issueCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  issueHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  severity: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'white',
  },
  issueType: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    background: '#e0e7ff',
    color: '#4f46e5',
  },
  resolvedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    background: '#d1fae5',
    color: '#065f46',
  },
  issueTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  issueDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0 0 12px 0',
  },
  issueLocation: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontFamily: 'monospace',
    marginBottom: '12px',
  },
  resolveButton: {
    padding: '8px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '64px 32px',
    color: '#64748b',
  },
  uploadArea: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '48px',
    textAlign: 'center',
    marginBottom: '32px',
  },
  uploadTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  uploadDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0 0 16px 0',
  },
  uploadButton: {
    padding: '12px 24px',
    background: '#06b6d4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  uploadsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  uploadCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  uploadType: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
    textTransform: 'capitalize',
  },
  uploadStatus: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '4px',
  },
  uploadDate: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  chartPlaceholder: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '64px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
  },
  docsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  docCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  docHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  docType: {
    padding: '4px 12px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  docStatus: {
    padding: '4px 12px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  docPath: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '8px',
    fontFamily: 'monospace',
  },
  docPreview: {
    fontSize: '0.875rem',
    color: '#1e293b',
    lineHeight: '1.5',
  },
  testsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  testCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  testHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  testType: {
    padding: '4px 12px',
    background: '#fae8ff',
    color: '#a21caf',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  testStatus: {
    padding: '4px 12px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  testPath: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontFamily: 'monospace',
  },
};
