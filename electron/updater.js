import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { ipcMain, dialog, BrowserWindow } from 'electron';

export function setupAutoUpdater(mainWindow) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update-check-started');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
    const v = info.version || '';
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización disponible',
      message: `📦 Inefable ${v}`,
      detail: `Hay una nueva versión disponible. ¿Deseas descargarla ahora?`,
      buttons: ['Descargar ahora', 'Más tarde'],
      defaultId: 0,
      cancelId: 1
    });
    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update-download-progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Lista para instalar',
      message: 'Actualización descargada',
      detail: 'La actualización se instalará al reiniciar la app.',
      buttons: ['Instalar y reiniciar', 'Más tarde']
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall(false, true);
    });
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err.message);
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle('download-update-now', async () => {
    try {
      await autoUpdater.downloadUpdate();
    } catch (err) {
      return { error: err.message };
    }
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 3000);
}
