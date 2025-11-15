import { createClient } from '@supabase/supabase-js';

const isElectron = typeof window !== 'undefined' && window.electron?.isElectron;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

export const storage = {
  async setItem(key, value) {
    try {
      const data = JSON.stringify(value);

      if (isElectron) {
        await window.electron.saveLocalData(key, value);
      }

      localStorage.setItem(key, data);
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  },

  async getItem(key) {
    try {
      if (isElectron) {
        const result = await window.electron.loadLocalData(key);
        if (result.success) {
          return result.data;
        }
      }

      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  async removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from storage:', error);
      return false;
    }
  },

  async clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};

export const offlineQueue = {
  async add(action) {
    const queue = await storage.getItem('offline-queue') || [];
    queue.push({
      ...action,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random()}`,
      retries: 0
    });
    await storage.setItem('offline-queue', queue);
  },

  async getAll() {
    return await storage.getItem('offline-queue') || [];
  },

  async remove(id) {
    const queue = await storage.getItem('offline-queue') || [];
    const updated = queue.filter(item => item.id !== id);
    await storage.setItem('offline-queue', updated);
  },

  async clear() {
    await storage.setItem('offline-queue', []);
  },

  async updateRetries(id, retries) {
    const queue = await storage.getItem('offline-queue') || [];
    const updated = queue.map(item =>
      item.id === id ? { ...item, retries } : item
    );
    await storage.setItem('offline-queue', updated);
  }
};

export async function isOnline() {
  if (isElectron && window.electron?.checkConnection) {
    return await window.electron.checkConnection();
  }
  return navigator.onLine;
}

export function setupOfflineSync(syncCallback) {
  let wasOffline = !navigator.onLine;
  let isSyncing = false;

  const checkAndSync = async () => {
    if (isSyncing) return;

    const online = await isOnline();

    if (online && wasOffline) {
      isSyncing = true;
      console.log('Back online - syncing queued actions...');

      try {
        const queue = await offlineQueue.getAll();

        if (queue.length > 0) {
          console.log(`Syncing ${queue.length} queued action(s)...`);

          for (const action of queue) {
            try {
              const result = await syncCallback(action);

              if (result && result.success) {
                await offlineQueue.remove(action.id);
                console.log(`✓ Synced action: ${action.type || 'unknown'}`);
              } else {
                console.error(`✗ Failed to sync action: ${action.id}`, result?.error);

                if (action.retries >= 3) {
                  await offlineQueue.remove(action.id);
                  console.warn(`Removed action after 3 failed retries: ${action.id}`);
                } else {
                  await offlineQueue.updateRetries(action.id, (action.retries || 0) + 1);
                }
              }
            } catch (error) {
              console.error('Error syncing action:', error);

              if (action.retries >= 3) {
                await offlineQueue.remove(action.id);
                console.warn(`Removed action after 3 failed retries: ${action.id}`);
              } else {
                await offlineQueue.updateRetries(action.id, (action.retries || 0) + 1);
              }
            }
          }

          const remainingQueue = await offlineQueue.getAll();
          if (remainingQueue.length === 0) {
            console.log('✓ All queued actions synced successfully!');
          } else {
            console.log(`${remainingQueue.length} action(s) remaining in queue`);
          }
        }
      } catch (error) {
        console.error('Error during sync process:', error);
      } finally {
        isSyncing = false;
      }
    }

    wasOffline = !online;
  };

  const handleOnline = () => {
    console.log('Network connection restored');
    checkAndSync();
  };

  const handleOffline = () => {
    console.log('Gone offline - changes will be queued');
    wasOffline = true;
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  const intervalId = setInterval(checkAndSync, 30000);

  checkAndSync();

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(intervalId);
  };
}

export async function queueOfflineAction(actionType, data) {
  const action = {
    type: actionType,
    data: data,
    timestamp: Date.now()
  };

  await offlineQueue.add(action);
  console.log(`Queued offline action: ${actionType}`);
  return action;
}
