import React, { useState, useEffect } from 'react';
import { Server, Database, Globe, Shield, Plus, Trash2, DollarSign, MapPin, RefreshCw, HardDrive, Network } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'VM',
    region: 'eastus',
    cost_per_month: 0
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setResources([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please sign in to create resources');
        return;
      }

      const { error } = await supabase
        .from('resources')
        .insert({
          user_id: user.id,
          name: formData.name,
          type: formData.type,
          region: formData.region,
          cost_per_month: formData.cost_per_month,
          status: 'running'
        });

      if (error) throw error;

      setFormData({ name: '', type: 'VM', region: 'eastus', cost_per_month: 0 });
      setShowForm(false);
      loadResources();
    } catch (error) {
      alert('Error creating resource: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      loadResources();
    } catch (error) {
      alert('Error deleting resource: ' + error.message);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'VM': return <Server size={24} color="#2563eb" />;
      case 'Database': return <Database size={24} color="#2563eb" />;
      case 'Storage': return <HardDrive size={24} color="#2563eb" />;
      case 'Network': return <Network size={24} color="#2563eb" />;
      case 'Security': return <Shield size={24} color="#2563eb" />;
      default: return <Server size={24} color="#2563eb" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return { bg: '#d1fae5', color: '#065f46' };
      case 'stopped': return { bg: '#fee2e2', color: '#991b1b' };
      case 'provisioning': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f3f4f6', color: '#4b5563' };
    }
  };

  const totalCost = resources.reduce((sum, r) => sum + parseFloat(r.cost_per_month || 0), 0);

  if (loading) {
    return <div style={styles.loading}>Loading resources...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Azure Resources</h2>
          <p style={styles.subtitle}>
            {resources.length} resources · ${totalCost.toFixed(2)}/month
          </p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={loadResources} style={styles.refreshButton}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
            <Plus size={18} />
            Add Resource
          </button>
        </div>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Add New Resource</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Resource Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              required
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={styles.input}
            >
              <option value="VM">Virtual Machine</option>
              <option value="Database">Database</option>
              <option value="Storage">Storage</option>
              <option value="Network">Network</option>
              <option value="Security">Security</option>
            </select>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              style={styles.input}
            >
              <option value="eastus">East US</option>
              <option value="westus">West US</option>
              <option value="westeurope">West Europe</option>
              <option value="eastasia">East Asia</option>
            </select>
            <input
              type="number"
              placeholder="Monthly Cost ($)"
              value={formData.cost_per_month}
              onChange={(e) => setFormData({ ...formData, cost_per_month: parseFloat(e.target.value) })}
              style={styles.input}
              min="0"
              step="0.01"
            />
            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                Create Resource
              </button>
            </div>
          </form>
        </div>
      )}

      {resources.length === 0 && !showForm ? (
        <div style={styles.empty}>
          <p>No resources yet. Add your first Azure resource to get started.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {resources.map((resource) => {
            const statusStyle = getStatusColor(resource.status);
            return (
              <div key={resource.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconContainer}>
                    {getIcon(resource.type)}
                  </div>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    style={styles.deleteButton}
                    title="Delete resource"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{resource.name}</h3>
                  <p style={styles.cardType}>{resource.type}</p>
                  <div style={styles.cardMeta}>
                    <span style={{ ...styles.statusBadge, background: statusStyle.bg, color: statusStyle.color }}>
                      {resource.status}
                    </span>
                    <span style={styles.region}>
                      <MapPin size={12} />
                      {resource.region}
                    </span>
                    {resource.cost_per_month > 0 && (
                      <span style={styles.cost}>
                        <DollarSign size={12} />
                        ${resource.cost_per_month}/mo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
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
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    background: 'white',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  submitButton: {
    padding: '10px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  empty: {
    padding: '48px',
    textAlign: 'center',
    color: '#6b7280',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  iconContainer: {
    padding: '12px',
    background: '#eff6ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: '6px',
    background: 'transparent',
    color: '#ef4444',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  cardType: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginBottom: '12px',
  },
  cardMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  region: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    background: '#f3f4f6',
    color: '#4b5563',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  cost: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    background: '#ecfdf5',
    color: '#059669',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
};
