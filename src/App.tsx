import { useState, useEffect } from 'react';
import {
  Settings,
  LayoutGrid,
  Terminal,
  User,
  Globe,
  Info,
} from 'lucide-react';
import './App.css';
import HomeView from './components/HomeView';
import LogsView from './components/LogsView';
import ProfileView from './components/ProfileView';
import AliasManager from './components/AliasManager';
import AboutView from './components/AboutView';

// ── Dictionaries ──────────────────────────────────────────────────────────────
const dictionaries = {
  en: {
    activeEnv: "Active Environment",
    quickActions: "Quick Actions",
    iisReset: "IIS Reset",
    iisDesc: "RESTART WEB SERVER",
    iisManager: "IIS Config",
    iisManagerDesc: "OPEN IIS MANAGER",
    recycle: "Recycle AppPool",
    recycleDesc: "WORKER REFRESH",
    clearTemp: "Clear Temp",
    clearDesc: "PURGE CACHE",
    binUpdate: "Bin Update",
    binDesc: "DEPLOY ARTIFACTS",
    settings: "Settings",
    settingsDesc: "Configure localized environment variables and daemon behaviors for the RM TOOLKIT.",
    autoLogin: "Auto Login",
    autoLoginDesc: "Bypass authentication challenge on startup using secure kernel tokens.",
    delBroker: "Delete Broker",
    delBrokerDesc: "Automatically delegate message brokering to high-priority sub-nodes.",
    verboseLogs: "Verbose Logs",
    verboseLogsDesc: "Capture detailed stack traces and I/O buffer states in the terminal.",
    apagarHost: "Delete _BrokerCustom",
    apagarHostDesc: "Automatically delete _BrokerCustom.dat file before starting the host.",
    saveProfile: "Save Profile",
    profileName: "Profile Name",
    profileNamePH: "Ex: Daily Dev Setup...",
    alias: "Database Alias",
    aliasPH: "Ex: CorporeRM, TesteRM...",
    home: "HOME",
    logs: "LOGS",
    profile: "PROFILE",
    about: "ABOUT",
    connected: "Connected",
    currentVersion: "Current Version"
  },
  pt: {
    activeEnv: "Ambiente Ativo",
    quickActions: "Ações Rápidas",
    iisReset: "Reiniciar IIS",
    iisDesc: "REINICIA O SERVIDOR WEB",
    iisManager: "Config. IIS",
    iisManagerDesc: "ABRIR GERENCIADOR",
    recycle: "Reciclar AppPool",
    recycleDesc: "ATUALIZA O WORKER",
    clearTemp: "Limpar Temp",
    clearDesc: "LIMPA O CACHE",
    binUpdate: "Atualizar Bin",
    binDesc: "PUBLICA ARTEFATOS",
    settings: "Configurações",
    settingsDesc: "Configure variáveis de ambiente locais e comportamentos do RM TOOLKIT.",
    autoLogin: "Auto Login",
    autoLoginDesc: "Ignora a tela de login ao iniciar o sistema.",
    delBroker: "Deletar Broker",
    delBrokerDesc: "Apaga o arquivo _broker.dat automaticamente.",
    verboseLogs: "Logs Detalhados",
    verboseLogsDesc: "Captura rastreamentos detalhados durante a execução.",
    apagarHost: "Deletar _BrokerCustom",
    apagarHostDesc: "Apaga o arquivo _BrokerCustom.dat automaticamente ao iniciar o host.",
    saveProfile: "Salvar Perfil",
    profileName: "Nome do Perfil",
    profileNamePH: "Ex: Setup de Testes Carga...",
    alias: "Alias do Banco de Dados",
    aliasPH: "Ex: CorporeRM, RM_Teste...",
    home: "INÍCIO",
    logs: "LOGS",
    profile: "PERFIL",
    about: "SOBRE",
    connected: "Conectado",
    currentVersion: "Versão Atual"
  }
};

