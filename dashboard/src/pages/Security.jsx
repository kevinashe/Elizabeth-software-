import { useState, useEffect } from 'react';
import { Shield, Key, Lock, AlertTriangle, Eye, FileText, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../utils/storage';

export default function Security() {
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [keysData, logsData, mfaData, rolesData] = await Promise.all([
        supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('mfa_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_roles').select('*').eq('user_id', user.id),
      ]);

      setApiKeys(keysData.data || []);
      setAuditLogs(logsData.data || []);
      setMfaEnabled(mfaData.data?.enabled || false);
      setRoles(rolesData.data || []);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'login':
        return <Key size={16} color="#10b981" />;
      case 'logout':
        return <Key size={16} color="#6b7280" />;
      case 'create':
        return <FileText size={16} color="#3b82f6" />;
      case 'update':
        return <FileText size={16} color="#f59e0b" />;
      case 'delete':
        return <AlertTriangle size={16} color="#ef4444" />;
      default:
        return <Eye size={16} color="#6b7280" />;
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Shield size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading security settings...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Shield size={32} color="#3b82f6" />
        <div>
          <h2 style={styles.title}>Security Center</h2>
          <p style={styles.subtitle}>Manage authentication, API keys, and access control</p>
        </div>
      </div>

      <div style={styles.statusBar}>
        <div style={styles.statusCard}>
          <Lock size={24} color={mfaEnabled ? '#10b981' : '#f59e0b'} />
          <div>
            <div style={styles.statusLabel}>Two-Factor Auth</div>
            <div style={{ ...styles.statusValue, color: mfaEnabled ? '#10b981' : '#f59e0b' }}>
              {mfaEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
        <div style={styles.statusCard}>
          <Key size={24} color="#3b82f6" />
          <div>
            <div style={styles.statusLabel}>API Keys</div>
            <div style={styles.statusValue}>{apiKeys.length} active</div>
          </div>
        </div>
        <div style={styles.statusCard}>
          <UsersIcon size={24} color="#8b5cf6" />
          <div>
            <div style={styles.statusLabel}>User Roles</div>
            <div style={styles.statusValue}>{roles.length} assigned</div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>API Keys</h3>
          <div style={styles.keyList}>
            {apiKeys.map((key) => (
              <div key={key.id} style={styles.keyCard}>
                <div style={styles.keyHeader}>
                  <Key size={20} color="#3b82f6" />
                  <span style={styles.keyName}>{key.key_name}</span>
                </div>
                <div style={styles.keyDetails}>
                  <span style={styles.keyPrefix}>Prefix: {key.key_prefix}</span>
                  <span style={styles.keyDate}>
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </span>
                </div>
                {key.last_used && (
                  <div style={styles.keyUsage}>
                    Last used: {new Date(key.last_used).toLocaleString()}
                  </div>
                )}
                {key.scopes && key.scopes.length > 0 && (
                  <div style={styles.scopesList}>
                    {key.scopes.map((scope, idx) => (
                      <span key={idx} style={styles.scopeBadge}>{scope}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {apiKeys.length === 0 && (
              <div style={styles.emptyState}>
                <Key size={48} color="#d1d5db" />
                <p style={styles.emptyText}>No API keys configured</p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Audit Log</h3>
          <div style={styles.auditList}>
            {auditLogs.map((log) => (
              <div key={log.id} style={styles.auditCard}>
                <div style={styles.auditHeader}>
                  {getActionIcon(log.action)}
                  <span style={styles.auditAction}>{log.action}</span>
                  <span style={styles.auditTime}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {log.resource_type && (
                  <div style={styles.auditDetails}>
                    <span style={styles.auditResource}>
                      {log.resource_type}: {log.resource_id?.substring(0, 8)}...
                    </span>
                  </div>
                )}
                {log.ip_address && (
                  <div style={styles.auditIp}>IP: {log.ip_address}</div>
                )}
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div style={styles.emptyState}>
                <FileText size={48} color="#d1d5db" />
                <p style={styles.emptyText}>No audit logs</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.rolesSection}>
        <h3 style={styles.sectionTitle}>User Roles & Permissions</h3>
        <div style={styles.rolesList}>
          {roles.map((role) => (
            <div key={role.id} style={styles.roleCard}>
              <div style={styles.roleHeader}>
                <UsersIcon size={20} color="#8b5cf6" />
                <span style={styles.roleName}>{role.role}</span>
              </div>
              <div style={styles.roleDetails}>
                Granted: {new Date(role.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {roles.length === 0 && (
            <div style={styles.emptyState}>
              <UsersIcon size={48} color="#d1d5db" />
              <p style={styles.emptyText}>No roles assigned</p>
            </div>
          )}
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
  statusBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statusCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  statusValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
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
  keyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  keyCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  keyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  keyName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  keyDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  keyPrefix: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  keyDate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  keyUsage: {
    fontSize: '11px',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  scopesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  scopeBadge: {
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
  },
  auditList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  auditCard: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  auditHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  auditAction: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'uppercase',
  },
  auditTime: {
    fontSize: '11px',
    color: '#9ca3af',
    marginLeft: 'auto',
  },
  auditDetails: {
    marginBottom: '4px',
  },
  auditResource: {
    fontSize: '12px',
    color: '#6b7280',
  },
  auditIp: {
    fontSize: '11px',
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  rolesSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  rolesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  },
  roleCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  roleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  roleName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  roleDetails: {
    fontSize: '12px',
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
