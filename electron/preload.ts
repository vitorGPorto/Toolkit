import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  openExternalUrl: (url: string) => ipcRenderer.invoke('app:open-url', url),
  iisReset: () => ipcRenderer.invoke('cmd:iis-reset'),
  openInetMgr: () => ipcRenderer.invoke('cmd:open-inetmgr'),
  recycleAppPool: () => ipcRenderer.invoke('cmd:recycle-app-pool'),
  clearTemp: () => ipcRenderer.invoke('cmd:clear-temp'),
  binUpdate: () => ipcRenderer.invoke('cmd:bin-update'),
  saveProfile: (data: any) => ipcRenderer.invoke('data:save-profile', data),
  loadProfiles: () => ipcRenderer.invoke('data:load-profiles'),
  openBin: (version: string) => ipcRenderer.invoke('cmd:open-bin', version),
  openCustom: (version: string) => ipcRenderer.invoke('cmd:open-custom', version),
  delDiiCustom: (version: string) => ipcRenderer.invoke('cmd:del-dii-custom', version),
  saveAliases: (data: any) => ipcRenderer.invoke('data:save-aliases', data),
  loadAliases: () => ipcRenderer.invoke('data:load-aliases'),
  loadRMVersions: () => ipcRenderer.invoke('data:load-rm-versions'),
  testDbConnection: (config: any) => ipcRenderer.invoke('cmd:test-db-connection', config),
  startRM: (version: string, aliasName: string, autoLogin: boolean) => ipcRenderer.invoke('cmd:start-rm', version, aliasName, autoLogin),
  startHost: (version: string, aliasName: string, delBroker: boolean, apagarHost: boolean) => ipcRenderer.invoke('cmd:start-host', version, aliasName, delBroker, apagarHost),
  stopHost: () => ipcRenderer.invoke('cmd:stop-host'),
  checkHostStatus: () => ipcRenderer.invoke('cmd:check-host-status'),
  validateEnv: (version: string) => ipcRenderer.invoke('cmd:validate-env', version),
  openPortalAluno: () => ipcRenderer.invoke('cmd:open-portal-aluno'),
  onAppLog: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('app-log', handler);
    return () => ipcRenderer.removeListener('app-log', handler);
  }
});
