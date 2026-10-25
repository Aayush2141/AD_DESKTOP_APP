const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { initDb } = require('./db');
const { seedDatabase } = require('./db/seed');
const { registerIpcHandlers } = require('./ipc');

let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: 'PG Dissertation Management System - Ministry of AYUSH',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    show: false,
  });

  // Security CSP headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 ws://localhost:5173 https://fonts.googleapis.com https://fonts.gstatic.com data:;"
            : "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com data:;"
        ],
      },
    });
  });

  if (isDev && !process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // Fallback to built files if vite server is not up
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    console.log('[Main] App ready. Initializing database...');
    const db = initDb();

    // Check if seeded; if 0 dissertations, seed initial database automatically
    const count = db.prepare('SELECT COUNT(*) as count FROM dissertations').get().count;
    if (count === 0) {
      console.log('[Main] Database empty, performing auto-seed...');
      seedDatabase(db);
    }

    console.log('[Main] Registering IPC Handlers...');
    registerIpcHandlers();

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
