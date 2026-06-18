import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  RotateCcw,
  RefreshCw,
  Trash2,
  Globe,
  User,
  Zap,
} from 'lucide-react';
import totvsIcon from '../assets/totvs-icon.svg';
import hostIcon from '../assets/host-icon.svg';
import closeIcon from '../assets/close-icon.svg';
import rmIcon from '../assets/rm-icon.svg';
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
    verboseLogs: boolean;
  };
  hostStatus: boolean | string | null;
  savedProfiles: string[];
  availableAliases: any[];
  loadProfile: (name: string) => void;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  updateSetting: (key: string, value: any) => void;
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
  availableAliases,
  loadProfile,
  setSettings,
  updateSetting,
  setActiveTab,
  setIsAliasModalOpen,
  runProcess,
  runFolderCmd,
  runCommand,
  runDualHost,
}: HomeViewProps) {
  const [isDualModalOpen, setDualModalOpen] = useState(false);
  const [autoStartRm, setAutoStartRm] = useState(false);

  const runProcessRef = useRef(runProcess);
  useEffect(() => {
    runProcessRef.current = runProcess;
  }, [runProcess]);

  useEffect(() => {
    if (autoStartRm && hostStatus === true) {
      setAutoStartRm(false);
      // Aguarda 3 segundos para garantir que o Host (WCF) subiu completamente
      setTimeout(() => {
        runProcessRef.current('rm');
      }, 3000);
    }
  }, [hostStatus, autoStartRm]);

  const handleStartAll = () => {
    if (hostStatus === true) {
      runProcess('rm');
    } else {
      runProcess('host');
      setAutoStartRm(true);
    }
  };
  const [isConfirmDelOpen, setConfirmDelOpen] = useState(false);

  return (
    <div className="view-home animate-in">
      <div className="section-header">
        <span className="section-title">{t.activeEnv}</span>
        <div className={`status-badge ${hostStatus === true ? 'online' : (hostStatus === 'starting' ? 'starting' : (hostStatus === false ? 'offline' : ''))}`}>
          <div className="status-dot"></div>
          {hostStatus === true ? t.connected : (hostStatus === 'starting' ? (lang === 'pt' ? 'Iniciando...' : 'Starting...') : (hostStatus === false ? (lang === 'pt' ? 'Desconectado' : 'Disconnected') : (lang === 'pt' ? 'Verificando...' : 'Checking...')))}
        </div>
      </div>

      <div className="env-selector" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <div className="select-wrapper" style={{ flex: 1, position: 'relative' }}>
          <select
            className="modern-select"
            value={settings.profileName || ''}
            onChange={(e) => {
              if (e.target.value === 'new') {
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
              } else if (e.target.value !== '') {
                loadProfile(e.target.value);
              }
            }}
          >
            <option value="" disabled>Selecione um Perfil...</option>
            {savedProfiles.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="new">+ Adicionar Novo Perfil</option>
          </select>
          <div className="select-icon"><User size={14} /></div>
        </div>

        <div className="select-wrapper" style={{ flex: 1, position: 'relative' }}>
          <select
            className="modern-select"
            value={settings.alias || ''}
            onChange={(e) => updateSetting('alias', e.target.value)}
            disabled={!settings.profileName}
            style={{ opacity: !settings.profileName ? 0.5 : 1, cursor: !settings.profileName ? 'not-allowed' : 'pointer' }}
          >
            <option value="" disabled>
              {!settings.profileName ? 'Selecione um Perfil 1º...' : 'Selecione o Alias...'}
            </option>
            {settings.profileName && availableAliases
              .filter(a => !settings.rmVersion || a.dbVersion === settings.rmVersion)
              .map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
          <div className="select-icon">🏷️</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label className="switch-sm" style={{ margin: 0 }}>
            <input 
              type="checkbox" 
              checked={settings.apagarHost} 
              onChange={(e) => updateSetting('apagarHost', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Deletar _BrokerCustom (apagarHost)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label className="switch-sm" style={{ margin: 0 }}>
            <input 
              type="checkbox" 
              checked={settings.delBroker} 
              onChange={(e) => updateSetting('delBroker', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Deletar Broker</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label className="switch-sm" style={{ margin: 0 }}>
            <input 
              type="checkbox" 
              checked={settings.verboseLogs} 
              onChange={(e) => updateSetting('verboseLogs', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Logs Detalhados</span>
        </div>
      </div>

      {/* Processos RM */}
      <div className="section-header" style={{ marginTop: '24px' }}>
        <span className="section-title" style={{ color: '#fff', fontSize: '14px', fontWeight: 800, textTransform: 'none', marginBottom: '6px' }}>
          Processos RM
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '20px' }}>
        <button 
          className="process-btn" 
          style={{ backgroundColor: 'var(--accent-blue)', color: '#fff', border: 'none' }} 
          onClick={handleStartAll}
          title="Inicia o Host e automaticamente abre o RM quando estiver pronto"
        >
          <img src={totvsIcon} alt="TOTVS" style={{ width: 14, height: 14 }} /> Iniciar
        </button>

        <button className="process-btn" onClick={() => runProcess('rm')} title="Iniciar RM.exe">
          <img src={rmIcon} alt="RM" style={{ width: 14, height: 14 }} /> RM
        </button>

        <button className="process-btn" onClick={() => runProcess('host')} title="Iniciar RM.Host.exe">
          <img src={hostIcon} alt="Host" style={{ width: 14, height: 14 }} /> Host
        </button>

        <button
          className="process-btn process-btn-host2"
          onClick={() => setDualModalOpen(true)}
          title="Iniciar host secundário (RM.Host1.exe)"
        >
          <Zap size={15} /> Host 2
        </button>

        <button className="process-btn process-btn-danger" style={{ gridColumn: 'span 2' }} onClick={() => runProcess('stop')} title="Finalizar e Limpar">
          <img src={closeIcon} alt="Finalizar" style={{ width: 14, height: 14 }} /> Finalizar
        </button>
        <button className="process-btn" style={{ gridColumn: 'span 2' }} onClick={() => runProcess('portal')} title="Abrir Portal Aluno no navegador">
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

        <div className="shortcut-card shortcut-card--danger" onClick={() => setConfirmDelOpen(true)}>
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
      </div>

      {/* Dual Host Modal */}
      {isDualModalOpen && (
        <DualHostModal
          rmVersion={settings.rmVersion}
          onClose={() => setDualModalOpen(false)}
          onStart={runDualHost}
        />
      )}

      {/* Confirm Delete DII Modal */}
      {isConfirmDelOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#1C1C1E', border: '1px solid #3A3A3C', borderRadius: '16px', padding: '24px', width: '320px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Apagar Custom?</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Tem certeza que deseja apagar todas as DLLs da pasta Custom da versão <strong>{settings.rmVersion}</strong>? Essa ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setConfirmDelOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setConfirmDelOpen(false);
                  runFolderCmd('delDiiCustom');
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(250, 93, 93, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', cursor: 'pointer', fontWeight: 600 }}
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
