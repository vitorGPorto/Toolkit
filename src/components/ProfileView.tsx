import { RefreshCw, Save, Plus } from 'lucide-react';
import CustomSelect from './CustomSelect';
import './ProfileView.css';

type ProfileSettings = {
  autoLogin: boolean;
  delBroker: boolean;
  verboseLogs: boolean;
  apagarHost: boolean;
  alias: string;
  rmVersion: string;
};

type SettingsKey = 'autoLogin' | 'delBroker' | 'verboseLogs' | 'apagarHost' | 'profileName' | 'alias' | 'rmVersion';

type ProfileViewProps = {
  t: any;
  lang: string;
  settings: {
    profileName: string;
    rmVersion: string;
    alias: string;
    autoLogin: boolean;
    delBroker: boolean;
    verboseLogs: boolean;
    apagarHost: boolean;
  };
  availableRMVersions: string[];
  availableAliases: any[];
  profilesData: Record<string, ProfileSettings>;
  setProfilesData: React.Dispatch<React.SetStateAction<Record<string, ProfileSettings>>>;
  updateSetting: (key: SettingsKey, value: string) => void;
  toggleSetting: (key: SettingsKey) => void;
  refreshVersions: () => void;
  setIsAliasModalOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  deleteProfile: () => void;
  persistProfiles: (data: Record<string, ProfileSettings>) => void;
};

export default function ProfileView({
  t,
  lang,
  settings,
  availableRMVersions,
  availableAliases,
  profilesData: _profilesData,
  setProfilesData,
  updateSetting,
  toggleSetting,
  refreshVersions,
  setIsAliasModalOpen,
  showToast,
  deleteProfile,
  persistProfiles,
}: ProfileViewProps) {
  const handleSave = async () => {
    const name = settings.profileName.trim();
    if (!name) {
      showToast('⚠️ Digite um nome para o perfil!');
      return;
    }
    const profileEntry: ProfileSettings = {
      autoLogin: settings.autoLogin,
      delBroker: settings.delBroker,
      verboseLogs: settings.verboseLogs,
      apagarHost: settings.apagarHost,
      alias: settings.alias,
      rmVersion: settings.rmVersion,
    };
    setProfilesData(prev => {
      const next = { ...prev, [name]: profileEntry };
      persistProfiles(next);
      return next;
    });
    if ((window as any).electronAPI) {
      await (window as any).electronAPI.saveProfile(settings);
    }
    showToast(`✅ Perfil "${name}" salvo!`);
  };

  return (
    <div className="view-settings animate-in">
      <div className="profile-badge">
        <div className="status-dot"></div>
        ACTIVE PROFILE: {settings.profileName || 'SYSTEM_ROOT'}
      </div>

      <h2 className="settings-title">{t.settings}</h2>
      <p className="settings-desc">{t.settingsDesc}</p>

      <div className="settings-list">

        {/* Profile Name */}
        <div className="input-group">
          <label>{t.profileName}</label>
          <input
            type="text"
            value={settings.profileName}
            onChange={e => updateSetting('profileName', e.target.value)}
            placeholder={t.profileNamePH}
          />
        </div>

        {/* Versão RM */}
        <div className="input-group">
          <label>Versão RM</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <CustomSelect
              value={settings.rmVersion}
              onChange={(val) => updateSetting('rmVersion', val)}
              options={availableRMVersions.map(v => ({ label: v, value: v }))}
              placeholder="Selecionar Versão..."
            />
            <button
              className="icon-btn"
              title="Recarregar Pastas"
              style={{ background: 'var(--bg-active)', borderRadius: '8px', width: '40px' }}
              onClick={refreshVersions}
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Alias */}
        <div className="input-group">
          <label>{t.alias}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <CustomSelect
              value={settings.alias}
              onChange={(val) => updateSetting('alias', val)}
              options={availableAliases
                .filter(a => !settings.rmVersion || a.dbVersion === settings.rmVersion)
                .map(a => ({ label: a.name, value: a.name }))
              }
              placeholder={lang === 'pt' ? 'Selecionar Alias...' : 'Select Alias...'}
            />
            <button
              className="icon-btn"
              style={{ background: 'var(--bg-active)', borderRadius: '8px', width: '40px' }}
              onClick={() => setIsAliasModalOpen(true)}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Switches */}
        <div className="setting-item">
          <div className="setting-info">
            <h4>{t.autoLogin}</h4>
            <p>{t.autoLoginDesc}</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.autoLogin} onChange={() => toggleSetting('autoLogin')} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h4>{t.delBroker}</h4>
            <p>{t.delBrokerDesc}</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.delBroker} onChange={() => toggleSetting('delBroker')} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h4>{t.verboseLogs}</h4>
            <p>{t.verboseLogsDesc}</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.verboseLogs} onChange={() => toggleSetting('verboseLogs')} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item text-danger">
          <div className="setting-info">
            <h4>{t.apagarHost}</h4>
            <p style={{ color: '#8E8E93' }}>{t.apagarHostDesc}</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.apagarHost} onChange={() => toggleSetting('apagarHost')} />
            <span className="slider"></span>
          </label>
        </div>

      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '24px', marginBottom: '24px', alignItems: 'stretch' }}>
        <button className="save-btn" style={{ flex: 1, margin: 0 }} onClick={handleSave}>
          {t.saveProfile} <Save size={18} />
        </button>
        <button
          onClick={deleteProfile}
          title="Apagar perfil"
          style={{
            flex: 1,
            background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.4)',
            color: '#FF3B30', borderRadius: '12px', padding: '0',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
