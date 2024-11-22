const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const XLSX = require('xlsx');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadURL(
    isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    win.webContents.openDevTools();
  }
}

// Registro de IPCs para comunicação entre processos
function registerIPCs() {
  // Salvar arquivo XLSX
  ipcMain.handle('save-xlsx', async (event, data, fileName) => {
    try {
      const novaPasta = XLSX.utils.book_new();
      const novaPlanilha = XLSX.utils.json_to_sheet(data);
      
      XLSX.utils.book_append_sheet(novaPasta, novaPlanilha, 'Chamada');
      
      const result = await dialog.showSaveDialog({
        title: 'Salvar Planilha',
        defaultPath: fileName,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      });

      if (!result.canceled && result.filePath) {
        XLSX.writeFile(novaPasta, result.filePath);
        return result.filePath;
      }
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      throw error;
    }
  });

  // Carregar arquivo XLSX
  ipcMain.handle('load-xlsx', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const workbook = XLSX.readFile(result.filePaths[0]);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    }
  });
}

app.whenReady().then(() => {
  registerIPCs();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});