import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, '../public/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });


  mainWindow.webContents.on('console-message', async (event, level, message, line, sourceId) => {
    try {
      await fs.appendFile('/Users/groonkm2pro/.gemini/antigravity/renderer_errors.log', `[Console Level ${level}] ${message} (${sourceId}:${line})\n`);
    } catch (e) {}
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
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

// --- IPC HANDLERS FOR FILE SYSTEM ---

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Seleccionar Carpeta Maestra'
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('create-folder-structure', async (event, { rootPath, empresa, proyecto, templates }) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const safeEmpresa = empresa.replace(/ /g, '_');
    const safeProyecto = proyecto.replace(/ /g, '_');
    
    const companyPath = path.join(rootPath, empresa);
    await fs.mkdir(companyPath, { recursive: true });
    
    const folderName = `${today}_${safeEmpresa}_${safeProyecto}`;
    const projectPath = path.join(companyPath, folderName);
    await fs.mkdir(projectPath, { recursive: true });
    
    const dirs = [
      '01_Premiere Pro',
      '02_After Effects',
      '03_video/video 01',
      '03_video/video 02',
      '03_video/video 03',
      '03_video/video 04',
      '03_video/video 06',
      '03_video/video bar',
      '03_video/video tragos',
      '04_audio',
      '05_imágenes/PNG',
      '06_IA'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }

    const basePath = process.env.VITE_DEV_SERVER_URL 
      ? path.join(process.cwd(), 'public', 'edicion_de_video')
      : path.join(__dirname, '../dist', 'edicion_de_video');

    if (templates.premiere) {
      const src = path.join(basePath, 'premiere_pro', `${templates.premiere}.prproj`);
      const dest = path.join(projectPath, '01_Premiere Pro', `${folderName}.prproj`);
      await fs.copyFile(src, dest);
    }

    if (templates.afterEffects) {
      const src = path.join(basePath, 'after_effects', `${templates.afterEffects}.aep`);
      const dest = path.join(projectPath, '02_After Effects', `${folderName}.aep`);
      await fs.copyFile(src, dest);
    }

    return { success: true, projectPath };
  } catch (error) {
    console.error("IPC create-folder-structure Error:", error);
    return { success: false, error: error.message };
  }
});
