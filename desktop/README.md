# ShenoDev Desktop - Electron Wrapper

Tech: Electron 28 wrapping Next.js Web App at `http://localhost:3000`.

## Structure
- `main.js` - Frameless `BrowserWindow` (1280x800, `frame:false`, `#0F172A` background, `contextIsolation:true`)
- `preload.js` - Secure `contextBridge` exposing `window.desktopAPI` (minimize/maximize/close)
- `package.json` - `electron-builder` Windows NSIS config

## Scripts (Windows Executable)
```bash
npm install          # install electron + electron-builder
npm run dev          # start frameless window (requires web: cd ../web && npm run dev)
npm start            # same as dev
npm run pack         # quick unpacked build -> dist/win-unpacked/ShenoDev.exe (tested)
npm run build        # Windows NSIS installer -> dist/ShenoDev Setup 1.0.0.exe
npm run build:win    # explicit win x64
```

## Window Config
- Loads `process.env.ELECTRON_WEB_URL || http://localhost:3000`
- Frameless (`frame:false`, `titleBarStyle:hidden`), `backgroundColor #0F172A`, `show:false` until `ready-to-show`
- Security: `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`, `preload.js`
- Fallback error page if `localhost:3000` unreachable (prompts `cd web && npm run dev`)
- External links → `shell.openExternal`

## Build Verified
- `npx electron --version` 28.3.3
- `node --check main.js` 0
- `electron-builder --dir` → `dist/win-unpacked/ShenoDev.exe` 176MB (default icon, no `build/icon.ico` yet)
- `app.asar` 5.6kB (main+preload+package)

Backend API: `http://localhost:4000` (via web app)
