import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudOff, Cloud } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification && isOnline) return null;

  return (
    <div style={{
      ...styles.container,
      background: isOnline ? '#10b981' : '#ef4444'
    }}>
      {isOnline ? <Cloud size={16} /> : <CloudOff size={16} />}
      <span style={styles.text}>
        {isOnline ? 'Back online - syncing data...' : 'Offline mode - changes will sync when online'}
      </span>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    color: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontSize: '0.875rem',
    fontWeight: '600',
    zIndex: 10000,
    animation: 'slideIn 0.3s ease-out'
  },
  text: {
    marginRight: '8px'
  }
};
