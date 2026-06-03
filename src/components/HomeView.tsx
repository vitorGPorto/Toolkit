import { useState } from 'react';
import {
  Settings,
  RotateCcw,
  RefreshCw,
  Trash2,
  UploadCloud,
  Globe,
  Plus,
  Play,
  Square,
  User,
  Zap,
} from 'lucide-react';
import './HomeView.css';
import DualHostModal from './DualHostModal';

type HomeViewProps = {
  t: any;
  lang: string;
  settings: {
    profileName: string;
    rmVersion: string;
    alias: string;
    autoLogin: boolean;
    delBroker: boolean;
    apagarHost: boolean;
  };
  hostStatus: boolean | string | null;
  savedProfiles: string[];
  loadProfile: (name: string) => void;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  setActiveTab: (tab: string) => void;
  setIsAliasModalOpen: (open: boolean) => void;
  runProcess: (type: 'rm' | 'host' | 'stop' | 'portal') => void;
  runFolderCmd: (cmd: 'openBin' | 'openCustom' | 'delDiiCustom') => void;
  runCommand: (cmd: string) => void;
  runDualHost: (port: string, httpPort: string, apiPort: string) => Promise<void>;
};

export default function HomeView({
  t,
  lang,
  settings,
  hostStatus,
  savedProfiles,
  loadProfile,
  setSettings,
  setActiveTab,
  setIsAliasModalOpen,
  runProcess,
  runFolderCmd,
  runCommand,
  runDualHost,
}: HomeViewProps) {
  const [isDualModalOpen, setDualModalOpen] = useState(false);

  return (
    <div className="view-home animate-in">
      <div className="section-header">
        <span className="section-title">{t.activeEnv}</span>
        <div className={`status-badge ${hostStatus === true ? 'online' : (hostStatus === 'starting' ? 'starting' : (hostStatus === false ? 'offline' : ''))}`}>
          <div className="status-dot"></div>
          {hostStatus === true ? t.connected : (hostStatus === 'starting' ? (lang === 'pt' ? 'Iniciando...' : 'Starting...') : (hostStatus === false ? (lang === 'pt' ? 'Desconectado' : 'Disconnected') : (lang === 'pt' ? 'Verificando...' : 'Checking...')))}
        </div>
      </div>

      <div className="env-selector" style={{ flexWrap: 'wrap' }}>
        <button
          className="env-btn add-env-btn"
          onClick={() => {
            setSettings({
              autoLogin: true,
              delBroker: false,
              verboseLogs: true,
              apagarHost: false,
              profileName: '',
              alias: '',
              rmVersion: '12.1.2402'
            });
            setActiveTab('profile');
          }}
          title="Adicionar Novo Perfil"
        >
          <Plus size={16} />
        </button>
        {savedProfiles.map(p => (
          <button
            key={p}
            className={`env-btn ${settings.profileName === p ? 'active' : ''}`}
            onClick={() => loadProfile(p)}
          >
            <User size={16} /> {p}
          </button>
        ))}
        {savedProfiles.length === 0 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: '8px' }}>Nenhum perfil salvo.</span>
        )}
      </div>

      {/* Processos RM */}
      <div className="section-header" style={{ marginTop: '28px' }}>
        <span className="section-title" style={{ color: '#fff', fontSize: '16px', fontWeight: 800, textTransform: 'none', marginBottom: '8px' }}>
          Processos RM
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className="process-btn" onClick={() => runProcess('rm')}>
          <Play size={16} fill="currentColor" /> RM
        </button>

        <button className="process-btn" onClick={() => runProcess('host')} title="Iniciar RM.Host.exe">
          <Play size={16} fill="currentColor" /> Host
        </button>

        <button
          className="process-btn process-btn-host2"
          onClick={() => setDualModalOpen(true)}
          title="Iniciar host secundário (RM.Host1.exe)"
        >
          <Zap size={15} /> Host 2
        </button>

        <button className="process-btn process-btn-danger" onClick={() => runProcess('stop')}>
          <Square size={16} fill="currentColor" /> Fechar
        </button>
        <button className="process-btn" onClick={() => runProcess('portal')} title="Abrir Portal Aluno no navegador">
          <Globe size={16} /> Portal Aluno
        </button>
      </div>

      {/* Atalhos RM */}
      <div className="section-header">
        <span className="section-title" style={{ color: '#fff', fontSize: '16px', fontWeight: 800, textTransform: 'none', marginBottom: '8px' }}>
          Atalhos RM
        </span>
      </div>

      <div className="shortcuts-grid">
        <div className="shortcut-card" onClick={() => setIsAliasModalOpen(true)}>
          <div className="shortcut-icon-sm">🏷️</div>
          <span>Gerenciar Aliases</span>
        </div>

        <div className="shortcut-card" onClick={() => runFolderCmd('openBin')}>
          <div className="shortcut-icon-sm">📂</div>
          <span>Bin</span>
        </div>

        <div className="shortcut-card" onClick={() => runFolderCmd('openCustom')}>
          <div className="shortcut-icon-sm">📁</div>
          <span>Custom</span>
        </div>

        <div className="shortcut-card shortcut-card--danger" onClick={() => {
          if (window.confirm('Tem certeza que deseja apagar todas as DLLs da pasta Custom?')) {
            runFolderCmd('delDiiCustom');
          }
        }}>
          <div className="shortcut-icon-sm">🗑️</div>
          <span>Del. DII</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-header">
        <span className="section-title" style={{ color: '#fff', fontSize: '16px', fontWeight: 800, textTransform: 'none', marginBottom: '8px' }}>
          {t.quickActions}
        </span>
      </div>

      <div className="actions-grid">
        <div className="action-card" onClick={() => runCommand('iis')}>
          <RotateCcw className="action-icon" />
          <div className="action-info">
            <h3>{t.iisReset}</h3>
            <p>{t.iisDesc}</p>
          </div>
        </div>

        <div className="action-card" onClick={() => runCommand('inetmgr')}>
          <Settings className="action-icon" />
          <div className="action-info">
            <h3>{t.iisManager}</h3>
            <p>{t.iisManagerDesc}</p>
          </div>
        </div>

        <div className="action-card" onClick={() => runCommand('recycle')}>
          <RefreshCw className="action-icon" />
          <div className="action-info">
            <h3>{t.recycle}</h3>
            <p>{t.recycleDesc}</p>
          </div>
        </div>

        <div className="action-card" onClick={() => runCommand('clear')}>
          <Trash2 className="action-icon" />
          <div className="action-info">
            <h3>{t.clearTemp}</h3>
            <p>{t.clearDesc}</p>
          </div>
        </div>

        <div className="action-card" onClick={() => runCommand('bin')}>
          <UploadCloud className="action-icon" />
          <div className="action-info">
            <h3>{t.binUpdate}</h3>
            <p>{t.binDesc}</p>
          </div>
        </div>
      </div>

      {/* Dual Host Modal */}
      {isDualModalOpen && (
        <DualHostModal
          rmVersion={settings.rmVersion}
          onClose={() => setDualModalOpen(false)}
          onStart={runDualHost}
        />
      )}
    </div>
  );
}
