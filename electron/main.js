import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import updaterPkg from 'electron-updater';
const { autoUpdater } = updaterPkg;
import { setupAutoUpdater } from './updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// ── Window State Persistence ────────────────────────────────────────────────
const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return { width: 1280, height: 800, x: undefined, y: undefined };
}

function saveWindowState(win) {
  try {
    const bounds = win.getBounds();
    writeFileSync(STATE_FILE, JSON.stringify(bounds));
  } catch (e) {}
}

// ── Native macOS Menu ───────────────────────────────────────────────────────
function createMenu() {
  const template = [
    {
      label: 'Inefable',
      submenu: [
        { label: 'Acerca de Inefable', role: 'about' },
        { type: 'separator' },
        { label: 'Buscar actualizaciones...', click: async () => {
          if (!mainWindow) return;
          const { version } = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Buscando actualizaciones',
            message: 'Verificando actualizaciones...',
            detail: `Versión actual: ${version}`,
            buttons: [],
            noLink: true
          });
          try {
            const result = await autoUpdater.checkForUpdates();
            if (!result || !result.updateInfo) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Inefable está actualizado',
                message: '✓ Tu aplicación está al día',
                detail: `Versión actual: ${version}\nNo hay actualizaciones disponibles en este momento.`,
                buttons: ['Aceptar']
              });
            }
          } catch (err) {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Inefable está actualizado',
              message: '✓ Tu aplicación está al día',
              detail: `Versión actual: ${version}\nNo se encontraron actualizaciones disponibles.`,
              buttons: ['Aceptar']
            });
          }
        }},
        { type: 'separator' },
        { label: 'Ocultar Inefable', role: 'hide' },
        { label: 'Ocultar otras', role: 'hideOthers' },
        { label: 'Mostrar todo', role: 'unhide' },
        { type: 'separator' },
        { label: 'Salir de Inefable', role: 'quit', accelerator: 'Cmd+Q' }
      ]
    },
    {
      label: 'Edición',
      submenu: [
        { label: 'Deshacer', role: 'undo', accelerator: 'Cmd+Z' },
        { label: 'Rehacer', role: 'redo', accelerator: 'Shift+Cmd+Z' },
        { type: 'separator' },
        { label: 'Cortar', role: 'cut', accelerator: 'Cmd+X' },
        { label: 'Copiar', role: 'copy', accelerator: 'Cmd+C' },
        { label: 'Pegar', role: 'paste', accelerator: 'Cmd+V' },
        { label: 'Seleccionar todo', role: 'selectAll', accelerator: 'Cmd+A' }
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { label: 'Recargar', role: 'reload', accelerator: 'Cmd+R' },
        { label: 'Forzar recarga', role: 'forceReload', accelerator: 'Shift+Cmd+R' },
        { type: 'separator' },
        { label: 'Pantalla completa', role: 'togglefullscreen', accelerator: 'Cmd+Ctrl+F' },
        { label: 'Zoom +', role: 'zoomIn', accelerator: 'Cmd+=' },
        { label: 'Zoom -', role: 'zoomOut', accelerator: 'Cmd+-' },
        { label: 'Tamaño real', role: 'resetZoom', accelerator: 'Cmd+0' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { label: 'Minimizar', role: 'minimize', accelerator: 'Cmd+M' },
        { label: 'Zoom', role: 'zoom' },
        { type: 'separator' },
        { label: 'Traer todo al frente', role: 'front' }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ── Main Window ─────────────────────────────────────────────────────────────
function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width || 1280,
    height: state.height || 800,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    icon: path.join(__dirname, '../public/isologo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Guardar estado al cerrar
  mainWindow.on('close', () => saveWindowState(mainWindow));

  // Google OAuth: allow popups to open within Electron (react-oauth/google uses postMessage)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('https://accounts.google.com') || 
        url.startsWith('https://oauth2.googleapis.com')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  const logPath = path.join(app.getPath('userData'), 'renderer_errors.log');
  mainWindow.webContents.on('console-message', async (event, level, message, line, sourceId) => {
    try {
      await fs.appendFile(logPath, `[Console Level ${level}] ${message} (${sourceId}:${line})\n`);
    } catch (e) {}
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createMenu();

  if (!process.env.VITE_DEV_SERVER_URL) {
    setupAutoUpdater(mainWindow);
  }

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

// ── IPC HANDLERS ────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', async () => {
  try {
    const pkg = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Seleccionar Carpeta Maestra'
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('create-folder-structure', async (event, { rootPath, cliente, proyecto, projectDate, templates }) => {
  try {
    const today = projectDate || new Date().toISOString().split('T')[0];
    const safeCliente = cliente ? cliente.replace(/\s+/g, '_') : '';
    const safeProyecto = (proyecto || 'PROYECTO').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚüÜñÑ-]/g, '');
    
    const folderName = `${today.replace(/-/g, '')}_${safeProyecto}`;

    let basePath = rootPath;
    if (safeCliente) {
      basePath = path.join(rootPath, safeCliente);
    }

    const projectPath = path.join(basePath, folderName);
    await fs.mkdir(projectPath, { recursive: true });

    const dirs = ['01_PR', '02_AE', '03_Videos', '04_Audios', '05_Imágenes'];

    for (const dir of dirs) {
      await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }

    const templatesDir = process.env.VITE_DEV_SERVER_URL 
      ? path.join(process.cwd(), 'public', 'plantillas_adobe')
      : path.join(__dirname, '../dist', 'plantillas_adobe');

    if (templates.premiere) {
      const src = path.join(templatesDir, 'premiere_pro', `${templates.premiere}.prproj`);
      const dest = path.join(projectPath, '01_PR', `${folderName}.prproj`);
      if (existsSync(src)) {
        await fs.copyFile(src, dest);
      } else {
        await fs.writeFile(dest, '', 'utf-8');
      }
    }

    if (templates.afterEffects) {
      const src = path.join(templatesDir, 'after_effects', `${templates.afterEffects}.aep`);
      const dest = path.join(projectPath, '02_AE', `${folderName}.aep`);
      if (existsSync(src)) {
        await fs.copyFile(src, dest);
      } else {
        await fs.writeFile(dest, '', 'utf-8');
      }
    }

    return { success: true, projectPath };
  } catch (error) {
    console.error("IPC create-folder-structure Error:", error);
    return { success: false, error: error.message };
  }
});
