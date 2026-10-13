const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { attachToDesktop } = require('./desktop');
const googleDrive = require('./googleDrive');
const googleAppCreds = require('./googleConfig');

const WIDTH = 330;
const HEIGHT = 520;
const COMPACT_HEIGHT = 300;
const MARGIN = 24;     // distância às bordas do ecrã
const TOP_OFFSET = 48; // deixa espaço para a barra de menus, no topo
const POLL_INTERVAL_MS = 20000; // frequência com que verifica se outro dispositivo alterou as tarefas no Drive

// Ficheiros de definições ficam sempre em %APPDATA%\todo-widget-app\ (nunca sincronizados)
const userDataDir = app.getPath('userData');
const localDataFile = path.join(userDataDir, 'tasks.json');
const windowFile = path.join(userDataDir, 'window.json');

const POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right'
];
const DEFAULT_STATE = { position: 'top-right', compact: false };

let win = null;
let state = { ...DEFAULT_STATE };
// clientId/clientSecret vêm fixos do código (googleConfig.js); refreshToken/driveFileId são deste dispositivo
let googleCfg = {
  clientId: googleAppCreds.CLIENT_ID || null,
  clientSecret: googleAppCreds.CLIENT_SECRET || null,
  ...googleDrive.loadConfig(userDataDir)
};
let lastSeenJSON = null; // última versão conhecida das tarefas (nossa ou vinda do Drive), para detetar alterações de outros dispositivos
let pollTimer = null;

function isGoogleAvailable() {
  return !!(googleCfg.clientId && googleCfg.clientSecret);
}

function isGoogleConnected() {
  return isGoogleAvailable() && !!(googleCfg.refreshToken && googleCfg.driveFileId);
}

function loadLocalTasks() {
  try {
    // replace remove o BOM que alguns editores e o PowerShell 5 acrescentam
    return JSON.parse(fs.readFileSync(localDataFile, 'utf8').replace(/^﻿/, ''));
  } catch {
    return [];
  }
}

function saveLocalTasks(tasks) {
  fs.mkdirSync(path.dirname(localDataFile), { recursive: true });
  fs.writeFileSync(localDataFile, JSON.stringify(tasks, null, 2));
}

async function loadTasks() {
  if (!isGoogleConnected()) return loadLocalTasks();
  try {
    const tasks = await googleDrive.loadTasks(googleCfg);
    lastSeenJSON = JSON.stringify(tasks);
    return tasks;
  } catch {
    return []; // sem rede ou token inválido: a app arranca vazia em vez de falhar
  }
}

async function saveTasks(tasks) {
  if (!isGoogleConnected()) {
    saveLocalTasks(tasks);
    return;
  }
  lastSeenJSON = JSON.stringify(tasks);
  await googleDrive.saveTasks(googleCfg, tasks);
}

// Verifica periodicamente se outro dispositivo alterou as tarefas no Drive, e avisa a janela
function startPolling() {
  stopPolling();
  if (!isGoogleConnected()) return;
  pollTimer = setInterval(async () => {
    try {
      const tasks = await googleDrive.loadTasks(googleCfg);
      const json = JSON.stringify(tasks);
      if (json === lastSeenJSON) return;
      lastSeenJSON = json;
      if (win) win.webContents.send('tasks:external-change');
    } catch {
      // falha temporária (sem rede, etc.); tenta de novo no próximo ciclo
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function loadWindowState() {
  try {
    const saved = JSON.parse(fs.readFileSync(windowFile, 'utf8'));
    return {
      position: POSITIONS.includes(saved.position) ? saved.position : DEFAULT_STATE.position,
      compact: saved.compact === true
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveWindowState() {
  fs.mkdirSync(path.dirname(windowFile), { recursive: true });
  fs.writeFileSync(windowFile, JSON.stringify(state));
}

// Posição da janela no ecrã principal, em pixels lógicos (DIP)
function boundsFor(position, compact) {
  const { workArea } = screen.getPrimaryDisplay();
  const height = compact ? COMPACT_HEIGHT : HEIGHT;
  const row = position.startsWith('top') ? 0 : position.startsWith('bottom') ? 2 : 1;
  const col = position.endsWith('left') ? 0 : position.endsWith('right') ? 2 : 1;

  const x = [
    workArea.x + MARGIN,
    workArea.x + Math.round((workArea.width - WIDTH) / 2),
    workArea.x + workArea.width - WIDTH - MARGIN
  ][col];

  const y = [
    workArea.y + TOP_OFFSET,
    workArea.y + Math.round((workArea.height - height) / 2),
    workArea.y + workArea.height - height - MARGIN
  ][row];

  return { x, y, width: WIDTH, height };
}

ipcMain.handle('tasks:load', () => loadTasks());
ipcMain.handle('tasks:save', (_event, tasks) => saveTasks(tasks));
ipcMain.on('app:quit', () => app.quit());

ipcMain.handle('google:status', () => ({
  available: isGoogleAvailable(),
  connected: isGoogleConnected()
}));

ipcMain.handle('google:connect', async () => {
  if (!isGoogleAvailable()) throw new Error('not_available');

  const refreshToken = await googleDrive.login(googleCfg.clientId, googleCfg.clientSecret);
  googleCfg.refreshToken = googleDrive.encrypt(refreshToken);

  const currentTasks = loadLocalTasks(); // tarefas deste dispositivo, levadas para o Drive se for a primeira vez
  const fileId = await googleDrive.findOrCreateFile(googleCfg, currentTasks);
  googleCfg.driveFileId = fileId;
  googleDrive.saveConfig(userDataDir, { refreshToken: googleCfg.refreshToken, driveFileId: googleCfg.driveFileId });
  startPolling();

  return { available: true, connected: true };
});

ipcMain.handle('google:disconnect', async () => {
  if (isGoogleConnected()) {
    try {
      const tasks = await googleDrive.loadTasks(googleCfg);
      saveLocalTasks(tasks); // guarda localmente antes de desligar, para não perder as tarefas
    } catch {
      // sem conseguir ir buscar as tarefas ao Drive agora; mantém o que já estava guardado localmente
    }
  }
  googleCfg.refreshToken = null;
  googleCfg.driveFileId = null;
  googleDrive.saveConfig(userDataDir, { refreshToken: null, driveFileId: null });
  stopPolling();
  return { available: isGoogleAvailable(), connected: false };
});

ipcMain.handle('window:getPosition', () => state.position);
ipcMain.handle('window:setPosition', (_event, position) => {
  if (!POSITIONS.includes(position) || !win) return state.position;
  state.position = position;
  saveWindowState();
  win.setBounds(boundsFor(state.position, state.compact));
  return state.position;
});

ipcMain.handle('window:getCompact', () => state.compact);
ipcMain.handle('window:setCompact', (_event, compact) => {
  if (!win) return state.compact;
  state.compact = compact === true;
  saveWindowState();
  win.setBounds(boundsFor(state.position, state.compact));
  return state.compact;
});

function createWindow() {
  state = loadWindowState();

  win = new BrowserWindow({
    ...boundsFor(state.position, state.compact),
    show: false,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
    const timer = attachToDesktop(win);
    win.on('closed', () => clearInterval(timer));
  });

  startPolling();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());
