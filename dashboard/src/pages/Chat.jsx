import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Terminal, Code2, Sparkles, Copy, Check, Download, Trash2, MessageSquare, FolderOpen, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Chat({ onCodeGenerated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userId, setUserId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (userId && userId !== 'anonymous') {
      loadProjects();
    }
  }, [userId]);

  useEffect(() => {
    if (currentProject) {
      loadProjectChat();
    }
  }, [currentProject]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadProjectChat = async () => {
    if (!currentProject) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages = data.map(msg => ({
          role: msg.role,
          content: msg.content,
          code: msg.code,
          files: msg.files,
          timestamp: msg.created_at
        }));
        setMessages(loadedMessages);
      } else {
        setMessages([{
          role: 'assistant',
          content: `>> PROJECT: ${currentProject.name}\n>> TACTICAL COMMAND INTERFACE ONLINE\n>> Ready to generate code for this project. What would you like to build?`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error loading project chat:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserId('anonymous');
        setMessages([{
          role: 'assistant',
          content: '>> TACTICAL COMMAND INTERFACE ONLINE\n>> Ready to generate code. Try: "create a shopping website" or "help"',
          timestamp: new Date().toISOString()
        }]);
        setLoadingHistory(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages = data.map(msg => ({
          role: msg.role,
          content: msg.content,
          code: msg.code,
          files: msg.files,
          timestamp: msg.created_at
        }));
        setMessages(loadedMessages);
      } else {
        setMessages([{
          role: 'assistant',
          content: '>> TACTICAL COMMAND INTERFACE ONLINE\n>> Ready to generate code. Create a project or start chatting!',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([{
        role: 'assistant',
        content: '>> TACTICAL COMMAND INTERFACE ONLINE\n>> Ready to generate code. Try: "create a shopping website" or "help"',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveMessage = async (message) => {
    if (!userId || userId === 'anonymous') return;

    try {
      await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          role: message.role,
          content: message.content,
          code: message.code || null,
          files: message.files || null
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();

    const cleanText = text.replace(/>>|```[\w]*|[*#]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(voice =>
      voice.name.includes('Female') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Victoria') ||
      voice.name.includes('Google US English') && voice.name.includes('2') ||
      voice.name.includes('Microsoft Zira') ||
      voice.name.includes('Karen') ||
      voice.name.includes('Moira')
    );

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);

    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          timestamp: new Date().toISOString(),
          userId: userId !== 'anonymous' ? userId : undefined
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        code: data.code,
        files: data.files,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);

      if (voiceEnabled && data.response) {
        speakText(data.response);
      }

      if (data.code && onCodeGenerated) {
        onCodeGenerated(data.code, data.files);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: '>> SYSTEM ERROR\n>> Failed to process command',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(idx);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadCode = (code, filename) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearChat = async () => {
    const confirmed = window.confirm(
      '🗑️ Clear Chat History?\n\n' +
      'This will permanently delete all messages in this conversation.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    if (userId && userId !== 'anonymous') {
      try {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error clearing messages:', error);
        alert('Failed to clear chat history. Please try again.');
        return;
      }
    }

    setMessages([{
      role: 'assistant',
      content: '>> TACTICAL COMMAND INTERFACE ONLINE\n>> Ready to generate code. Try: "create a shopping website" or "help"',
      timestamp: new Date().toISOString()
    }]);
  };

  const quickCommands = [
    { text: 'Create a shopping website', icon: '🛍️' },
    { text: 'Build REST API with authentication', icon: '🔐' },
    { text: 'Create React dashboard', icon: '📊' },
    { text: 'Generate TypeScript types', icon: '📝' },
    { text: 'Write unit tests', icon: '🧪' },
    { text: 'Optimize performance', icon: '⚡' }
  ];

  if (loadingHistory) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
          <p style={{ color: '#94a3b8', marginTop: '16px' }}>Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Terminal size={24} style={{ color: '#10b981', marginRight: '12px' }} />
          <div>
            <h2 style={styles.title}>AI Command Interface</h2>
            <p style={styles.subtitle}>Advanced code generation with context awareness</p>
          </div>
        </div>
        <div style={styles.headerRight}>
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
          <button onClick={handleClearChat} style={styles.clearButton} title="Clear chat history">
            <Trash2 size={18} />
            Clear
          </button>
          <div style={styles.statusBadge}>
            <div style={styles.statusDot}></div>
            ONLINE
          </div>
        </div>
      </div>

      <div style={styles.chatContainer}>
        <div style={styles.messages}>
          {messages.map((message, idx) => (
            <div
              key={idx}
              style={{
                ...styles.message,
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={styles.messageHeader}>
                {message.role === 'assistant' ? (
                  <Bot size={16} style={{ color: '#10b981' }} />
                ) : (
                  <User size={16} style={{ color: '#2563eb' }} />
                )}
                <span style={styles.messageRole}>
                  {message.role === 'assistant' ? 'AI' : 'You'}
                </span>
                <span style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={{
                ...styles.messageContent,
                background: message.role === 'user' ? '#2563eb' : '#1e293b',
                color: '#f1f5f9'
              }}>
                <pre style={styles.messageText}>{message.content}</pre>
                {message.code && (
                  <div style={styles.codeBlock}>
                    <div style={styles.codeHeader}>
                      <div style={styles.codeHeaderLeft}>
                        <Code2 size={14} />
                        <span>Generated Code</span>
                      </div>
                      <div style={styles.codeActions}>
                        {onCodeGenerated && (
                          <button
                            onClick={() => onCodeGenerated(message.code, message.files)}
                            style={styles.viewInEditorButton}
                            title="View in Code Editor"
                          >
                            <Code2 size={14} />
                            Open in Editor
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyCode(message.code, idx)}
                          style={styles.codeActionButton}
                          title="Copy code"
                        >
                          {copiedCode === idx ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => handleDownloadCode(message.code, message.files?.[0])}
                          style={styles.codeActionButton}
                          title="Download code"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                    <pre style={styles.codeContent}>{message.code}</pre>
                  </div>
                )}
                {message.files && message.files.length > 0 && (
                  <div style={styles.filesSection}>
                    <span style={styles.filesLabel}>Files:</span>
                    {message.files.map((file, i) => (
                      <span key={i} style={styles.fileTag}>{file}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{...styles.message, alignSelf: 'flex-start'}}>
              <div style={styles.messageHeader}>
                <Bot size={16} style={{ color: '#10b981' }} />
                <span style={styles.messageRole}>AI</span>
              </div>
              <div style={{...styles.messageContent, background: '#1e293b'}}>
                <div style={styles.loadingDots}>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
                  <span style={{ color: '#94a3b8', marginLeft: '12px' }}>Processing command...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && (
          <div style={styles.quickCommands}>
            <div style={styles.quickCommandsHeader}>
              <Sparkles size={16} style={{ color: '#10b981' }} />
              <span style={styles.quickCommandsTitle}>Quick Start</span>
            </div>
            <div style={styles.quickCommandsGrid}>
              {quickCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(cmd.text)}
                  style={styles.quickButton}
                  disabled={loading}
                >
                  <span style={styles.quickButtonIcon}>{cmd.icon}</span>
                  <span style={styles.quickButtonText}>{cmd.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.inputForm}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type or speak your command..."}
              style={{...styles.input, borderColor: isListening ? '#10b981' : '#334155'}}
              disabled={loading}
            />
            <div style={styles.voiceControls}>
              <button
                type="button"
                onClick={toggleVoice}
                style={{
                  ...styles.voiceButton,
                  background: voiceEnabled ? '#10b981' : '#64748b'
                }}
                title={voiceEnabled ? "Voice responses enabled" : "Voice responses disabled"}
              >
                {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                style={{
                  ...styles.micButton,
                  background: isListening ? '#ef4444' : '#10b981',
                  animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none'
                }}
                disabled={loading}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" style={styles.sendButton} disabled={loading || !input.trim()}>
            <Send size={20} />
          </button>
        </form>
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
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: '4px 0 0 0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: '#10b98120',
    border: '1px solid #10b981',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#10b981',
    letterSpacing: '0.05em',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    background: '#10b981',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    marginBottom: '16px',
    paddingRight: '8px',
  },
  message: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '80%',
    gap: '8px',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingLeft: '4px',
  },
  messageRole: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  messageTime: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  messageContent: {
    padding: '16px',
    borderRadius: '12px',
    fontSize: '0.875rem',
    lineHeight: '1.5',
  },
  messageText: {
    margin: 0,
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  codeBlock: {
    marginTop: '12px',
    background: '#0f172a',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #334155',
  },
  codeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
  },
  codeHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  codeActions: {
    display: 'flex',
    gap: '8px',
  },
  viewInEditorButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  codeActionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  codeContent: {
    margin: 0,
    padding: '12px',
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontSize: '0.8rem',
    lineHeight: '1.5',
    color: '#e2e8f0',
    overflowX: 'auto',
  },
  filesSection: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
    alignItems: 'center',
  },
  filesLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  fileTag: {
    padding: '4px 8px',
    background: '#334155',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#cbd5e1',
    fontFamily: 'monospace',
  },
  loadingDots: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
  },
  quickCommands: {
    marginBottom: '16px',
    padding: '20px',
    background: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  quickCommandsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  quickCommandsTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f1f5f9',
    letterSpacing: '0.05em',
  },
  quickCommandsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  },
  quickButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  quickButtonIcon: {
    fontSize: '1.5rem',
  },
  quickButtonText: {
    flex: 1,
  },
  inputForm: {
    display: 'flex',
    gap: '12px',
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '14px 140px 14px 20px',
    background: '#1e293b',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f1f5f9',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  voiceControls: {
    position: 'absolute',
    right: '12px',
    display: 'flex',
    gap: '8px',
  },
  voiceButton: {
    padding: '8px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  micButton: {
    padding: '10px 14px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  sendButton: {
    padding: '14px 20px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
};
