import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div style={styles.container}>
      <div style={styles.notification}>
        <div style={styles.content}>
          <RefreshCw size={20} color="#3b82f6" />
          <div>
            <h4 style={styles.title}>Update Available</h4>
            <p style={styles.description}>A new version is ready to install</p>
          </div>
        </div>
        <div style={styles.actions}>
          <button onClick={handleUpdate} style={styles.updateButton}>
            Update Now
          </button>
          <button onClick={() => setShowUpdate(false)} style={styles.closeButton}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 10000,
    animation: 'slideDown 0.3s ease-out',
  },
  notification: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    maxWidth: '400px',
    color: 'white',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: 'white',
  },
  description: {
    fontSize: '13px',
    margin: 0,
    opacity: 0.9,
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  updateButton: {
    flex: 1,
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
};