// ── Types ─────────────────────────────────────────────────────────────────────
type ProfileSettings = {
  autoLogin: boolean;
  delBroker: boolean;
  verboseLogs: boolean;
  apagarHost: boolean;
  alias: string;
  rmVersion: string;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState<'en' | 'pt'>('pt');
  const t = dictionaries[lang];

  // Settings state
  const [settings, setSettings] = useState({
    autoLogin: true,
    delBroker: false,
    verboseLogs: true,
    apagarHost: false,
    profileName: '',
    alias: 'CorporeRM',
    rmVersion: '12.1.2402'
  });

  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [availableAliases, setAvailableAliases] = useState<any[]>([]);
  const [availableRMVersions, setAvailableRMVersions] = useState<string[]>([]);
  const [hostStatus, setHostStatus] = useState<boolean | string | null>(null);
  const [logs, setLogs] = useState<{ time: string; type: string; message: string }[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Profiles
  const [profilesData, setProfilesData] = useState<Record<string, ProfileSettings>>(() => {
    try {
      const stored = localStorage.getItem('rm-commander-profiles-v2');
      return stored ? JSON.parse(stored) : {
        'Setup Padrão': { autoLogin: true, delBroker: false, verboseLogs: true, apagarHost: false, alias: 'CorporeRM', rmVersion: '12.1.2402' },
        'Testes Beta': { autoLogin: false, delBroker: true, verboseLogs: true, apagarHost: false, alias: 'RM_Teste', rmVersion: '12.1.2402' },
        'Cliente Financeiro': { autoLogin: true, delBroker: false, verboseLogs: false, apagarHost: false, alias: 'CorporeRM_FIN', rmVersion: '12.1.2402' },
      };
    } catch {
      return {};
    }
  });

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    refreshAliases();
    refreshVersions();

    const checkHost = async () => {
      const api = (window as any).electronAPI;
      if (api?.checkHostStatus) {
        try {
          const res = await api.checkHostStatus();
          setHostStatus(res.isRunning);
        } catch { /* ignore */ }
      }
    };

    checkHost();
    const intervalId = setInterval(checkHost, 3000);

    const api = (window as any).electronAPI;
    let removeLogListener: (() => void) | undefined;
    if (api?.onAppLog) {
      removeLogListener = api.onAppLog((log: any) => {
        setLogs(prev => [...prev, log]);
      });
    }

    return () => {
      clearInterval(intervalId);
      if (removeLogListener) removeLogListener();
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const refreshVersions = async () => {
    const api = (window as any).electronAPI;
    if (api?.loadRMVersions) {
      const versions = await api.loadRMVersions();
      setAvailableRMVersions(versions);
    } else {
      setAvailableRMVersions(['12.1.2402', '12.1.2406']);
    }
  };

  const refreshAliases = async () => {
    const api = (window as any).electronAPI;
    if (api) {
      const aliases = await api.loadAliases();
      setAvailableAliases(aliases || []);
    } else {
      setAvailableAliases([
        { name: 'CorporeRM', dbVersion: '12.1.2602' },
        { name: 'RM_Teste', dbVersion: '12.1.2502' },
        { name: 'CorporeRM_FIN', dbVersion: '12.1.2602' }
      ]);
    }
  };

  const persistProfiles = (data: Record<string, ProfileSettings>) => {
    localStorage.setItem('rm-commander-profiles-v2', JSON.stringify(data));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSetting = (key: keyof typeof settings, value: string) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'rmVersion' && value && prev.alias) {
        const currentAliasObj = availableAliases.find(a => a.name === prev.alias);
        if (currentAliasObj?.dbVersion && currentAliasObj.dbVersion !== value) {
          next.alias = '';
        }
      }
      return next;
    });
  };

  const loadProfile = (name: string) => {
    if (!name) return;
    const data = profilesData[name];
    if (data) {
      setSettings({ ...data, profileName: name });
    } else {
      setSettings(prev => ({ ...prev, profileName: name }));
    }
  };

  const deleteProfile = () => {
    const name = settings.profileName.trim();
    if (!name || !profilesData[name]) {
      showToast('⚠️ Nenhum perfil selecionado para apagar!');
      return;
    }
    if (!confirm(`Apagar o perfil "${name}"?`)) return;
    setProfilesData(prev => {
      const next = { ...prev };
      delete next[name];
      persistProfiles(next);
      return next;
    });
    setSettings({ autoLogin: true, delBroker: false, verboseLogs: true, apagarHost: false, profileName: '', alias: '', rmVersion: '12.1.2402' });
    showToast(`🗑️ Perfil "${name}" apagado!`);
  };

  const runFolderCmd = async (cmd: 'openBin' | 'openCustom' | 'delDiiCustom') => {
    const version = settings.rmVersion || '';
    const api = (window as any).electronAPI;
    if (!api) {
      const msgs: Record<string, string> = {
        openBin: `[Sim] Abrindo: C:\\RM\\Legado\\${version}\\Bin`,
        openCustom: `[Sim] Abrindo: C:\\RM\\Legado\\${version}\\Bin\\Custom`,
        delDiiCustom: `[Sim] Apagando DLLs de: C:\\RM\\Legado\\${version}\\Bin\\Custom`,
      };
      showToast(msgs[cmd]);
      return;
    }
    try {
      const result = await api[cmd](version);
      showToast(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      showToast(`❌ IPC Error: ${e}`);
    }
  };

  const runProcess = async (type: 'rm' | 'host' | 'stop' | 'portal') => {
    const version = settings.rmVersion || '';
    const aliasName = settings.alias || '';
    const autoLogin = settings.autoLogin ?? true;
    const api = (window as any).electronAPI;
    if (!api) {
      showToast(`Simulation: Process ${type}`);
      return;
    }
    try {
      if (api.validateEnv && (type === 'rm' || type === 'host')) {
        await api.validateEnv(version);
      }
      let result;
      if (type === 'rm') result = await api.startRM(version, aliasName, autoLogin);
      if (type === 'host') result = await api.startHost(version, aliasName, settings.delBroker, settings.apagarHost);
      if (type === 'stop') result = await api.stopHost();
      if (type === 'portal') result = await api.openPortalAluno();
      showToast(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      showToast(`❌ IPC Error: ${e}`);
    }
  };

  const runCommand = async (cmd: string) => {
    if (!(window as any).electronAPI) {
      showToast(`⚠️ Electron não ativo (modo simulação)`);
      return;
    }
    try {
      const api = (window as any).electronAPI;
      let result: { success: boolean; message: string } | undefined;
      switch (cmd) {
        case 'iis':     result = await api.iisReset(); break;
        case 'inetmgr': result = await api.openInetMgr(); break;
        case 'recycle': result = await api.recycleAppPool(); break;
        case 'clear':   result = await api.clearTemp(); break;
        case 'bin':     result = await api.binUpdate(); break;
      }
      if (!result) return;
      if (result.success) {
        showToast(`✅ ${result.message || 'Comando executado com sucesso!'}`);
      } else {
        // iisreset e appcmd precisam de privilégio de Administrador
        const needsAdmin = cmd === 'iis' || cmd === 'recycle';
        const hint = needsAdmin ? ' (Execute o app como Administrador)' : '';
        showToast(`❌ ${result.message}${hint}`);
      }
    } catch (e) {
      showToast(`❌ IPC Error: ${e}`);
    }
  };

  const savedProfiles = Object.keys(profilesData);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout animate-in">

      {/* Header */}
      <header className="top-header" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="8" width="20" height="13" rx="2" fill="#2563EB" />
              <path d="M7 8V5C7 3.9 7.9 3 9 3h6c1.1 0 2 .9 2 2v3" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
              <rect x="10" y="13" width="4" height="3" rx="1" fill="#DBEAFE" />
              <line x1="2" y1="14" x2="22" y2="14" stroke="#3B82F6" strokeWidth="1.5" />
            </svg>
          </div>
          <h1>TOOLKIT</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', WebkitAppRegion: 'no-drag' } as any}>
          <button
            className="icon-btn lang-btn"
            title="Switch Language"
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
          >
            <Globe size={18} style={{ marginRight: '4px' }} />
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{lang.toUpperCase()}</span>
          </button>
          <button className="icon-btn" title={t.settings} onClick={() => setActiveTab('profile')}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-area">
        {activeTab === 'home' && (
          <HomeView
            t={t}
            lang={lang}
            settings={settings}
            hostStatus={hostStatus}
            savedProfiles={savedProfiles}
            loadProfile={loadProfile}
            setSettings={setSettings}
            setActiveTab={setActiveTab}
            setIsAliasModalOpen={setIsAliasModalOpen}
            runProcess={runProcess}
            runFolderCmd={runFolderCmd}
            runCommand={runCommand}
          />
        )}

        {activeTab === 'logs' && (
          <LogsView
            t={t}
            logs={logs}
            setLogs={setLogs}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            t={t}
            lang={lang}
            settings={settings}
            availableRMVersions={availableRMVersions}
            availableAliases={availableAliases}
            profilesData={profilesData}
            setProfilesData={setProfilesData}
            updateSetting={updateSetting}
            toggleSetting={toggleSetting}
            refreshVersions={refreshVersions}
            setIsAliasModalOpen={setIsAliasModalOpen}
            showToast={showToast}
            deleteProfile={deleteProfile}
            persistProfiles={persistProfiles}
          />
        )}

        {activeTab === 'about' && (
          <AboutView
            t={t}
            lang={lang}
          />
        )}
      </main>

      {/* Bottom Dock */}
      <nav className="bottom-dock">
        <button
          className={`dock-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <LayoutGrid size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span>{t.home}</span>
        </button>

        <button
          className={`dock-item ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Terminal size={22} strokeWidth={activeTab === 'logs' ? 2.5 : 2} />
          <span>{t.logs}</span>
        </button>

        <button
          className={`dock-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          <span>{t.profile}</span>
        </button>

        <button
          className={`dock-item ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <Info size={22} strokeWidth={activeTab === 'about' ? 2.5 : 2} />
          <span>{t.about}</span>
        </button>
      </nav>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: '#1C1C1E', border: '1px solid #3A3A3C', color: '#fff',
          padding: '10px 20px', borderRadius: '12px', fontSize: '14px',
          fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
        }}>
          {toast}
        </div>
      )}

      {/* Alias Manager Modal */}
      {isAliasModalOpen && (
        <AliasManager
          onClose={() => setIsAliasModalOpen(false)}
          onSaved={() => { refreshAliases(); }}
        />
      )}
    </div>
  );
}
