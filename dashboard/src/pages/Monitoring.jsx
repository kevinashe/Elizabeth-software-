import { useState, useEffect } from 'react';
import { Activity, AlertCircle, DollarSign, Gauge, TrendingUp, XCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/storage';

export default function Monitoring() {
  const [metrics, setMetrics] = useState([]);
  const [errors, setErrors] = useState([]);
  const [costs, setCosts] = useState([]);
  const [summary, setSummary] = useState({
    totalErrors: 0,
    criticalErrors: 0,
    avgResponseTime: 0,
    monthlyCost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [metricsData, errorsData, costsData] = await Promise.all([
        supabase
          .from('application_metrics')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50),
        supabase
          .from('error_tracking')
          .select('*')
          .eq('resolved', false)
          .order('last_seen', { ascending: false })
          .limit(10),
        supabase
          .from('cost_tracking')
          .select('*')
          .order('period_start', { ascending: false })
          .limit(5),
      ]);

      setMetrics(metricsData.data || []);
      setErrors(errorsData.data || []);
      setCosts(costsData.data || []);

      const criticalErrors = errorsData.data?.filter(e => e.severity === 'critical').length || 0;
      const totalCost = costsData.data?.reduce((sum, c) => sum + c.cost, 0) || 0;

      setSummary({
        totalErrors: errorsData.data?.length || 0,
        criticalErrors,
        avgResponseTime: 245,
        monthlyCost: totalCost.toFixed(2),
      });
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981',
    };
    return colors[severity] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Activity size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading monitoring data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Activity size={32} color="#3b82f6" />
        <div>
          <h2 style={styles.title}>Application Monitoring</h2>
          <p style={styles.subtitle}>Real-time performance, errors, and cost tracking</p>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <Gauge size={24} color="#3b82f6" />
          <div>
            <div style={styles.metricValue}>{summary.avgResponseTime}ms</div>
            <div style={styles.metricLabel}>Avg Response Time</div>
          </div>
        </div>
        <div style={styles.metricCard}>
          <AlertCircle size={24} color={summary.criticalErrors > 0 ? '#ef4444' : '#10b981'} />
          <div>
            <div style={styles.metricValue}>{summary.totalErrors}</div>
            <div style={styles.metricLabel}>Active Errors</div>
          </div>
        </div>
        <div style={styles.metricCard}>
          <XCircle size={24} color="#ef4444" />
          <div>
            <div style={styles.metricValue}>{summary.criticalErrors}</div>
            <div style={styles.metricLabel}>Critical Issues</div>
          </div>
        </div>
        <div style={styles.metricCard}>
          <DollarSign size={24} color="#10b981" />
          <div>
            <div style={styles.metricValue}>${summary.monthlyCost}</div>
            <div style={styles.metricLabel}>Monthly Cost</div>
          </div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Active Errors</h3>
          <div style={styles.errorList}>
            {errors.map((error) => (
              <div key={error.id} style={styles.errorCard}>
                <div style={styles.errorHeader}>
                  <AlertCircle size={20} color={getSeverityColor(error.severity)} />
                  <span style={styles.errorType}>{error.error_type}</span>
                  <span
                    style={{
                      ...styles.severityBadge,
                      background: `${getSeverityColor(error.severity)}15`,
                      color: getSeverityColor(error.severity),
                    }}
                  >
                    {error.severity}
                  </span>
                </div>
                <div style={styles.errorMessage}>{error.error_message}</div>
                <div style={styles.errorDetails}>
                  <span style={styles.detailText}>
                    Frequency: {error.frequency}
                  </span>
                  <span style={styles.detailText}>
                    Last seen: {new Date(error.last_seen).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            {errors.length === 0 && (
              <div style={styles.emptyState}>
                <CheckCircle size={48} color="#10b981" />
                <p style={styles.emptyText}>No active errors</p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Cost Tracking</h3>
          <div style={styles.costList}>
            {costs.map((cost) => (
              <div key={cost.id} style={styles.costCard}>
                <div style={styles.costHeader}>
                  <DollarSign size={20} color="#10b981" />
                  <span style={styles.costService}>{cost.service}</span>
                </div>
                <div style={styles.costAmount}>
                  ${cost.cost.toFixed(2)} {cost.currency}
                </div>
                <div style={styles.costPeriod}>
                  {new Date(cost.period_start).toLocaleDateString()} - {new Date(cost.period_end).toLocaleDateString()}
                </div>
              </div>
            ))}
            {costs.length === 0 && (
              <div style={styles.emptyState}>
                <DollarSign size={48} color="#d1d5db" />
                <p style={styles.emptyText}>No cost data available</p>
              </div>
            )}
          </div>

          <div style={styles.metricsSection}>
            <h3 style={styles.sectionTitle}>Recent Metrics</h3>
            <div style={styles.metricsChart}>
              {metrics.slice(0, 10).map((metric, index) => (
                <div key={metric.id} style={styles.metricItem}>
                  <div style={styles.metricInfo}>
                    <span style={styles.metricName}>{metric.metric_name}</span>
                    <span style={styles.metricType}>{metric.metric_type}</span>
                  </div>
                  <div style={styles.metricValueContainer}>
                    <span style={styles.metricValueText}>{metric.value.toFixed(2)}</span>
                    {metric.unit && <span style={styles.metricUnit}>{metric.unit}</span>}
                  </div>
                </div>
              ))}
              {metrics.length === 0 && (
                <div style={styles.emptyState}>
                  <TrendingUp size={48} color="#d1d5db" />
                  <p style={styles.emptyText}>No metrics available</p>
                </div>
              )}
            </div>
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
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
  errorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  errorCard: {
    padding: '16px',
    background: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fee2e2',
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  errorType: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  severityBadge: {
    marginLeft: 'auto',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  errorMessage: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  errorDetails: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  costList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  costCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  costHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  costService: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  costAmount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#10b981',
    marginBottom: '4px',
  },
  costPeriod: {
    fontSize: '12px',
    color: '#6b7280',
  },
  metricsSection: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  metricsChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '6px',
  },
  metricInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937',
  },
  metricType: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  metricValueContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  metricValueText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#3b82f6',
  },
  metricUnit: {
    fontSize: '11px',
    color: '#6b7280',
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
