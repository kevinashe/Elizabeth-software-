import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Folder, Database, Users, Settings as SettingsIcon, Home, Code2, Brain, MessageSquare, LogOut, Rocket, Zap, TrendingUp, Sparkles, Activity, Cpu, Shield, GitBranch, UserCheck } from 'lucide-react';
import Projects from './pages/Projects';
import Resources from './pages/Resources';
import Team from './pages/Team';
import Settings from './pages/Settings';
import CodeEditor from './pages/CodeEditor';
import AIFeatures from './pages/AIFeatures';
import Chat from './pages/Chat';
import Intelligence from './pages/Intelligence';
import Collaboration from './pages/Collaboration';
import DevOps from './pages/DevOps';
import Security from './pages/Security';
import Monitoring from './pages/Monitoring';
import Login from './pages/Login';
import SelfEditor from './pages/SelfEditor';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import VoiceAssistant from './components/VoiceAssistant';
import { initializeOfflineSync } from './utils/offlineSync';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase config:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  url: supabaseUrl?.substring(0, 30) + '...'
});

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  const [generatedCode, setGeneratedCode] = useState(null);

  useEffect(() => {
    console.log('App: Checking auth session...');
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('App: Session checked, user:', session?.user?.email || 'not logged in');
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Auth connection error:', err);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const cleanup = initializeOfflineSync();
    return cleanup;
  }, []);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  if (!user) {
    console.log('App: No user, showing login page');
    return <Login onAuthSuccess={(user) => setUser(user)} />;
  }

  console.log('App: User authenticated, showing dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'projects':
        return <Projects user={user} onOpenInEditor={(project) => {
          setGeneratedCode({ project });
          setCurrentView('code');
        }} />;
      case 'resources':
        return <Resources />;
      case 'team':
        return <Team />;
      case 'settings':
        return <Settings />;
      case 'code':
        return <CodeEditor initialCode={generatedCode} />;
      case 'ai':
        return <AIFeatures onOpenInEditor={(code, files) => {
          setGeneratedCode({ code, files });
          setCurrentView('code');
        }} />;
      case 'chat':
        return <Chat onCodeGenerated={(code, files) => {
          setGeneratedCode({ code, files });
          setCurrentView('code');
        }} />;
      case 'intelligence':
        return <Intelligence />;
      case 'collaboration':
        return <Collaboration />;
      case 'devops':
        return <DevOps />;
      case 'security':
        return <Security />;
      case 'monitoring':
        return <Monitoring />;
      case 'self-editor':
        return <SelfEditor />;
      default:
        return (
          <div style={styles.main}>
            <div style={styles.heroSection}>
              <div style={styles.heroContent}>
                <div style={styles.heroIconContainer}>
                  <Rocket size={48} style={styles.heroIcon} />
                </div>
                <h1 style={styles.heroTitle}>
                  Build Amazing Things
                  <span style={styles.heroTitleAccent}> Faster</span>
                </h1>
                <p style={styles.heroSubtitle}>
                  Your complete development platform for creating, deploying, and managing cloud infrastructure
                </p>
                <div style={styles.heroButtons}>
                  <button onClick={() => setCurrentView('projects')} style={styles.heroPrimaryButton}>
                    <Sparkles size={20} />
                    Start Building
                  </button>
                  <button onClick={() => setCurrentView('chat')} style={styles.heroSecondaryButton}>
                    <Brain size={20} />
                    AI Assistant
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.statsBar}>
              <div style={styles.statCard}>
                <Activity size={24} style={{ color: '#10b981' }} />
                <div>
                  <div style={styles.statNumber}>12</div>
                  <div style={styles.statLabel}>Active Projects</div>
                </div>
              </div>
              <div style={styles.statCard}>
                <TrendingUp size={24} style={{ color: '#3b82f6' }} />
                <div>
                  <div style={styles.statNumber}>98%</div>
                  <div style={styles.statLabel}>Uptime</div>
                </div>
              </div>
              <div style={styles.statCard}>
                <Zap size={24} style={{ color: '#f59e0b' }} />
                <div>
                  <div style={styles.statNumber}>Fast</div>
                  <div style={styles.statLabel}>Deployments</div>
                </div>
              </div>
            </div>

            <div style={styles.featuresSection}>
              <h2 style={styles.sectionTitle}>Powerful Features</h2>
              <div style={styles.grid}>
                <div style={styles.featureCard} onClick={() => setCurrentView('projects')}>
                  <div style={styles.featureIconContainer}>
                    <Folder size={32} style={styles.featureIcon} />
                  </div>
                  <h3 style={styles.featureTitle}>Projects</h3>
                  <p style={styles.featureText}>Create and manage multiple projects with ease</p>
                  <div style={styles.featureBadge}>Start Now</div>
                </div>

                <div style={styles.featureCard} onClick={() => setCurrentView('code')}>
                  <div style={styles.featureIconContainer}>
                    <Code2 size={32} style={styles.featureIcon} />
                  </div>
                  <h3 style={styles.featureTitle}>Code Editor</h3>
                  <p style={styles.featureText}>Write code with live preview and AI assistance</p>
                  <div style={styles.featureBadge}>Code Now</div>
                </div>

                <div style={styles.featureCard} onClick={() => setCurrentView('resources')}>
                  <div style={styles.featureIconContainer}>
                    <Database size={32} style={styles.featureIcon} />
                  </div>
                  <h3 style={styles.featureTitle}>Resources</h3>
                  <p style={styles.featureText}>Track and optimize your cloud resources</p>
                  <div style={styles.featureBadge}>Explore</div>
                </div>

                <div style={styles.featureCard} onClick={() => setCurrentView('chat')}>
                  <div style={styles.featureIconContainer}>
                    <Brain size={32} style={styles.featureIcon} />
                  </div>
                  <h3 style={styles.featureTitle}>AI Assistant</h3>
                  <p style={styles.featureText}>Get help from AI-powered development tools</p>
                  <div style={styles.featureBadge}>Try It</div>
                </div>

                <div style={styles.featureCard} onClick={() => setCurrentView('team')}>
                  <div style={styles.featureIconContainer}>
                    <Users size={32} style={styles.featureIcon} />
                  </div>
                  <h3 style={styles.featureTitle}>Team</h3>
                  <p style={styles.featureText}>Collaborate seamlessly with your team</p>
                  <div style={styles.featureBadge}>Invite</div>
                </div>

                <div style={styles.featureCard} onClick={() => setCurrentView('settings')}>
                  <div style={styles.featureIconContainer}>
                    <SettingsIcon size={32} style={styles.featureIcon} />
                  </div>
                  <h3 style={styles.featureTitle}>Settings</h3>
                  <p style={styles.featureText}>Customize your platform experience</p>
                  <div style={styles.featureBadge}>Configure</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const handleVoiceCommand = (command) => {
    console.log('Voice command received:', command);

    if (command.action === 'navigate') {
      setCurrentView(command.target);
    } else if (command.action === 'create' && command.target === 'project') {
      setCurrentView('projects');
    }
  };

  return (
    <div style={styles.container}>
      <OfflineIndicator />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <VoiceAssistant onCommand={handleVoiceCommand} />
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>DevMind</h1>
            <nav style={styles.nav}>
              <button
                onClick={() => setCurrentView('overview')}
                style={currentView === 'overview' ? styles.navButtonActive : styles.navButton}
              >
                <Home size={18} />
                Overview
              </button>
              <button
                onClick={() => setCurrentView('chat')}
                style={currentView === 'chat' ? styles.navButtonActive : styles.navButton}
              >
                <MessageSquare size={18} />
                Chat
              </button>
              <button
                onClick={() => setCurrentView('code')}
                style={currentView === 'code' ? styles.navButtonActive : styles.navButton}
              >
                <Code2 size={18} />
                Code
              </button>
              <button
                onClick={() => setCurrentView('ai')}
                style={currentView === 'ai' ? styles.navButtonActive : styles.navButton}
              >
                <Brain size={18} />
                AI Features
              </button>
              <button
                onClick={() => setCurrentView('intelligence')}
                style={currentView === 'intelligence' ? styles.navButtonActive : styles.navButton}
              >
                <Cpu size={18} />
                Intelligence
              </button>
              <button
                onClick={() => setCurrentView('projects')}
                style={currentView === 'projects' ? styles.navButtonActive : styles.navButton}
              >
                <Folder size={18} />
                Projects
              </button>
              <button
                onClick={() => setCurrentView('resources')}
                style={currentView === 'resources' ? styles.navButtonActive : styles.navButton}
              >
                <Database size={18} />
                Resources
              </button>
              <button
                onClick={() => setCurrentView('team')}
                style={currentView === 'team' ? styles.navButtonActive : styles.navButton}
              >
                <Users size={18} />
                Team
              </button>
              <button
                onClick={() => setCurrentView('collaboration')}
                style={currentView === 'collaboration' ? styles.navButtonActive : styles.navButton}
              >
                <UserCheck size={18} />
                Collab
              </button>
              <button
                onClick={() => setCurrentView('devops')}
                style={currentView === 'devops' ? styles.navButtonActive : styles.navButton}
              >
                <GitBranch size={18} />
                DevOps
              </button>
              <button
                onClick={() => setCurrentView('security')}
                style={currentView === 'security' ? styles.navButtonActive : styles.navButton}
              >
                <Shield size={18} />
                Security
              </button>
              <button
                onClick={() => setCurrentView('monitoring')}
                style={currentView === 'monitoring' ? styles.navButtonActive : styles.navButton}
              >
                <Activity size={18} />
                Monitoring
              </button>
              <button
                onClick={() => setCurrentView('self-editor')}
                style={currentView === 'self-editor' ? styles.navButtonActive : styles.navButton}
              >
                <Sparkles size={18} />
                Self-Edit
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                style={currentView === 'settings' ? styles.navButtonActive : styles.navButton}
              >
                <SettingsIcon size={18} />
                Settings
              </button>
            </nav>
          </div>
          <div style={styles.userSection}>
            <span style={styles.userEmail}>{user.email}</span>
            <button onClick={handleSignOut} style={styles.signOutButton}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={styles.mainContainer}>
        {renderContent()}
      </main>
    </div>
  );
}

