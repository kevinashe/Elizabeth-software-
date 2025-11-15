const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#f5f5f5',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('is-online', () => {
  return mainWindow.webContents.isOnline;
});

ipcMain.handle('save-local-data', async (event, key, data) => {
  try {
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'local-data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return { success: true };
  } catch (error) {
    console.error('Error saving local data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-local-data', async (event, key) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'local-data', `${key}.json`);

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }

    return { success: false, error: 'File not found' };
  } catch (error) {
    console.error('Error loading local data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-connection', async () => {
  try {
    const online = require('dns').resolve;
    return new Promise((resolve) => {
      online('google.com', (err) => {
        resolve(!err);
      });
    });
  } catch (error) {
    return false;
  }
});
