import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';
import { voiceAssistant } from '../utils/voiceAssistant';

export default function VoiceAssistant({ onCommand }) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [waveAnimation, setWaveAnimation] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      voiceAssistant.stopWakeWordDetection();
      voiceAssistant.stop();
    };
  }, []);

  const startVoiceMode = async () => {
    if (!voiceAssistant.isSupported()) {
      alert('Voice features are not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      setIsActive(true);
      setResponse('Say "Elizabeth" to activate me...');
      console.log('Voice mode activated, listening for wake word...');

      const started = voiceAssistant.startWakeWordDetection((wakeWord) => {
        console.log('Wake word detected:', wakeWord);
        setWaveAnimation(true);
        setTranscript('Elizabeth activated!');
        setIsSpeaking(true);
        setResponse("I'm ready! What do you need?");

        setTimeout(() => {
          setIsSpeaking(false);
          startCommandListening();
        }, 2500);
      });

      if (!started) {
        setResponse('Failed to start voice detection. Check browser console.');
      }
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Unable to access microphone. Please allow microphone access and try again.');
    }
  };

  const stopVoiceMode = () => {
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    setResponse('');
    setWaveAnimation(false);
    voiceAssistant.stopWakeWordDetection();
    voiceAssistant.stop();
  };

  const startCommandListening = () => {
    console.log('Starting command listening...');
    setIsListening(true);

    voiceAssistant.stopWakeWordDetection();
    voiceAssistant.recognition.continuous = false;

    setTimeout(() => {
      voiceAssistant.startListening(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal && text.trim()) {
            processCommand(text);
          }
        },
        (error) => {
          console.error('Command listening error:', error);
          setIsListening(false);
        }
      );
    }, 100);
  };

  const processCommand = async (command) => {
    setIsListening(false);
    setIsSpeaking(true);

    const lowerCommand = command.toLowerCase();

    let responseText = '';
    let actionResult = null;

    if (lowerCommand.includes('stop') || lowerCommand.includes('goodbye') || lowerCommand.includes('bye')) {
      responseText = "Goodbye! Say Elizabeth when you need me again.";
      voiceAssistant.speak(responseText, {
        onEnd: () => {
          setIsSpeaking(false);
          stopVoiceMode();
        }
      });
      return;
    }

    const isQuestion = lowerCommand.includes('can i') || lowerCommand.includes('can you') ||
                       lowerCommand.includes('how do i') || lowerCommand.includes('what') ||
                       lowerCommand.includes('would like') || lowerCommand.includes('want to') ||
                       lowerCommand.includes('?');

    const isConversational = lowerCommand.includes('conversation') || lowerCommand.includes('talk') ||
                            lowerCommand.includes('discuss') || lowerCommand.includes('tell me');

    if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
      responseText = "I can open projects, code editor, chat, team view, or settings. I can also create new projects. Just say commands like 'open projects' or 'create project'.";
    } else if (isConversational) {
      responseText = "I'm here to help! I can assist with navigation and actions. For a real conversation, try the AI chat feature. Say 'open chat' to start.";
    } else if (isQuestion && lowerCommand.includes('project')) {
      responseText = "Yes! I can help with projects. Say 'open projects' to view them, or 'create project' to make a new one. What would you like to do?";
    } else if (isQuestion && (lowerCommand.includes('code') || lowerCommand.includes('editor'))) {
      responseText = "Yes! I can open the code editor. Just say 'open code editor' or 'code editor'.";
    } else if (isQuestion && lowerCommand.includes('chat')) {
      responseText = "Yes! I can open the AI chat. Just say 'open chat' or 'chat'.";
    } else if ((lowerCommand.includes('open') || lowerCommand.includes('show') || lowerCommand.includes('go to')) && lowerCommand.includes('project')) {
      responseText = "Opening projects view for you.";
      actionResult = { action: 'navigate', target: 'projects' };
    } else if ((lowerCommand.includes('open') || lowerCommand.includes('show')) && (lowerCommand.includes('code') || lowerCommand.includes('editor'))) {
      responseText = "Opening the code editor.";
      actionResult = { action: 'navigate', target: 'code' };
    } else if ((lowerCommand.includes('open') || lowerCommand.includes('show')) && lowerCommand.includes('chat')) {
      responseText = "Opening AI chat.";
      actionResult = { action: 'navigate', target: 'chat' };
    } else if ((lowerCommand.includes('open') || lowerCommand.includes('show')) && lowerCommand.includes('team')) {
      responseText = "Opening team view.";
      actionResult = { action: 'navigate', target: 'team' };
    } else if ((lowerCommand.includes('open') || lowerCommand.includes('show')) && lowerCommand.includes('settings')) {
      responseText = "Opening settings.";
      actionResult = { action: 'navigate', target: 'settings' };
    } else if (lowerCommand.includes('create') && lowerCommand.includes('project')) {
      responseText = "Creating a new project for you.";
      actionResult = { action: 'create', target: 'project' };
    } else if (lowerCommand.includes('project') || lowerCommand.includes('code') || lowerCommand.includes('chat')) {
      responseText = "I can help with that! Try saying 'open projects', 'open code editor', or 'open chat' for specific actions.";
    } else {
      responseText = `I heard: ${command}. Try commands like 'open projects', 'open chat', 'code editor', or 'create project'.`;
    }

    setResponse(responseText);

    voiceAssistant.speak(responseText, {
      rate: 1.1,
      pitch: 1.0,
      onEnd: () => {
        setIsSpeaking(false);

        if (actionResult && onCommand) {
          onCommand(actionResult);
        }

        if (voiceAssistant.conversationActive) {
          setTimeout(() => {
            setTranscript('');
            startCommandListening();
          }, 500);
        } else {
          voiceAssistant.startWakeWordDetection((wakeWord) => {
            setTranscript('Elizabeth activated!');
            setIsSpeaking(true);
            setTimeout(() => {
              setIsSpeaking(false);
              startCommandListening();
            }, 2000);
          });
        }
      }
    });
  };

  useEffect(() => {
    if (waveAnimation) {
      animationRef.current = setInterval(() => {
        setWaveAnimation(prev => !prev);
      }, 1000);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [waveAnimation]);

  if (!isActive) {
    return (
      <button onClick={startVoiceMode} style={styles.floatingButton} title="Voice Assistant">
        <Radio size={24} />
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.assistant}>
        <div style={styles.header}>
          <h3 style={styles.title}>Elizabeth Voice Assistant</h3>
          <button onClick={stopVoiceMode} style={styles.closeButton}>
            <MicOff size={18} />
          </button>
        </div>

        <div style={styles.visualizer}>
          <div style={{
            ...styles.circle,
            transform: isListening || isSpeaking ? 'scale(1.2)' : 'scale(1)',
            background: isSpeaking
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : isListening
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          }}>
            {isSpeaking ? (
              <Volume2 size={40} color="white" />
            ) : isListening ? (
              <Mic size={40} color="white" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
            ) : (
              <Radio size={40} color="white" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            )}
          </div>

          {(isListening || isSpeaking) && (
            <div style={styles.waves}>
              <div style={{...styles.wave, animationDelay: '0s'}} />
              <div style={{...styles.wave, animationDelay: '0.3s'}} />
              <div style={{...styles.wave, animationDelay: '0.6s'}} />
            </div>
          )}
        </div>

        <div style={styles.status}>
          {isSpeaking && <span style={styles.statusBadge}>Speaking...</span>}
          {isListening && !isSpeaking && <span style={{...styles.statusBadge, background: '#3b82f6'}}>Listening...</span>}
          {!isListening && !isSpeaking && (
            <div>
              <span style={{...styles.statusBadge, background: '#6b7280'}}>
                👂 Listening for "Elizabeth"
              </span>
              <p style={styles.hint}>Try saying "Elizabeth" or "Hey Elizabeth"</p>
            </div>
          )}
        </div>

        {transcript && (
          <div style={styles.transcript}>
            <p style={styles.transcriptLabel}>I heard:</p>
            <p style={styles.transcriptText}>{transcript}</p>
            <p style={styles.hint}>Speak clearly and use simple commands</p>
          </div>
        )}

        {response && (
          <div style={styles.response}>
            <p style={styles.responseLabel}>Elizabeth:</p>
            <p style={styles.responseText}>{response}</p>
          </div>
        )}

        <div style={styles.tips}>
          <p style={styles.tipsTitle}>Try saying:</p>
          <ul style={styles.tipsList}>
            <li>"Elizabeth, open projects"</li>
            <li>"Elizabeth, show me the code editor"</li>
            <li>"Elizabeth, create a new project"</li>
            <li>"Elizabeth, what can you do?"</li>
            <li>"Elizabeth, goodbye"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  floatingButton: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
    transition: 'all 0.3s',
    zIndex: 999,
  },
  container: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 10000,
    animation: 'slideIn 0.3s ease-out',
  },
  assistant: {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    border: '1px solid #e5e7eb',
    minWidth: '380px',
    maxWidth: '500px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    minWidth: '36px',
    minHeight: '36px',
  },
  visualizer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: '200px',
    marginBottom: '20px',
  },
  circle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    zIndex: 2,
  },
  waves: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '3px solid #3b82f6',
    opacity: 0,
    animation: 'ripple 1.5s ease-out infinite',
  },
  status: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  statusBadge: {
    display: 'inline-block',
    background: '#10b981',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  transcript: {
    background: '#f3f4f6',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  transcriptLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
  },
  transcriptText: {
    fontSize: '16px',
    color: '#1f2937',
    margin: 0,
    lineHeight: '1.5',
  },
  response: {
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  responseLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
  },
  responseText: {
    fontSize: '16px',
    color: '#1f2937',
    margin: 0,
    lineHeight: '1.5',
  },
  tips: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
  },
  tipsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    margin: '0 0 12px 0',
  },
  tipsList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.8',
  },
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '8px',
    textAlign: 'center',
  },
};
