import { useState, useEffect } from 'react';
import { Users, Circle, Eye, Edit3, MapPin, Clock } from 'lucide-react';
import { supabase } from '../utils/storage';

export default function Collaboration() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollaborationData();

    const presenceChannel = supabase
      .channel('user-presence')
      .on('presence', { event: 'sync' }, () => {
        loadCollaborationData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  const loadCollaborationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [presenceData, sessionsData] = await Promise.all([
        supabase.from('user_presence').select('*').eq('status', 'online'),
        supabase.from('collaboration_sessions').select('*').is('ended_at', null),
      ]);

      setActiveUsers(presenceData.data || []);
      setSessions(sessionsData.data || []);
    } catch (error) {
      console.error('Error loading collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      online: '#10b981',
      away: '#f59e0b',
      busy: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Users size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading collaboration...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Users size={32} color="#3b82f6" />
        <div>
          <h2 style={styles.title}>Real-time Collaboration</h2>
          <p style={styles.subtitle}>{activeUsers.length} users online</p>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Active Users</h3>
          <div style={styles.userList}>
            {activeUsers.map((user) => (
              <div key={user.id} style={styles.userCard}>
                <div style={styles.userInfo}>
                  <Circle size={12} color={getStatusColor(user.status)} fill={getStatusColor(user.status)} />
                  <span style={styles.userName}>User {user.user_id.substring(0, 8)}</span>
                </div>
                {user.current_file && (
                  <div style={styles.userActivity}>
                    <Edit3 size={14} color="#6b7280" />
                    <span style={styles.activityText}>{user.current_file}</span>
                  </div>
                )}
                <div style={styles.timestamp}>
                  <Clock size={12} color="#9ca3af" />
                  <span style={styles.timestampText}>
                    {new Date(user.last_seen).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {activeUsers.length === 0 && (
              <div style={styles.emptyState}>
                <Users size={48} color="#d1d5db" />
                <p style={styles.emptyText}>No active users</p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Active Sessions</h3>
          <div style={styles.sessionList}>
            {sessions.map((session) => (
              <div key={session.id} style={styles.sessionCard}>
                <div style={styles.sessionHeader}>
                  <MapPin size={20} color="#3b82f6" />
                  <span style={styles.sessionName}>{session.session_name}</span>
                </div>
                <div style={styles.sessionDetails}>
                  <span style={styles.detailLabel}>Started:</span>
                  <span style={styles.detailValue}>
                    {new Date(session.started_at).toLocaleString()}
                  </span>
                </div>
                <div style={styles.sessionDetails}>
                  <span style={styles.detailLabel}>Participants:</span>
                  <span style={styles.detailValue}>
                    {Array.isArray(session.participants) ? session.participants.length : 0}
                  </span>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={styles.emptyState}>
                <Eye size={48} color="#d1d5db" />
                <p style={styles.emptyText}>No active sessions</p>
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
  grid: {
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
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  userCard: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  userActivity: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },
  activityText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  timestampText: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sessionCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  sessionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  sessionName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937',
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
