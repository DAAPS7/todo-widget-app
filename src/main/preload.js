const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadTasks: () => ipcRenderer.invoke('tasks:load'),
  saveTasks: (tasks) => ipcRenderer.invoke('tasks:save', tasks),
  quit: () => ipcRenderer.send('app:quit'),
  getPosition: () => ipcRenderer.invoke('window:getPosition'),
  setPosition: (position) => ipcRenderer.invoke('window:setPosition', position),
  getCompact: () => ipcRenderer.invoke('window:getCompact'),
  setCompact: (compact) => ipcRenderer.invoke('window:setCompact', compact),
  getGoogleStatus: () => ipcRenderer.invoke('google:status'),
  connectGoogle: () => ipcRenderer.invoke('google:connect'),
  disconnectGoogle: () => ipcRenderer.invoke('google:disconnect'),
  onTasksExternalChange: (callback) => ipcRenderer.on('tasks:external-change', () => callback())
});
