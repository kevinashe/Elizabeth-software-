import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Edit2, Save, X, Clock, FolderGit2, Copy, FileText, Search, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Projects({ user, onOpenInEditor }) {
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: 'web-app',
    repository_url: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      if (data && data.length > 0) {
        const stats = {};
        for (const project of data) {
          const { data: files } = await supabase
            .from('project_files')
            .select('id, updated_at')
            .eq('project_id', project.id);

          stats[project.id] = {
            fileCount: files ? files.length : 0,
            lastModified: files && files.length > 0
              ? new Date(Math.max(...files.map(f => new Date(f.updated_at))))
              : new Date(project.created_at)
          };
        }
        setProjectStats(stats);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        alert('Please sign in to create projects');
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            description: formData.description,
            template: formData.template,
            repository_url: formData.repository_url
          })
          .eq('id', editingId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('projects')
          .insert({
            user_id: currentUser.id,
            name: formData.name,
            description: formData.description,
            template: formData.template,
            repository_url: formData.repository_url,
            status: 'active'
          });

        if (error) throw error;
      }

      setFormData({ name: '', description: '', template: 'web-app', repository_url: '' });
      setShowForm(false);
      loadProjects();
    } catch (error) {
      alert('Error saving project: ' + error.message);
    }
  };

  const handleEdit = (project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
      template: project.template,
      repository_url: project.repository_url || ''
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', template: 'web-app', repository_url: '' });
    setShowForm(false);
  };

  const handleDuplicate = async (project) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        alert('Please sign in to duplicate projects');
        return;
      }

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: currentUser.id,
          name: `${project.name} (Copy)`,
          description: project.description,
          template: project.template,
          repository_url: project.repository_url,
          status: project.status
        })
        .select()
        .single();

      if (projectError) throw projectError;

      const { data: files } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', project.id);

      if (files && files.length > 0) {
        const newFiles = files.map(file => ({
          project_id: newProject.id,
          user_id: currentUser.id,
          file_name: file.file_name,
          file_path: file.file_path,
          content: file.content,
          language: file.language
        }));

        const { error: filesError } = await supabase
          .from('project_files')
          .insert(newFiles);

        if (filesError) throw filesError;
      }

      loadProjects();
    } catch (error) {
      alert('Error duplicating project: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    const project = projects.find(p => p.id === id);
    const stats = projectStats[id] || {};
    const fileCount = stats.fileCount || 0;

    const message = fileCount > 0
      ? `Are you sure you want to delete "${project?.name}"? This will also delete ${fileCount} file(s).`
      : `Are you sure you want to delete "${project?.name}"?`;

    if (!confirm(message)) return;

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) return;

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      loadProjects();
    } catch (error) {
      alert('Error deleting project: ' + error.message);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading projects...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Projects</h2>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          <Plus size={20} />
          New Project
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>{editingId ? 'Edit Project' : 'Create New Project'}</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={styles.textarea}
            />
            <select
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              style={styles.input}
            >
              <option value="web-app">Web Application</option>
              <option value="api">API Service</option>
              <option value="mobile">Mobile App</option>
              <option value="infrastructure">Infrastructure</option>
            </select>
            <input
              type="url"
              placeholder="Repository URL (optional)"
              value={formData.repository_url}
              onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
              style={styles.input}
            />
            <div style={styles.formActions}>
              <button type="button" onClick={handleCancelEdit} style={styles.cancelButton}>
                <X size={18} />
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                <Save size={18} />
                {editingId ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <Filter size={16} />
            <select
              value={filterTemplate}
              onChange={(e) => setFilterTemplate(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Templates</option>
              <option value="web-app">Web Application</option>
              <option value="api">API Service</option>
              <option value="mobile">Mobile App</option>
              <option value="infrastructure">Infrastructure</option>
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div style={styles.grid}>
        {projects
          .filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (project.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTemplate = filterTemplate === 'all' || project.template === filterTemplate;
            const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
            return matchesSearch && matchesTemplate && matchesStatus;
          })
          .map((project) => (
          <div key={project.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitleContainer}>
                <FolderGit2 size={24} style={{ color: '#2563eb' }} />
                <h3 style={styles.cardTitle}>{project.name}</h3>
              </div>
              <div style={styles.cardActions}>
                <button onClick={() => handleDuplicate(project)} style={styles.duplicateButton} title="Duplicate project">
                  <Copy size={16} />
                </button>
                <button onClick={() => handleEdit(project)} style={styles.editButton} title="Edit project">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(project.id)} style={styles.deleteButton} title="Delete project">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p style={styles.cardDescription}>{project.description || 'No description provided'}</p>
            <div style={styles.cardMeta}>
              <span style={styles.badge}>{project.template.replace('-', ' ')}</span>
              <span style={styles.status}>{project.status}</span>
              {projectStats[project.id] && (
                <span style={styles.fileCount}>
                  <FileText size={14} />
                  {projectStats[project.id].fileCount} files
                </span>
              )}
            </div>
            <div style={styles.cardFooter}>
              <button
                onClick={() => onOpenInEditor && onOpenInEditor(project)}
                style={styles.openEditorButton}
                title="Open in Code Editor"
              >
                <Edit2 size={14} />
                Open in Editor
              </button>
              {project.repository_url && (
                <a href={project.repository_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  <ExternalLink size={14} />
                  Repository
                </a>
              )}
              <span style={styles.timestamp}>
                <Clock size={14} />
                {projectStats[project.id]?.lastModified
                  ? `Modified ${projectStats[project.id].lastModified.toLocaleDateString()}`
                  : `Created ${new Date(project.created_at).toLocaleDateString()}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !showForm && (
        <div style={styles.empty}>
          <p>No projects yet. Create your first project to get started.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
  },
  loading: {
    padding: '48px',
    textAlign: 'center',
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
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
    fontSize: '1rem',
    fontWeight: '600',
  },
  formCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1f2937',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    minHeight: '100px',
    resize: 'vertical',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchContainer: {
    position: 'relative',
    flex: '1',
    minWidth: '280px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    width: '100%',
    padding: '10px 10px 10px 44px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    background: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  duplicateButton: {
    padding: '6px',
    background: 'transparent',
    color: '#059669',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  editButton: {
    padding: '6px',
    background: 'transparent',
    color: '#2563eb',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteButton: {
    padding: '6px',
    background: 'transparent',
    color: '#ef4444',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardDescription: {
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  cardMeta: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  badge: {
    padding: '4px 12px',
    background: '#e0e7ff',
    color: '#3730a3',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  status: {
    padding: '4px 12px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  fileCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    background: '#f3f4f6',
    color: '#4b5563',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    flexWrap: 'wrap',
    gap: '8px',
  },
  openEditorButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  empty: {
    padding: '48px',
    textAlign: 'center',
    color: '#6b7280',
  },
};
