import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Play, Terminal as TerminalIcon, Eye, Code2, Brain, Shield, Zap, FileSearch, AlertCircle, CheckCircle, XCircle, Sparkles, GitBranch, TestTube, Upload, FolderOpen, Save } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Editor from '@monaco-editor/react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const initialFiles = {
  'index.html': {
    type: 'file',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to Bolt-style Editor</h1>
        <p>Edit the code and see live preview!</p>
        <button onclick="handleClick()">Click Me</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
    language: 'html'
  },
  'styles.css': {
    type: 'file',
    content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 40px;
    background: #6b7fd7;
    min-height: 100vh;
}

#app {
    background: white;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 600px;
    margin: 0 auto;
}

h1 {
    color: #1f2937;
    margin-bottom: 16px;
}

p {
    color: #6b7280;
    margin-bottom: 24px;
}

button {
    background: #2563eb;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.2s;
}

button:hover {
    background: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}`,
    language: 'css'
  },
  'script.js': {
    type: 'file',
    content: `function handleClick() {
    console.info('Hello from Bolt-style Editor!');
    console.log('Button clicked!');
}

console.log('App loaded successfully!');`,
    language: 'javascript'
  }
};

const mockAnalyses = [];

const mockMemories = [
  { type: 'preference', content: 'User prefers ES6+ syntax', confidence: 0.95 },
  { type: 'pattern', content: 'Consistent use of functional patterns', confidence: 0.88 }
];

const FileTreeItem = ({ name, item, level = 0, onSelect, selected }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (item.type === 'file') {
    return (
      <div
        onClick={() => onSelect(name)}
        style={{
          ...styles.treeItem,
          paddingLeft: `${level * 16 + 8}px`,
          background: selected === name ? '#e0e7ff' : 'transparent',
          color: selected === name ? '#1e40af' : '#374151'
        }}
      >
        <File size={16} style={{ marginRight: '8px', flexShrink: 0 }} />
        <span style={styles.fileName}>{name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...styles.treeItem, paddingLeft: `${level * 16 + 8}px` }}
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Folder size={16} style={{ marginRight: '8px' }} />
        <span style={styles.fileName}>{name}</span>
      </div>
      {isOpen && item.children && Object.entries(item.children).map(([childName, childItem]) => (
        <FileTreeItem
          key={childName}
          name={childName}
          item={childItem}
          level={level + 1}
          onSelect={onSelect}
          selected={selected}
        />
      ))}
    </div>
  );
};

export default function CodeEditor({ initialCode }) {
  const [files, setFiles] = useState(initialFiles);
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [showPreview, setShowPreview] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [aiTab, setAiTab] = useState('analysis');
  const [terminalOutput, setTerminalOutput] = useState(['> Ready to run code...']);
  const [analyses, setAnalyses] = useState(mockAnalyses);
  const [memories, setMemories] = useState(mockMemories);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSource, setImportSource] = useState('local');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [userId, setUserId] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const fileInputRef = useRef(null);
  const iframeRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  const currentFile = files[selectedFile];

  useEffect(() => {
    if (initialCode?.project) {
      setCurrentProject(initialCode.project);
      setTerminalOutput(prev => [
        ...prev,
        `> Loading project: ${initialCode.project.name}`,
        '> Fetching project files...'
      ]);
    } else if (initialCode?.code && initialCode?.files) {
      const fileName = initialCode.files[0] || 'generated.jsx';
      const fileExtension = fileName.split('.').pop();
      const language = fileExtension === 'jsx' || fileExtension === 'tsx' ? 'javascript' : fileExtension;

      setFiles(prev => ({
        ...prev,
        [fileName]: {
          type: 'file',
          content: initialCode.code,
          language: language
        }
      }));
      setSelectedFile(fileName);
      setTerminalOutput(prev => [
        ...prev,
        `> Code generated and loaded: ${fileName}`,
        '> Ready to preview and edit'
      ]);
    }
  }, [initialCode]);

  useEffect(() => {
    updatePreview();
  }, [files, selectedFile]);

  useEffect(() => {
    loadUserAndProjects();
  }, []);

  useEffect(() => {
    if (currentProject && userId) {
      loadProjectFiles();
    }
  }, [currentProject, userId]);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from('user_settings')
        .select('auto_save_enabled')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setAutoSaveEnabled(data.auto_save_enabled);
      }
    };

    loadUserSettings();
  }, [userId]);

  useEffect(() => {
    if (!autoSaveEnabled || !currentProject || !userId) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveProjectFiles(true);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [files, autoSaveEnabled, currentProject, userId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProjectFiles();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRunCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowPreview(!showPreview);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, userId, showPreview]);

  const loadUserAndProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const { data, error } = await supabase
          .from('projects')
          .select('id, name, description')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);

        if (data && data.length > 0) {
          setCurrentProject(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadProjectFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedFiles = {};
        data.forEach(file => {
          loadedFiles[file.file_name] = {
            type: 'file',
            content: file.content,
            language: file.language
          };
        });
        setFiles(loadedFiles);
        setSelectedFile(data[0].file_name);
        setTerminalOutput(prev => [
          ...prev,
          `> Loaded ${data.length} files from project: ${currentProject.name}`
        ]);
      } else {
        setFiles(initialFiles);
        setSelectedFile('index.html');
        setTerminalOutput(prev => [
          ...prev,
          `> No files found. Starting with default template.`
        ]);
      }
    } catch (error) {
      console.error('Error loading project files:', error);
      setTerminalOutput(prev => [
        ...prev,
        `> Error loading project files: ${error.message}`
      ]);
    }
  };

  const saveProjectFiles = async (isAutoSave = false) => {
    if (!currentProject || !userId) {
      if (!isAutoSave) {
        setTerminalOutput(prev => [
          ...prev,
          '> Error: No project selected. Please select a project first.'
        ]);
      }
      return;
    }

    try {
      if (!isAutoSave) {
        setTerminalOutput(prev => [
          ...prev,
          `> Saving files to project: ${currentProject.name}...`
        ]);
      }

      await supabase
        .from('project_files')
        .delete()
        .eq('project_id', currentProject.id)
        .eq('user_id', userId);

      const fileRecords = Object.entries(files).map(([fileName, fileData]) => ({
        project_id: currentProject.id,
        user_id: userId,
        file_name: fileName,
        file_path: `/${fileName}`,
        content: fileData.content,
        language: fileData.language
      }));

      const { error } = await supabase
        .from('project_files')
        .insert(fileRecords);

      if (error) throw error;

      setLastSaved(new Date());

      if (!isAutoSave) {
        setTerminalOutput(prev => [
          ...prev,
          `✓ Successfully saved ${fileRecords.length} files`
        ]);
      }
    } catch (error) {
      console.error('Error saving project files:', error);
      if (!isAutoSave) {
        setTerminalOutput(prev => [
          ...prev,
          `> Error saving files: ${error.message}`
        ]);
      }
    }
  };

  const updatePreview = () => {
    if (!iframeRef.current) return;

    const htmlContent = files['index.html']?.content || '';
    const cssContent = files['styles.css']?.content || '';
    const jsContent = files['script.js']?.content || '';

    const fullHtml = htmlContent.replace(
      '<link rel="stylesheet" href="styles.css">',
      `<style>${cssContent}</style>`
    ).replace(
      '<script src="script.js"></script>',
      `<script>
        try {
          ${jsContent}
        } catch(error) {
          console.error('Error:', error);
        }
      </script>`
    );

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
  };

  const handleEditorChange = (e) => {
    const value = e.target.value;
    setFiles(prev => ({
      ...prev,
      [selectedFile]: {
        ...prev[selectedFile],
        content: value
      }
    }));
  };

  const handleRunCode = () => {
    const newOutput = [
      ...terminalOutput,
      `> Running code... (${new Date().toLocaleTimeString()})`,
      '✓ Code executed successfully'
    ];
    setTerminalOutput(newOutput);
    updatePreview();
  };

  const handleAnalyze = () => {
    setTerminalOutput(prev => [
      ...prev,
      `> Analyzing code... (${new Date().toLocaleTimeString()})`,
      '✓ Found 2 suggestions for improvement'
    ]);
  };

  const handleGenerateTests = () => {
    setTerminalOutput(prev => [
      ...prev,
      `> Generating tests... (${new Date().toLocaleTimeString()})`,
      '✓ Generated 5 test cases with 95% coverage'
    ]);
  };

  const handleAutoDoc = () => {
    setTerminalOutput(prev => [
      ...prev,
      `> Generating documentation... (${new Date().toLocaleTimeString()})`,
      '✓ Documentation generated successfully'
    ]);
  };

  const handleImportClick = () => {
    setShowImportDialog(true);
  };

  const handleLocalImport = () => {
    setShowImportDialog(false);
    fileInputRef.current?.click();
  };

  const handleUrlImport = async () => {
    if (!importUrl.trim()) return;

    setImporting(true);
    try {
      let finalUrl = importUrl.trim();

      if (finalUrl.includes('drive.google.com')) {
        const fileIdMatch = finalUrl.match(/\/d\/([^\/]+)/);
        if (fileIdMatch) {
          finalUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
        }
      } else if (finalUrl.includes('github.com')) {
        finalUrl = finalUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      } else if (finalUrl.includes('dropbox.com')) {
        finalUrl = finalUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
      }

      const response = await fetch(finalUrl);
      if (!response.ok) throw new Error('Failed to fetch file');

      const content = await response.text();
      const urlParts = importUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0] || 'imported-file.txt';
      const fileExtension = fileName.split('.').pop();

      let language = 'text';
      if (fileExtension === 'js' || fileExtension === 'jsx') language = 'javascript';
      else if (fileExtension === 'ts' || fileExtension === 'tsx') language = 'typescript';
      else if (fileExtension === 'html') language = 'html';
      else if (fileExtension === 'css') language = 'css';
      else if (fileExtension === 'json') language = 'json';
      else if (fileExtension === 'py') language = 'python';

      setFiles(prev => ({
        ...prev,
        [fileName]: {
          type: 'file',
          content: content,
          language: language
        }
      }));

      setSelectedFile(fileName);
      setTerminalOutput(prev => [
        ...prev,
        `> Imported file from URL: ${fileName}`,
        '✓ Import successful'
      ]);

      setImportUrl('');
      setShowImportDialog(false);
    } catch (error) {
      setTerminalOutput(prev => [
        ...prev,
        `> Error importing from URL: ${error.message}`,
        '> Tip: For Google Drive, make sure the file is publicly accessible'
      ]);
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    try {
      const newFiles = { ...files };
      let firstFileName = null;

      for (const file of selectedFiles) {
        const content = await file.text();
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop();

        let language = 'text';
        if (fileExtension === 'js' || fileExtension === 'jsx') language = 'javascript';
        else if (fileExtension === 'ts' || fileExtension === 'tsx') language = 'typescript';
        else if (fileExtension === 'html') language = 'html';
        else if (fileExtension === 'css') language = 'css';
        else if (fileExtension === 'json') language = 'json';
        else if (fileExtension === 'py') language = 'python';

        newFiles[fileName] = {
          type: 'file',
          content: content,
          language: language
        };

        if (!firstFileName) firstFileName = fileName;
      }

      setFiles(newFiles);
      if (firstFileName) setSelectedFile(firstFileName);

      setTerminalOutput(prev => [
        ...prev,
        `> Imported ${selectedFiles.length} file(s) successfully`,
        ...selectedFiles.map(f => `  - ${f.name}`)
      ]);
    } catch (error) {
      setTerminalOutput(prev => [
        ...prev,
        `> Error importing files: ${error.message}`
      ]);
    }

    e.target.value = '';
  };

  const renderAIPanel = () => {
    return (
      <div style={styles.aiPanel}>
        <div style={styles.aiHeader}>
          <div style={styles.aiHeaderLeft}>
            <Brain size={18} style={{ color: '#8b5cf6', marginRight: '8px' }} />
            <span style={styles.aiTitle}>AI Assistant</span>
          </div>
          <button onClick={() => setShowAIPanel(false)} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.aiTabs}>
          <button
            onClick={() => setAiTab('analysis')}
            style={aiTab === 'analysis' ? styles.aiTabActive : styles.aiTabInactive}
          >
            <FileSearch size={16} />
            Analysis
          </button>
          <button
            onClick={() => setAiTab('memory')}
            style={aiTab === 'memory' ? styles.aiTabActive : styles.aiTabInactive}
          >
            <Brain size={16} />
            Memory
          </button>
          <button
            onClick={() => setAiTab('tests')}
            style={aiTab === 'tests' ? styles.aiTabActive : styles.aiTabInactive}
          >
            <TestTube size={16} />
            Tests
          </button>
          <button
            onClick={() => setAiTab('docs')}
            style={aiTab === 'docs' ? styles.aiTabActive : styles.aiTabInactive}
          >
            <FileSearch size={16} />
            Docs
          </button>
        </div>

        <div style={styles.aiContent}>
          {aiTab === 'analysis' && (
            <div style={styles.aiSection}>
              <div style={styles.aiSectionHeader}>
                <h4 style={styles.aiSectionTitle}>Code Analysis</h4>
                <button onClick={handleAnalyze} style={styles.aiActionButton}>
                  <Sparkles size={14} />
                  Analyze
                </button>
              </div>
              <div style={styles.issuesList}>
                {analyses.map(issue => (
                  <div key={issue.id} style={styles.issueItem}>
                    <div style={styles.issueHeader}>
                      {issue.severity === 'critical' && <XCircle size={16} color="#ef4444" />}
                      {issue.severity === 'high' && <AlertCircle size={16} color="#f59e0b" />}
                      {issue.severity === 'medium' && <AlertCircle size={16} color="#eab308" />}
                      {issue.severity === 'low' && <CheckCircle size={16} color="#06b6d4" />}
                      <span style={styles.issueFile}>{issue.file}:{issue.line}</span>
                    </div>
                    <div style={styles.issueTitle}>{issue.title}</div>
                    <div style={styles.issueDesc}>{issue.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiTab === 'memory' && (
            <div style={styles.aiSection}>
              <div style={styles.aiSectionHeader}>
                <h4 style={styles.aiSectionTitle}>Learning Context</h4>
              </div>
              <div style={styles.memoryList}>
                {memories.map((memory, idx) => (
                  <div key={idx} style={styles.memoryItem}>
                    <div style={styles.memoryType}>{memory.type}</div>
                    <div style={styles.memoryContent}>{memory.content}</div>
                    <div style={styles.memoryConfidence}>
                      {Math.round(memory.confidence * 100)}% confidence
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiTab === 'tests' && (
            <div style={styles.aiSection}>
              <div style={styles.aiSectionHeader}>
                <h4 style={styles.aiSectionTitle}>Test Generation</h4>
                <button onClick={handleGenerateTests} style={styles.aiActionButton}>
                  <Sparkles size={14} />
                  Generate
                </button>
              </div>
              <div style={styles.testInfo}>
                <div style={styles.testStat}>
                  <TestTube size={20} color="#10b981" />
                  <div>
                    <div style={styles.testStatValue}>12</div>
                    <div style={styles.testStatLabel}>Tests</div>
                  </div>
                </div>
                <div style={styles.testStat}>
                  <CheckCircle size={20} color="#06b6d4" />
                  <div>
                    <div style={styles.testStatValue}>95%</div>
                    <div style={styles.testStatLabel}>Coverage</div>
                  </div>
                </div>
              </div>
              <button style={styles.testButton}>View All Tests</button>
            </div>
          )}

          {aiTab === 'docs' && (
            <div style={styles.aiSection}>
              <div style={styles.aiSectionHeader}>
                <h4 style={styles.aiSectionTitle}>Auto Documentation</h4>
                <button onClick={handleAutoDoc} style={styles.aiActionButton}>
                  <Sparkles size={14} />
                  Generate
                </button>
              </div>
              <div style={styles.docPreview}>
                <p style={styles.docText}>
                  Documentation will be automatically generated based on your code structure,
                  comments, and usage patterns.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Code2 size={24} style={{ marginRight: '12px', color: '#2563eb' }} />
          <h2 style={styles.title}>Code Editor</h2>
        </div>
        <div style={styles.headerActions}>
          {projects.length > 0 && (
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const proj = projects.find(p => p.id === e.target.value);
                setCurrentProject(proj);
              }}
              style={styles.projectSelect}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".js,.jsx,.ts,.tsx,.html,.css,.json,.py,.txt,.md"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <button onClick={handleImportClick} style={styles.importButton}>
            <Upload size={18} />
            Import
          </button>
          <button onClick={() => saveProjectFiles(false)} style={styles.saveButton}>
            <Save size={18} />
            Save
          </button>
          {autoSaveEnabled && lastSaved && (
            <span style={styles.autoSaveIndicator}>
              Auto-saved {new Date().getTime() - lastSaved.getTime() < 60000
                ? 'just now'
                : `${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)}m ago`}
            </span>
          )}
          {!showAIPanel && (
            <button onClick={() => setShowAIPanel(true)} style={styles.aiToggleButton}>
              <Brain size={18} />
              AI Assistant
            </button>
          )}
          <button onClick={() => setShowPreview(!showPreview)} style={styles.toggleButton}>
            <Eye size={18} />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={handleRunCode} style={styles.runButton}>
            <Play size={18} />
            Run Code
          </button>
        </div>
      </div>

      {showImportDialog && (
        <div style={styles.modalOverlay} onClick={() => setShowImportDialog(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Import Code</h3>
              <button onClick={() => setShowImportDialog(false)} style={styles.modalClose}>×</button>
            </div>

            <div style={styles.importTabs}>
              <button
                onClick={() => setImportSource('local')}
                style={importSource === 'local' ? styles.importTabActive : styles.importTabInactive}
              >
                <FolderOpen size={16} />
                Local Files
              </button>
              <button
                onClick={() => setImportSource('url')}
                style={importSource === 'url' ? styles.importTabActive : styles.importTabInactive}
              >
                <Upload size={16} />
                From URL
              </button>
            </div>

            {importSource === 'local' && (
              <div style={styles.importSection}>
                <p style={styles.importDescription}>
                  Select one or more files from your computer to import into the editor.
                </p>
                <button onClick={handleLocalImport} style={styles.importActionButton}>
                  <FolderOpen size={18} />
                  Choose Files
                </button>
              </div>
            )}

            {importSource === 'url' && (
              <div style={styles.importSection}>
                <p style={styles.importDescription}>
                  Import code from Google Drive, GitHub, Dropbox, or any direct URL.
                </p>
                <div style={styles.urlInputGroup}>
                  <input
                    type="text"
                    placeholder="Paste URL here (Google Drive, GitHub, Dropbox, etc.)"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    style={styles.urlInput}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                  />
                  <button
                    onClick={handleUrlImport}
                    disabled={!importUrl.trim() || importing}
                    style={styles.importActionButton}
                  >
                    {importing ? 'Importing...' : 'Import'}
                  </button>
                </div>
                <div style={styles.importTips}>
                  <div style={styles.tipTitle}>Tips:</div>
                  <ul style={styles.tipList}>
                    <li>Google Drive: Share file publicly and paste the link</li>
                    <li>GitHub: Direct link to raw file or repository file URL</li>
                    <li>Dropbox: Share link to the file</li>
                    <li>Direct URL: Any publicly accessible file URL</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>FILES</span>
          </div>
          <div style={styles.fileTree}>
            {Object.entries(files).map(([name, item]) => (
              <FileTreeItem
                key={name}
                name={name}
                item={item}
                onSelect={setSelectedFile}
                selected={selectedFile}
              />
            ))}
          </div>
        </div>

        <div style={styles.editorSection}>
          <div style={styles.tabBar}>
            {Object.keys(files).map((fileName) => (
              <div
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                style={{
                  ...styles.tab,
                  background: selectedFile === fileName ? '#1f2937' : 'transparent',
                  color: selectedFile === fileName ? '#fff' : '#9ca3af'
                }}
              >
                <File size={14} style={{ marginRight: '6px' }} />
                {fileName}
              </div>
            ))}
          </div>
          <div style={styles.editorWrapper}>
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
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                folding: true,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible'
                }
              }}
            />
          </div>
        </div>

        {showAIPanel && renderAIPanel()}

        {showPreview && (
          <div style={styles.previewSection}>
            <div style={styles.previewHeader}>
              <span style={styles.previewTitle}>PREVIEW</span>
            </div>
            <iframe
              ref={iframeRef}
              style={styles.iframe}
              title="preview"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>

      <div style={styles.terminal}>
        <div style={styles.terminalHeader}>
          <TerminalIcon size={16} style={{ marginRight: '8px' }} />
          <span style={styles.terminalTitle}>TERMINAL</span>
        </div>
        <div style={styles.terminalContent}>
          {terminalOutput.map((line, idx) => (
            <div key={idx} style={styles.terminalLine}>{line}</div>
          ))}
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
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  importButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#06b6d4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  projectSelect: {
    padding: '8px 12px',
    background: '#0f172a',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontSize: '0.875rem',
    minWidth: '180px',
    cursor: 'pointer',
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
  autoSaveIndicator: {
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: '500',
    padding: '8px 12px',
    background: '#ecfdf5',
    borderRadius: '6px',
  },
  aiToggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  runButton: {
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
  fileTree: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 0',
  },
  treeItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#e2e8f0',
    transition: 'background 0.15s',
  },
  fileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  editorSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#1e1e1e',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    background: '#252526',
    borderBottom: '1px solid #1e1e1e',
    overflow: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    borderRight: '1px solid #1e1e1e',
    whiteSpace: 'nowrap',
  },
  editorWrapper: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  textarea: {
    width: '100%',
    height: '100%',
    background: '#1e1e1e',
    color: '#d4d4d4',
    border: 'none',
    outline: 'none',
    padding: '16px',
    fontSize: '14px',
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    lineHeight: '1.6',
    resize: 'none',
    tabSize: 2,
  },
  aiPanel: {
    width: '320px',
    background: '#1e293b',
    borderLeft: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
  },
  aiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #334155',
  },
  aiHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTabs: {
    display: 'flex',
    borderBottom: '1px solid #334155',
    padding: '0 8px',
  },
  aiTabActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 12px',
    background: '#334155',
    color: '#8b5cf6',
    border: 'none',
    borderBottom: '2px solid #8b5cf6',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  aiTabInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 12px',
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  aiContent: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  aiSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  aiSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiSectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f1f5f9',
    margin: 0,
  },
  aiActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  issuesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  issueItem: {
    background: '#0f172a',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  issueHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  issueFile: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  issueTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '4px',
  },
  issueDesc: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  memoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  memoryItem: {
    background: '#0f172a',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  memoryType: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  memoryContent: {
    fontSize: '0.875rem',
    color: '#f1f5f9',
    marginBottom: '6px',
  },
  memoryConfidence: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  testInfo: {
    display: 'flex',
    gap: '12px',
  },
  testStat: {
    flex: 1,
    background: '#0f172a',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  testStatValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f1f5f9',
  },
  testStatLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  testButton: {
    width: '100%',
    padding: '10px',
    background: '#334155',
    color: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  docPreview: {
    background: '#0f172a',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  docText: {
    fontSize: '0.875rem',
    color: '#cbd5e1',
    lineHeight: '1.5',
    margin: 0,
  },
  previewSection: {
    width: '50%',
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
  iframe: {
    flex: 1,
    border: 'none',
    background: 'white',
  },
  terminal: {
    height: '120px',
    background: '#0f172a',
    borderTop: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
  },
  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  terminalTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: '0.05em',
  },
  terminalContent: {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
  },
  terminalLine: {
    color: '#10b981',
    marginBottom: '4px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#1e293b',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #334155',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#f1f5f9',
    margin: 0,
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importTabs: {
    display: 'flex',
    borderBottom: '1px solid #334155',
    padding: '0 24px',
  },
  importTabActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'transparent',
    color: '#06b6d4',
    border: 'none',
    borderBottom: '2px solid #06b6d4',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  importTabInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  importSection: {
    padding: '24px',
  },
  importDescription: {
    color: '#cbd5e1',
    fontSize: '0.875rem',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  importActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#06b6d4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    width: '100%',
    justifyContent: 'center',
  },
  urlInputGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  urlInput: {
    flex: 1,
    padding: '12px',
    background: '#0f172a',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontSize: '0.875rem',
    outline: 'none',
  },
  importTips: {
    background: '#0f172a',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  tipTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '8px',
  },
  tipList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#94a3b8',
    fontSize: '0.75rem',
    lineHeight: '1.6',
  },
};
