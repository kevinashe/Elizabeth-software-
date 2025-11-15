import { useState, useEffect } from 'react';
import { Rocket, GitBranch, Activity, AlertCircle, Package, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../utils/storage';

export default function DevOps() {
  const [deployments, setDeployments] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [metrics, setMetrics] = useState({
    successRate: 0,
    avgDuration: 0,
    totalDeployments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevOpsData();
  }, []);

  const loadDevOpsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [deploymentsData, pipelinesData] = await Promise.all([
        supabase
          .from('deployments')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(10),
        supabase
          .from('ci_cd_pipelines')
          .select('*')
          .order('last_run', { ascending: false }),
      ]);

      setDeployments(deploymentsData.data || []);
      setPipelines(pipelinesData.data || []);

      if (deploymentsData.data && deploymentsData.data.length > 0) {
        const successful = deploymentsData.data.filter(d => d.status === 'success').length;
        const total = deploymentsData.data.length;
        setMetrics({
          successRate: ((successful / total) * 100).toFixed(1),
          avgDuration: 125,
          totalDeployments: total,
        });
      }
    } catch (error) {
      console.error('Error loading DevOps data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'failed':
        return <XCircle size={20} color="#ef4444" />;
      case 'deploying':
        return <Clock size={20} color="#3b82f6" />;
      default:
        return <Clock size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      success: '#10b981',
      failed: '#ef4444',
      deploying: '#3b82f6',
      pending: '#f59e0b',
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Rocket size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading DevOps dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Rocket size={32} color="#3b82f6" />
        <div>
          <h2 style={styles.title}>DevOps Dashboard</h2>
          <p style={styles.subtitle}>CI/CD pipelines and deployment monitoring</p>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <TrendingUp size={24} color="#10b981" />
          <div>
            <div style={styles.metricValue}>{metrics.successRate}%</div>
            <div style={styles.metricLabel}>Success Rate</div>
          </div>
        </div>
        <div style={styles.metricCard}>
          <Clock size={24} color="#3b82f6" />
          <div>
            <div style={styles.metricValue}>{metrics.avgDuration}s</div>
            <div style={styles.metricLabel}>Avg Duration</div>
          </div>
        </div>
        <div style={styles.metricCard}>
          <Rocket size={24} color="#8b5cf6" />
          <div>
            <div style={styles.metricValue}>{metrics.totalDeployments}</div>
            <div style={styles.metricLabel}>Total Deployments</div>
          </div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Recent Deployments</h3>
          <div style={styles.deploymentList}>
            {deployments.map((deployment) => (
              <div key={deployment.id} style={styles.deploymentCard}>
                <div style={styles.deploymentHeader}>
                  {getStatusIcon(deployment.status)}
                  <div style={styles.deploymentInfo}>
                    <span style={styles.deploymentVersion}>v{deployment.version}</span>
                    <span style={styles.deploymentEnv}>{deployment.environment}</span>
                  </div>
                </div>
                <div style={styles.deploymentDetails}>
                  <span style={styles.detailText}>
                    Started: {new Date(deployment.started_at).toLocaleString()}
                  </span>
                  {deployment.completed_at && (
                    <span style={styles.detailText}>
                      Duration: {Math.round((new Date(deployment.completed_at) - new Date(deployment.started_at)) / 1000)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
            {deployments.length === 0 && (
              <div style={styles.emptyState}>
                <Rocket size={48} color="#d1d5db" />
                <p style={styles.emptyText}>No deployments yet</p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>CI/CD Pipelines</h3>
          <div style={styles.pipelineList}>
            {pipelines.map((pipeline) => (
              <div key={pipeline.id} style={styles.pipelineCard}>
                <div style={styles.pipelineHeader}>
                  <GitBranch size={20} color="#3b82f6" />
                  <span style={styles.pipelineName}>{pipeline.pipeline_name}</span>
                </div>
                <div style={styles.pipelineStatus}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: `${getStatusColor(pipeline.status)}15`,
                      color: getStatusColor(pipeline.status),
                    }}
                  >
                    {pipeline.status}
                  </span>
                </div>
                {pipeline.last_run && (
                  <div style={styles.pipelineDetails}>
                    <Activity size={14} color="#6b7280" />
                    <span style={styles.detailText}>
                      Last run: {new Date(pipeline.last_run).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {pipelines.length === 0 && (
              <div style={styles.emptyState}>
                <Package size={48} color="#d1d5db" />
                <p style={styles.emptyText}>No pipelines configured</p>
              </div>
            )}
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
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  metricCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  section: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 16px 0',
  },
  deploymentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  deploymentCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  deploymentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  deploymentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  deploymentVersion: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  deploymentEnv: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  deploymentDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  pipelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pipelineCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  pipelineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  pipelineName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  pipelineStatus: {
    marginBottom: '8px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
  },
  pipelineDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '12px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },
};
