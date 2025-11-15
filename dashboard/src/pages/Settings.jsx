import React, { useState, useEffect } from 'react';
import { Bell, Lock, Palette, Globe, Loader, User, Save, Code } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Settings() {
  const [settings, setSettings] = useState({
    aiAssistantName: 'Elizabeth',
    emailNotifications: true,
    slackNotifications: false,
    weeklyReports: false,
    twoFactorAuth: false,
    sessionTimeout: '30m',
    theme: 'light',
    language: 'en',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email);

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          aiAssistantName: data.ai_assistant_name || 'Elizabeth',
          emailNotifications: data.email_notifications ?? true,
          slackNotifications: data.slack_notifications ?? false,
          weeklyReports: data.weekly_reports ?? false,
          twoFactorAuth: data.two_factor_auth ?? false,
          sessionTimeout: data.session_timeout || '30m',
          theme: data.theme || 'light',
          language: data.language || 'en',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please sign in to save settings');
        return;
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ai_assistant_name: settings.aiAssistantName,
          email_notifications: settings.emailNotifications,
          slack_notifications: settings.slackNotifications,
          weekly_reports: settings.weeklyReports,
          two_factor_auth: settings.twoFactorAuth,
          session_timeout: settings.sessionTimeout,
          theme: settings.theme,
          language: settings.language,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Settings</h2>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <User size={24} color="#2563eb" />
          <h3 style={styles.sectionTitle}>Profile</h3>
        </div>
        <div style={styles.settingsList}>
          <div style={styles.settingItem}>
            <div style={{ flex: 1 }}>
              <div style={styles.settingLabel}>AI Assistant Name</div>
              <div style={styles.settingDescription}>Give your AI assistant a custom name</div>
            </div>
            <input
              type="text"
              value={settings.aiAssistantName}
              onChange={(e) => handleChange('aiAssistantName', e.target.value)}
              placeholder="Elizabeth"
              style={styles.textInput}
            />
          </div>

          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Email Address</div>
              <div style={styles.settingDescription}>Your account email</div>
            </div>
            <div style={styles.emailDisplay}>{userEmail}</div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Bell size={24} color="#2563eb" />
          <h3 style={styles.sectionTitle}>Notifications</h3>
        </div>
        <div style={styles.settingsList}>
          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Email Notifications</div>
              <div style={styles.settingDescription}>Receive email updates about your projects</div>
            </div>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                style={{ display: 'none' }}
              />
              <span style={{
                ...styles.slider,
                background: settings.emailNotifications ? '#2563eb' : '#cbd5e1'
              }}>
                <span style={{
                  ...styles.sliderButton,
                  transform: settings.emailNotifications ? 'translateX(24px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>

          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Slack Notifications</div>
              <div style={styles.settingDescription}>Receive Slack notifications</div>
            </div>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={settings.slackNotifications}
                onChange={() => handleToggle('slackNotifications')}
                style={{ display: 'none' }}
              />
              <span style={{
                ...styles.slider,
                background: settings.slackNotifications ? '#2563eb' : '#cbd5e1'
              }}>
                <span style={{
                  ...styles.sliderButton,
                  transform: settings.slackNotifications ? 'translateX(24px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>

          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Weekly Reports</div>
              <div style={styles.settingDescription}>Receive weekly activity reports</div>
            </div>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={settings.weeklyReports}
                onChange={() => handleToggle('weeklyReports')}
                style={{ display: 'none' }}
              />
              <span style={{
                ...styles.slider,
                background: settings.weeklyReports ? '#2563eb' : '#cbd5e1'
              }}>
                <span style={{
                  ...styles.sliderButton,
                  transform: settings.weeklyReports ? 'translateX(24px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Lock size={24} color="#2563eb" />
          <h3 style={styles.sectionTitle}>Security</h3>
        </div>
        <div style={styles.settingsList}>
          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Two-Factor Authentication</div>
              <div style={styles.settingDescription}>Add an extra layer of security</div>
            </div>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={() => handleToggle('twoFactorAuth')}
                style={{ display: 'none' }}
              />
              <span style={{
                ...styles.slider,
                background: settings.twoFactorAuth ? '#2563eb' : '#cbd5e1'
              }}>
                <span style={{
                  ...styles.sliderButton,
                  transform: settings.twoFactorAuth ? 'translateX(24px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>

          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Session Timeout</div>
              <div style={styles.settingDescription}>Automatic logout after inactivity</div>
            </div>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', e.target.value)}
              style={styles.select}
            >
              <option value="15m">15 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
              <option value="4h">4 hours</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Palette size={24} color="#2563eb" />
          <h3 style={styles.sectionTitle}>Appearance</h3>
        </div>
        <div style={styles.settingsList}>
          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Theme</div>
              <div style={styles.settingDescription}>Choose your preferred theme</div>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              style={styles.select}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Language</div>
              <div style={styles.settingDescription}>Choose your preferred language</div>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              style={styles.select}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Globe size={24} color="#2563eb" />
          <h3 style={styles.sectionTitle}>Regional Settings</h3>
        </div>
        <div style={styles.settingsList}>
          <div style={styles.settingItem}>
            <div>
              <div style={styles.settingLabel}>Time Zone</div>
              <div style={styles.settingDescription}>Your local time zone</div>
            </div>
            <div style={styles.emailDisplay}>UTC (Auto-detected)</div>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={handleSave} style={styles.saveButton} disabled={saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  container: {
    padding: '24px',
    maxWidth: '900px',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '32px',
  },
  section: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
  },
  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  settingLabel: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px',
  },
  settingDescription: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  textInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    minWidth: '250px',
    outline: 'none',
  },
  emailDisplay: {
    padding: '8px 12px',
    background: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '48px',
    height: '24px',
    cursor: 'pointer',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '24px',
    transition: '0.3s',
    display: 'flex',
    alignItems: 'center',
  },
  sliderButton: {
    position: 'absolute',
    height: '18px',
    width: '18px',
    left: '3px',
    background: 'white',
    borderRadius: '50%',
    transition: '0.3s',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    minWidth: '180px',
    cursor: 'pointer',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 32px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
};
