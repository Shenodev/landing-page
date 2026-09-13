const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

// Keep window reference to prevent GC
let mainWindow = null;
// Future-proof: uses NEXT_PUBLIC_API_URL pattern - switches localhost:3000 <-> https://shenodev.tech
const WEB_URL = process.env.ELECTRON_WEB_URL || (process.env.NODE_ENV === 'production' ? 'https://shenodev.dpdns.org' : 'http://localhost:3000');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0F172A',
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 },
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/Logo Icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      scrollBounce: false
    }
  });

  // Graceful show to avoid flash
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  // Security: open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const allowedOrigin = new URL(WEB_URL).origin;
    try {
      const target = new URL(url);
      if (target.origin === allowedOrigin) {
        return { action: 'allow' };
      }
    } catch {
      // invalid url -> deny
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle navigation failures (Next.js not running)
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL === WEB_URL && mainWindow) {
      console.error(`[desktop] Failed to load ${WEB_URL}: ${errorCode} ${errorDescription}`);
      // Show fallback error page inline
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <html style="background:#0F172A;color:#F8FAFC;font-family:system-ui;padding:40px;">
          <h1 style="color:#06B6D4;">ShenoDev Desktop</h1>
          <p>Could not connect to <code>${WEB_URL}</code></p>
          <p>Ensure Next.js web app is running:</p>
          <pre style="background:#1E293B;padding:12px;border-radius:8px;">cd web && npm run dev</pre>
          <p style="color:#94A3B8;font-size:13px;">Error ${errorCode}: ${errorDescription}</p>
          <button onclick="location.reload()" style="margin-top:16px;background:#06B6D4;color:#003640;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;">Retry</button>
        </html>
      `)}`);
    }
  });

  mainWindow.loadURL(WEB_URL);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Frameless window controls via IPC (minimize / maximize / close)
ipcMain.on('window-control', (_event, action) => {
  if (!mainWindow) return;
  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
      break;
    case 'close':
      mainWindow.close();
      break;
    default:
      console.warn(`[desktop] Unknown window-control: ${action}`);
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Security: prevent new windows via app
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsed = new URL(navigationUrl);
    const allowed = new URL(WEB_URL);
    if (parsed.origin !== allowed.origin) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
});

// Production: global promise & exception handling (senior standard)
process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error('[desktop] Unhandled Rejection:', msg);
  // Exit so process manager (PM2/Render) can restart cleanly
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('[desktop] Uncaught Exception:', err.message, err.stack);
});