const styles = {
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  authContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  authCard: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '400px',
  },
  authTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
    textAlign: 'center',
  },
  authSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '32px',
  },
  errorMessage: {
    padding: '12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    marginBottom: '16px',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '12px 24px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  toggleButton: {
    marginTop: '16px',
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#2563eb',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  guestButton: {
    marginTop: '8px',
    width: '100%',
    padding: '12px',
    background: '#f3f4f6',
    color: '#4b5563',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '20px 0',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '48px',
  },
  nav: {
    display: 'flex',
    gap: '8px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'transparent',
    color: '#6b7280',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background 0.2s, color 0.2s',
  },
  navButtonActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#eff6ff',
    color: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userEmail: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  signOutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'background 0.2s',
  },
  mainContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  main: {
    padding: '0',
  },
  heroSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '80px 24px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  heroIconContainer: {
    display: 'inline-flex',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    marginBottom: '24px',
    backdropFilter: 'blur(10px)',
    animation: 'float 3s ease-in-out infinite',
  },
  heroIcon: {
    color: 'white',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: '800',
    color: 'white',
    marginBottom: '20px',
    lineHeight: '1.2',
  },
  heroTitleAccent: {
    background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  heroPrimaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 32px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.125rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  heroSecondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 32px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '2px solid white',
    borderRadius: '12px',
    fontSize: '1.125rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
    backdropFilter: 'blur(10px)',
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    padding: '40px 24px',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 32px',
    background: '#f9fafb',
    borderRadius: '12px',
  },
  statNumber: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  featuresSection: {
    padding: '60px 24px',
    background: '#f9fafb',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '48px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  featureCard: {
    background: 'white',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'all 0.3s',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  featureIconContainer: {
    display: 'inline-flex',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  featureIcon: {
    color: 'white',
  },
  featureTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
  },
  featureText: {
    color: '#6b7280',
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  featureBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
};

export default App;
