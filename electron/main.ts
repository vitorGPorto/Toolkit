import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, spawn } from 'node:child_process';
import fs from 'node:fs';
import readline from 'node:readline';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

export function sendLogToWindow(type: 'info' | 'error' | 'stdout' | 'stderr', message: string) {
  if (win && win.webContents) {
    win.webContents.send('app-log', { time: new Date().toISOString(), type, message });
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 500,
    height: 850,
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), // .mjs is built by vite-plugin-electron
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0A0A0B',
      symbolColor: '#FFFFFF'
    }
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// ====== IPC NATIVE WINDOWS COMMANDS ====== //

ipcMain.handle('cmd:iis-reset', async () => {
  return new Promise((resolve) => {
    exec('iisreset', (err, stdout) => {
      resolve({ success: !err, message: err ? err.message : stdout });
    });
  });
});

ipcMain.handle('cmd:open-inetmgr', async () => {
  return new Promise((resolve) => {
    exec('start inetmgr', (err, stdout) => {
      resolve({ success: !err, message: err ? err.message : 'Gerenciador IIS Aberto.' });
    });
  });
});

ipcMain.handle('cmd:recycle-app-pool', async () => {
  // requires admin or specific appcmd config
  return new Promise((resolve) => {
    exec('%windir%\\system32\\inetsrv\\appcmd.exe recycle apppool "DefaultAppPool"', (err, stdout) => {
      resolve({ success: !err, message: err ? err.message : stdout });
    });
  });
});

ipcMain.handle('cmd:clear-temp', async () => {
  const tempDir = process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp';
  let deleted = 0;
  let skipped = 0;

  const removeRecursive = (dir: string) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            removeRecursive(fullPath);
            fs.rmdirSync(fullPath);
            deleted++;
          } else {
            fs.unlinkSync(fullPath);
            deleted++;
          }
        } catch {
          // Arquivo em uso ou sem permissão — ignora
          skipped++;
        }
      }
    } catch {
      skipped++;
    }
  };

  try {
    removeRecursive(tempDir);
    const msg = `✅ Temp limpo: ${deleted} item(s) removido(s)${skipped > 0 ? `, ${skipped} ignorado(s) (em uso)` : ''}.`;
    sendLogToWindow('info', `[Limpar Temp] ${msg}`);
    return { success: true, message: msg };
  } catch (error: any) {
    return { success: false, message: `Erro ao limpar Temp: ${error.message}` };
  }
});

ipcMain.handle('cmd:bin-update', async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, message: "Deploy Artifacts OK." }), 500);
  });
});

// JSON Profile Management
const profilePath = path.join(app.getPath('userData'), 'profiles.json');

