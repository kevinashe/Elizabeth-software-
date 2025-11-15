import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, Loader, Trash2, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Team() {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [invitations, setInvitations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      if (!currentUser) {
        alert('Please sign in to invite team members');
        return;
      }

      const { error } = await supabase
        .from('team_invitations')
        .insert({
          inviter_id: currentUser.id,
          email: email,
          role: role,
          status: 'pending'
        });

      if (error) throw error;

      alert(`Invitation sent to ${email}`);
      setEmail('');
      setRole('member');
      setShowInvite(false);
      loadData();
    } catch (error) {
      alert('Error sending invitation: ' + error.message);
    }
  };

  const handleDeleteInvitation = async (id) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', id)
        .eq('inviter_id', currentUser?.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Error deleting invitation: ' + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Team Members</h2>
        <button onClick={() => setShowInvite(!showInvite)} style={styles.inviteButton}>
          <UserPlus size={20} />
          Invite Member
        </button>
      </div>

      {showInvite && (
        <div style={styles.inviteCard}>
          <h3 style={styles.inviteTitle}>Invite Team Member</h3>
          <form onSubmit={handleInvite} style={styles.form}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.input}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowInvite(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
        </div>
      ) : (
        <>
          <div style={styles.sectionTitle}>Current Team</div>
          <div style={styles.list}>
            <div style={styles.memberCard}>
              <div style={styles.avatar}>
                {currentUser?.email?.[0]?.toUpperCase() || 'Y'}
              </div>
              <div style={styles.memberInfo}>
                <h3 style={styles.memberName}>You</h3>
                <div style={styles.memberDetails}>
                  <Mail size={14} color="#6b7280" />
                  <span style={styles.memberEmail}>{currentUser?.email || 'Not signed in'}</span>
                </div>
              </div>
              <div style={styles.memberMeta}>
                <span style={styles.roleBadge}>
                  <Shield size={14} />
                  Owner
                </span>
                <span style={styles.statusBadge}>Active</span>
              </div>
            </div>
          </div>

          {invitations.length > 0 && (
            <>
              <div style={styles.sectionTitle}>Pending Invitations</div>
              <div style={styles.list}>
                {invitations.map((invitation) => (
                  <div key={invitation.id} style={styles.invitationCard}>
                    <div style={styles.invitationInfo}>
                      <div style={styles.invitationEmail}>
                        <Mail size={16} color="#6b7280" />
                        {invitation.email}
                      </div>
                      <div style={styles.invitationMeta}>
                        <span style={styles.roleBadge}>
                          <Shield size={14} />
                          {invitation.role}
                        </span>
                        <span style={styles.pendingBadge}>{invitation.status}</span>
                        <span style={styles.invitationDate}>
                          <Clock size={14} />
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteInvitation(invitation.id)}
                      style={styles.deleteButton}
                      title="Delete invitation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginTop: '32px',
    marginBottom: '16px',
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
  inviteButton: {
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
  inviteCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  inviteTitle: {
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  memberCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  memberDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  memberEmail: {
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  memberMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '6px 12px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  invitationCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '8px',
  },
  invitationMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pendingBadge: {
    padding: '4px 12px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  invitationDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  deleteButton: {
    padding: '8px',
    background: 'transparent',
    color: '#ef4444',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
