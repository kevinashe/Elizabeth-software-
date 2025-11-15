import React, { useState, useEffect, useRef } from 'react';
import { Code2, RefreshCw, Rocket, FolderOpen, Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SelfEditor() {
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [buildOutput, setBuildOutput] = useState([]);
  const [userId, setUserId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadAppFiles();
    }
  }, [userId]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadAppFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/src/App.jsx');
      const appContent = await response.text();

      setFiles({
        'App.jsx': {
          content: appContent,
          language: 'javascript',
          path: '/src/App.jsx'
        }
      });
      setSelectedFile('App.jsx');
      setBuildOutput(['> Ready to edit DevMind']);
    } catch (error) {
      setBuildOutput([`> Error loading files: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !userId) return;

    setSaving(true);
    try {
      const file = files[selectedFile];

      const { error } = await supabase
        .from('app_modifications')
        .insert({
          user_id: userId,
          file_path: file.path,
          content: file.content,
          modification_type: 'edit'
        });

      if (error) throw error;

      setLastSaved(new Date());
      setBuildOutput(prev => [...prev, `✓ Saved ${selectedFile}`]);
    } catch (error) {
      setBuildOutput(prev => [...prev, `> Error saving: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  };

  const handleBuild = async () => {
    setBuilding(true);
    setBuildOutput(['> Starting build...']);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/build-app`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          modifications: Object.entries(files).map(([name, file]) => ({
            path: file.path,
            content: file.content
          }))
        })
      });

      const result = await response.json();

      if (result.success) {
        setBuildOutput(prev => [
          ...prev,
          '> Build completed successfully',
          `> Bundle size: ${result.size}`,
          '> Ready to deploy'
        ]);
      } else {
        setBuildOutput(prev => [...prev, `> Build failed: ${result.error}`]);
      }
    } catch (error) {
      setBuildOutput(prev => [...prev, `> Build error: ${error.message}`]);
    } finally {
      setBuilding(false);
    }
  };

  const handleDeploy = async () => {
    setBuildOutput(prev => [...prev, '> Deploying to production...']);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-app`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();

      if (result.success) {
        setBuildOutput(prev => [
          ...prev,
          '✓ Deployed successfully',
          `> URL: ${result.url}`,
          '> Changes will be live in 1-2 minutes'
        ]);
      } else {
        setBuildOutput(prev => [...prev, `> Deploy failed: ${result.error}`]);
      }
    } catch (error) {
      setBuildOutput(prev => [...prev, `> Deploy error: ${error.message}`]);
    }
  };

  const handleLoadMore = async () => {
    try {
      const filesToLoad = [
        { name: 'Login.jsx', path: '/src/pages/Login.jsx' },
        { name: 'Projects.jsx', path: '/src/pages/Projects.jsx' },
        { name: 'Settings.jsx', path: '/src/pages/Settings.jsx' },
        { name: 'index.css', path: '/src/index.css' },
      ];

      const loadedFiles = { ...files };

      for (const file of filesToLoad) {
        try {
          const response = await fetch(file.path);
          const content = await response.text();
          const ext = file.name.split('.').pop();

          loadedFiles[file.name] = {
            content,
            language: ext === 'jsx' ? 'javascript' : ext === 'css' ? 'css' : 'javascript',
            path: file.path
          };
        } catch (err) {
          console.error(`Failed to load ${file.name}`);
        }
      }

      setFiles(loadedFiles);
      setBuildOutput(prev => [...prev, `> Loaded ${Object.keys(loadedFiles).length} files`]);
    } catch (error) {
      setBuildOutput(prev => [...prev, `> Error loading files: ${error.message}`]);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={styles.loadingText}>Loading DevMind source files...</p>
      </div>
    );
  }

  const currentFile = files[selectedFile];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Code2 size={24} style={{ marginRight: '12px', color: '#3b82f6' }} />
          <h2 style={styles.title}>Self Editor</h2>
          <span style={styles.subtitle}>Edit DevMind from within DevMind</span>
        </div>
        <div style={styles.headerActions}>
          <button onClick={handleLoadMore} style={styles.loadButton}>
            <FolderOpen size={18} />
            Load More Files
          </button>
          <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleBuild} disabled={building} style={styles.buildButton}>
            <RefreshCw size={18} />
            {building ? 'Building...' : 'Build'}
          </button>
          <button onClick={handleDeploy} style={styles.deployButton}>
            <Rocket size={18} />
            Deploy
          </button>
        </div>
      </div>

      {lastSaved && (
        <div style={styles.saveIndicator}>
          <CheckCircle size={16} />
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>APP FILES</span>
          </div>
          <div style={styles.fileList}>
            {Object.keys(files).map((fileName) => (
              <div
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                style={{
                  ...styles.fileItem,
                  background: selectedFile === fileName ? '#e0e7ff' : 'transparent',
                  color: selectedFile === fileName ? '#1e40af' : '#374151'
                }}
              >
                {fileName}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.editorSection}>
          <div style={styles.editorHeader}>
            <span style={styles.editorTitle}>{selectedFile}</span>
            <span style={styles.editorPath}>{currentFile?.path}</span>
          </div>
          <Editor
            height="100%"
            language={currentFile?.language || 'javascript'}
            value={currentFile?.content || ''}
            onChange={(value) => {
              setFiles(prev => ({
                ...prev,
                [selectedFile]: {
                  ...prev[selectedFile],
                  content: value || ''
                }
              }));
            }}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>

        <div style={styles.previewSection}>
          <div style={styles.previewHeader}>
            <span style={styles.previewTitle}>BUILD OUTPUT</span>
          </div>
          <div style={styles.terminal}>
            {buildOutput.map((line, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.terminalLine,
                  color: line.startsWith('✓') ? '#10b981' :
                         line.startsWith('>') ? '#06b6d4' : '#94a3b8'
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <div style={styles.tips}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>How it works:</strong> Edit files, save changes, build to test, then deploy to make changes live.
              Changes are saved to your modifications table and applied during build.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0f172a',
    overflow: 'hidden',
  },
  loading: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    background: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#f1f5f9',
    margin: 0,
    marginRight: '16px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  loadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#475569',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  buildButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  deployButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  saveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 24px',
    background: '#ecfdf5',
    color: '#059669',
    fontSize: '0.875rem',
    borderBottom: '1px solid #a7f3d0',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    background: '#1e293b',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #334155',
  },
  sidebarTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: '0.05em',
  },
  fileList: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 0',
  },
  fileItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background 0.15s',
  },
  editorSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#1e1e1e',
    overflow: 'hidden',
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#252526',
    borderBottom: '1px solid #1e1e1e',
  },
  editorTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  editorPath: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  previewSection: {
    width: '360px',
    display: 'flex',
    flexDirection: 'column',
    background: '#1e293b',
    borderLeft: '1px solid #334155',
  },
  previewHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #334155',
  },
  previewTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: '0.05em',
  },
  terminal: {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
  },
  terminalLine: {
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  tips: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: '#0f172a',
    borderTop: '1px solid #334155',
    fontSize: '0.75rem',
    color: '#cbd5e1',
    lineHeight: '1.5',
  },
};