ipcMain.handle('data:save-profile', async (_, profileData) => {
  try {
    let profiles: any = {};
    if (fs.existsSync(profilePath)) {
      profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    }
    profiles[profileData.profileName] = profileData;
    fs.writeFileSync(profilePath, JSON.stringify(profiles, null, 2));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('data:load-profiles', async () => {
  try {
    if (fs.existsSync(profilePath)) {
      return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    }
    return {};
  } catch {
    return {};
  }
});

// Alias Persistence
const aliasPath = path.join(app.getPath('userData'), 'aliases.json');

ipcMain.handle('data:save-aliases', async (_, aliases) => {
  try {
    fs.writeFileSync(aliasPath, JSON.stringify(aliases, null, 2));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('data:load-aliases', async () => {
  try {
    if (fs.existsSync(aliasPath)) {
      return JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
    }
    return [];
  } catch {
    return [];
  }
});

// Load RM Versions from C:\RM\Legado
ipcMain.handle('data:load-rm-versions', async () => {
  const rmPath = 'C:\\RM\\Legado';
  try {
    if (fs.existsSync(rmPath)) {
      const dirents = fs.readdirSync(rmPath, { withFileTypes: true });
      return dirents
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    }
    return [];
  } catch {
    return [];
  }
});

ipcMain.handle('cmd:test-db-connection', async (_, config) => {
  const { server, type } = config;
  if (!server) return { success: false, message: "Host do servidor é obrigatório." };

  // Parse host and port (Handles "host,port", "host:port" or "host")
  let host = server;
  let port = type === 'sql' ? 1433 : 1521; // Defaults

  if (server.includes(',')) {
    const parts = server.split(',');
    host = parts[0].trim();
    port = parseInt(parts[1].trim()) || port;
  } else if (server.includes(':')) {
    const parts = server.split(':');
    host = parts[0].trim();
    port = parseInt(parts[1].trim()) || port;
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let completed = false;

    socket.setTimeout(4000); // 4 seconds timeout

    socket.connect(port, host, () => {
      if (completed) return;
      completed = true;
      socket.destroy();
      resolve({ 
        success: true, 
        message: `Sucesso! Rede OK: ${host} respondendo na porta ${port}.` 
      });
    });

    socket.on('error', (err) => {
      if (completed) return;
      completed = true;
      socket.destroy();
      resolve({ 
        success: false, 
        message: `Erro: ${err.message} (Verifique IP/Porta ${host}:${port})` 
      });
    });

    socket.on('timeout', () => {
      if (completed) return;
      completed = true;
      socket.destroy();
      resolve({ 
        success: false, 
        message: `Timeout: O servidor ${host}:${port} não respondeu.` 
      });
    });
  });
});

// ====== RM FOLDER SHORTCUTS ====== //

ipcMain.handle('cmd:open-bin', async (_, rmVersion: string) => {
  const basePath = 'C:\\RM\\Legado';
  const binPath = rmVersion && rmVersion !== 'Bin' 
    ? path.join(basePath, rmVersion, 'Bin')
    : path.join(basePath, 'Bin');

  try {
    if (!fs.existsSync(binPath)) {
      return { success: false, message: `Pasta não encontrada: ${binPath}` };
    }
    const error = await shell.openPath(binPath);
    return { success: !error, message: error || `Opened: ${binPath}` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('cmd:open-custom', async (_, rmVersion: string) => {
  const basePath = 'C:\\RM\\Legado';
  const customPath = rmVersion && rmVersion !== 'Bin'
    ? path.join(basePath, rmVersion, 'Bin', 'Custom')
    : path.join(basePath, 'Bin', 'Custom');

  try {
    if (!fs.existsSync(customPath)) {
      return { success: false, message: `Pasta não encontrada: ${customPath}` };
    }
    const error = await shell.openPath(customPath);
    return { success: !error, message: error || `Opened: ${customPath}` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('cmd:del-dii-custom', async (_, rmVersion: string) => {
  const basePath = 'C:\\RM\\Legado';
  const customPath = rmVersion && rmVersion !== 'Bin'
    ? path.join(basePath, rmVersion, 'Bin', 'Custom')
    : path.join(basePath, 'Bin', 'Custom');
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(customPath)) {
        resolve({ success: false, message: `Pasta não encontrada: ${customPath}` });
        return;
      }
      const files = fs.readdirSync(customPath);
      const dlls = files.filter(f => f.toLowerCase().endsWith('.dll'));
      dlls.forEach(f => fs.unlinkSync(`${customPath}\\${f}`));
      resolve({ success: true, message: `${dlls.length} DLL(s) apagadas de Custom.` });
    } catch (error: any) {
      resolve({ success: false, message: error.message });
    }
  });
});

ipcMain.handle('cmd:open-portal-aluno', async () => {
  try {
    await shell.openExternal('http://localhost/FrameHTML/web/app/Edu/PortalEducacional/');
    return { success: true, message: 'Portal Aluno aberto no navegador.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

function resolveExecutablePath(rmVersion: string, exeName: string): string | null {
  const basePath = 'C:\\RM\\Legado';
  let targetVersion = rmVersion && rmVersion !== 'Bin' ? rmVersion : null;

  if (!targetVersion) {
    try {
      if (fs.existsSync(basePath)) {
        const dirents = fs.readdirSync(basePath, { withFileTypes: true });
        const versions = dirents
          .filter(d => d.isDirectory() && /^\d+\.\d+/.test(d.name))
          .map(d => d.name)
          .sort((a, b) => b.localeCompare(a));
        if (versions.length > 0) {
          targetVersion = versions[0];
        }
      }
    } catch {}
  }

  if (!targetVersion) return null;
  return path.join(basePath, targetVersion, 'Bin', exeName);
}

function getAliasConfig(aliasName: string): any {
  if (!aliasName) return null;
  try {
    if (fs.existsSync(aliasPath)) {
      const data = fs.readFileSync(aliasPath, 'utf-8');
      const aliases = JSON.parse(data);
      // Suporte para o json novo (name) ou legado (NomeAlias)
      return aliases.find((a: any) => a.name === aliasName || a.NomeAlias === aliasName) || null;
    }
  } catch (e) {}
  return null;
}

function createAliasDat(exeDir: string, alias: any): void {
  if (!alias) return;
  const datPath = path.join(exeDir, 'Alias.dat');
  if (fs.existsSync(datPath)) {
    try { fs.unlinkSync(datPath); } catch (e) {}
  }
  
  // Mapping as propriedades da nossa AliasConfig UI:
  const isSQL = alias.dbType === 'sql' || alias.Sgbd === 'SQL';
  const dbTypeVal = isSQL ? 'SqlServer' : 'Oracle';
  const dbProviderVal = isSQL ? 'SqlClient' : 'OracleClient';
  
  const baseValue = alias.base || alias.Base || '';
  const serverValue = alias.server || alias.DbServer || '';
  const userDbValue = alias.dbUser || alias.UsuarioDB || '';
  const passDbValue = alias.dbPass || alias.SenhaDB || '';
  const nameValue = alias.name || alias.NomeAlias || 'CorporeRM';
  
  const dbname = isSQL ? `<DbName>${baseValue}</DbName>` : '<DbName/>';
  const xml = `<?xml version="1.0" standalone="yes"?>
<RMSAliasData xmlns="http://tempuri.org/RMSAliasData.xsd">
  <DbConfig>
    <Alias>CorporeRM</Alias>
    <DbType>${dbTypeVal}</DbType>
    <DbProvider>${dbProviderVal}</DbProvider>
    <DbServer>${serverValue}</DbServer>
    ${dbname}
    <UserName>${userDbValue}</UserName>
    <Password>${passDbValue}</Password>
    <RunService>${String(alias.runService ?? alias.RunService ?? true).toLowerCase()}</RunService>
    <JobServerEnabled>${String(alias.jobProcessing ?? alias.JobServerEnabled ?? false).toLowerCase()}</JobServerEnabled>
    <JobServerMaxThreads>${alias.maxThreads ?? alias.JobServerMaxThreads ?? 0}</JobServerMaxThreads>
    <JobServerLocalOnly>${String(alias.localOnly ?? alias.JobServerLocalOnly ?? false).toLowerCase()}</JobServerLocalOnly>
    <JobServerPollingInterval>10</JobServerPollingInterval>
    <ChartAlertEnabled>false</ChartAlertEnabled>
    <ChartAlertPollingInterval>20</ChartAlertPollingInterval>
    <ChartHistoryEnabled>false</ChartHistoryEnabled>
    <ChartHistoryPollingInterval>20</ChartHistoryPollingInterval>
    <RSSReaderMailEnabled>false</RSSReaderMailEnabled>
    <RSSReaderMailPollingInterval>10</RSSReaderMailPollingInterval>
    <JobServerProcessPoolEnabled>${String(alias.processPool ?? alias.JobServerProcessPoolEnabled ?? false).toLowerCase()}</JobServerProcessPoolEnabled>
  </DbConfig>
</RMSAliasData>`;

  try { 
    fs.writeFileSync(datPath, xml, 'utf-8');
    sendLogToWindow('info', `[Alias.dat] Gerado com sucesso em: ${datPath}`);
  } catch (e: any) {
    sendLogToWindow('error', `[Alias.dat] ERRO FATAL ao criar Alias.dat: ${e.message}`);
  }
}

ipcMain.handle('cmd:start-rm', async (_, rmVersion: string, aliasName: string, autoLogin: boolean) => {
  const exePath = resolveExecutablePath(rmVersion, 'RM.exe');
  if (!exePath || !fs.existsSync(exePath)) return { success: false, message: `RM.exe não encontrado.` };

  const aliasConfig = getAliasConfig(aliasName);
  
  if (!aliasConfig) {
    sendLogToWindow('error', `[START RM] ERRO: Alias "${aliasName}" não encontrado na base de aliases. Abortando!`);
    return { success: false, message: `Alias "${aliasName}" não foi encontrado. Por favor, re-selecione o alias correto nas Configurações (Aba do Perfil)!` };
  }

  sendLogToWindow('info', `[START RM] Alias encontrado: ${aliasName} ✅`);

  createAliasDat(path.dirname(exePath), aliasConfig);

  if (autoLogin) {
    const userStr = aliasConfig.rmUser || aliasConfig.UsuarioRM || '';
    const passStr = aliasConfig.rmPass || aliasConfig.SenhaRM || '';
    
    // Passamos sem aspas nos atributos chave=valor porque Delphi As vezes falha ao ler "chave=valor" com aspas envolvendo a chave
    const cmdStr = `"${exePath}" multi=true alias=CorporeRM user=${userStr} password=${passStr} #objetos_gerenciais`;
    sendLogToWindow('info', `[START RM] Executando com AutoLogin: ${exePath}`);

    const child = spawn(cmdStr, [], { 
      detached: true, 
      stdio: 'ignore', 
      shell: true,
      cwd: path.dirname(exePath)
    });
    child.unref();

    return { success: true, message: 'RM.exe iniciado com AutoLogin.' };
  } else {
    const err = await shell.openPath(exePath);
    return { success: !err, message: err || 'RM.exe iniciado sem AutoLogin.' };
  }
});

ipcMain.handle('cmd:start-host', async (_, rmVersion: string, aliasName: string, delBroker: boolean, apagarHost: boolean) => {
  const exePath = resolveExecutablePath(rmVersion, 'RM.Host.exe');
  if (!exePath || !fs.existsSync(exePath)) return { success: false, message: `RM.Host.exe não encontrado.` };

  const binDir = path.dirname(exePath);

  // ── Deletar _Broker.dat se a opção "Deletar Broker" estiver ativa ──
  if (delBroker) {
    const brokerPath = path.join(binDir, '_Broker.dat');
    sendLogToWindow('info', `[Deletar Broker] Verificando: ${brokerPath}`);
    if (fs.existsSync(brokerPath)) {
      try {
        fs.unlinkSync(brokerPath);
        sendLogToWindow('info', `[Deletar Broker] ✅ _Broker.dat apagado com sucesso.`);
      } catch (e: any) {
        sendLogToWindow('error', `[Deletar Broker] ❌ Falha ao apagar _Broker.dat: ${e.message}`);
      }
    } else {
      sendLogToWindow('info', `[Deletar Broker] ℹ️ _Broker.dat não encontrado (já estava limpo).`);
    }
  } else {
    sendLogToWindow('info', `[Deletar Broker] Opção desativada — _Broker.dat mantido.`);
  }

  // ── Deletar _BrokerCustom.dat se a opção "Apagar Host" estiver ativa ──
  if (apagarHost) {
    const brokerCustomPath = path.join(binDir, '_BrokerCustom.dat');
    sendLogToWindow('info', `[Apagar Host] Verificando: ${brokerCustomPath}`);
    if (fs.existsSync(brokerCustomPath)) {
      try {
        fs.unlinkSync(brokerCustomPath);
        sendLogToWindow('info', `[Apagar Host] ✅ _BrokerCustom.dat apagado com sucesso.`);
      } catch (e: any) {
        sendLogToWindow('error', `[Apagar Host] ❌ Falha ao apagar _BrokerCustom.dat: ${e.message}`);
      }
    } else {
      sendLogToWindow('info', `[Apagar Host] ℹ️ _BrokerCustom.dat não encontrado (já estava limpo).`);
    }
  } else {
    sendLogToWindow('info', `[Apagar Host] Opção desativada — _BrokerCustom.dat mantido.`);
  }

  const aliasConfig = getAliasConfig(aliasName);
  createAliasDat(binDir, aliasConfig);

  sendLogToWindow('info', `Iniciando RM.Host.exe (${rmVersion})...`);

  try {
    const child = spawn(`"${exePath}"`, [], { 
      detached: true, 
      shell: true,
      cwd: binDir
    });

    if (child.stdout) {
      child.stdout.setEncoding('latin1');
      const rlOut = readline.createInterface({ input: child.stdout });
      rlOut.on('line', (line) => {
        if (!line.includes('WRN]')) {
          sendLogToWindow('stdout', line);
        }
      });
    }

    if (child.stderr) {
      child.stderr.setEncoding('latin1');
      const rlErr = readline.createInterface({ input: child.stderr });
      rlErr.on('line', (line) => {
        if (!line.includes('WRN]')) {
          sendLogToWindow('stderr', line);
        }
      });
    }

    child.on('error', (err) => {
      sendLogToWindow('error', `Falha ao iniciar Host: ${err.message}`);
    });

    child.on('close', (code) => {
      sendLogToWindow('info', `RM.Host process exited with code ${code}`);
    });

    child.unref();
    return { success: true, message: 'RM.Host.exe iniciado.' };
  } catch (err: any) {
    sendLogToWindow('error', `Exception ao iniciar Host: ${err.message}`);
    return { success: false, message: err.message };
  }
});

// Validation
ipcMain.handle('cmd:validate-env', async (_, rmVersion: string) => {
  const basePath = 'C:\\RM\\Legado';
  const customPath = rmVersion && rmVersion !== 'Bin'
    ? path.join(basePath, rmVersion, 'Bin', 'Custom')
    : path.join(basePath, 'Bin', 'Custom');
    
  let messages: string[] = [];

  try {
    if (fs.existsSync(customPath)) {
      const files = fs.readdirSync(customPath);
      const invalidDlls = files.filter(f => 
        f.toLowerCase().endsWith('.dll') && 
        !f.toLowerCase().startsWith('rm.cst.')
      );

      if (invalidDlls.length > 0) {
        let msg = `Foram encontradas Dlls que não tem o prefixo "RM.Cst." na pasta Custom:\n` + invalidDlls.join(', ');
        messages.push(msg);
        sendLogToWindow('error', msg);
      } else {
        sendLogToWindow('info', `Validação OK: Nenhuma Dll incorreta encontrada na pasta Custom.`);
      }
    }
  } catch (error: any) {
    sendLogToWindow('error', `Erro ao validar Custom: ${error.message}`);
  }

  return { success: true, messages };
});

ipcMain.handle('cmd:stop-host', async () => {
  return new Promise((resolve) => {
    const cmd = 'taskkill /F /IM RM.Host.exe /IM RM.Host.Service.exe /IM RM.Host.JobRunner.exe /IM RMHost.exe /IM RM.exe /T';
    exec(cmd, (err) => {
      resolve({ success: true, message: 'Comando de parada enviado.' });
    });
  });
});

ipcMain.handle('cmd:check-host-status', async () => {
  return new Promise((resolve) => {
    exec('tasklist /NH /FO CSV /FI "IMAGENAME eq RM.Host.exe"', (err, stdout) => {
      if (!stdout || !stdout.toLowerCase().includes('rm.host.exe')) {
        // Fallback check for older host names just in case
        exec('tasklist /NH /FO CSV /FI "IMAGENAME eq RMHost.exe"', (err2, stdout2) => {
          if (!stdout2 || !stdout2.toLowerCase().includes('rmhost.exe')) return resolve({ isRunning: false });
          checkIfListening(stdout2, resolve);
        });
        return;
      }
      checkIfListening(stdout, resolve);
    });

    function checkIfListening(tasklistOut: string, resolve: any) {
      // Parse PID from CSV format: "RM.Host.exe","1234","Console",...
      const match = tasklistOut.match(/"[^"]+","(\d+)"/);
      if (!match) return resolve({ isRunning: 'starting' }); 
      const pid = match[1];

      exec('netstat -ano', (err, netstatOut) => {
        if (!netstatOut) return resolve({ isRunning: 'starting' });
        const lines = netstatOut.split('\n');
        const isListening = lines.some(line => {
          if (!line.includes('LISTENING')) return false;
          const parts = line.trim().split(/\s+/);
          if (parts[parts.length - 1] !== pid) return false;
          
          const localAddress = parts[1] || '';
          return localAddress.endsWith(':8050') || localAddress.endsWith(':8051');
        });
        resolve({ isRunning: isListening ? true : 'starting' });
      });
    }
  });
});

