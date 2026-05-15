import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';

interface AboutViewProps {
  t: any;
  lang: 'pt' | 'en';
}

export default function AboutView({ t, lang }: AboutViewProps) {
  const [version, setVersion] = useState<string>('Carregando...');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const api = (window as any).electronAPI;
        if (api?.getAppVersion) {
          const v = await api.getAppVersion();
          setVersion(v);
        } else {
          setVersion('1.0.3 (Simulação)');
        }
      } catch (e) {
        setVersion('Erro');
      }
    };

    fetchInfo();
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    setError(false);
    try {
      const response = await fetch('https://api.github.com/repos/vitorGPorto/Toolkit/releases/latest');
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      
      let tagName = data.tag_name || '';
      if (tagName.startsWith('v')) tagName = tagName.substring(1);
      
      setLatestVersion(tagName);
      setReleaseUrl(data.html_url);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  const hasUpdate = () => {
    if (!latestVersion || version.includes('Carregando')) return false;
    const v1 = version.replace(/[^0-9.]/g, '').split('.').map(Number);
    const v2 = latestVersion.replace(/[^0-9.]/g, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num2 > num1) return true;
      if (num1 > num2) return false;
    }
    return false;
  };

  const openUrl = (url: string) => {
    const api = (window as any).electronAPI;
    if (api?.openExternalUrl) {
      api.openExternalUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="view-container animate-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #2563EB, #3B82F6)', 
          width: '80px', height: '80px', 
          borderRadius: '20px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="8" width="20" height="13" rx="2" fill="#FFFFFF" />
            <path d="M7 8V5C7 3.9 7.9 3 9 3h6c1.1 0 2 .9 2 2v3" stroke="#DBEAFE" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="14" x2="22" y2="14" stroke="#2563EB" strokeWidth="2" />
          </svg>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>RM Toolkit</h2>
        <p style={{ color: '#A1A1AA', margin: '0 0 24px 0', fontSize: '14px' }}>
          {lang === 'pt' ? 'Central de comando para ambientes TOTVS RM' : 'Command center for TOTVS RM environments'}
        </p>
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272A', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '4px' }}>{t.currentVersion || (lang === 'pt' ? 'Versão Atual' : 'Current Version')}</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              v{version}
              {hasUpdate() && <span style={{ background: '#059669', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', letterSpacing: '0.5px' }}>UPDATE</span>}
            </div>
          </div>
          <button 
            className="icon-btn" 
            onClick={checkForUpdates}
            disabled={checking}
            title={lang === 'pt' ? 'Verificar atualizações' : 'Check for updates'}
          >
            <RefreshCw size={18} className={checking ? 'spin' : ''} />
          </button>
        </div>

        {checking ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A1A1AA', fontSize: '14px', justifyContent: 'center', padding: '12px 0' }}>
            <RefreshCw size={16} className="spin" />
            {lang === 'pt' ? 'Verificando atualizações...' : 'Checking for updates...'}
          </div>
        ) : error ? (
          <div style={{ color: '#EF4444', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>
            {lang === 'pt' ? 'Erro ao verificar atualizações.' : 'Failed to check for updates.'}
          </div>
        ) : hasUpdate() ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <h4 style={{ color: '#10B981', margin: '0 0 8px 0', fontSize: '16px' }}>{lang === 'pt' ? 'Nova Versão Disponível!' : 'New Version Available!'}</h4>
            <p style={{ color: '#A1A1AA', fontSize: '13px', margin: '0 0 16px 0' }}>
              {lang === 'pt' ? `A versão v${latestVersion} já está disponível para download no GitHub.` : `Version v${latestVersion} is now available on GitHub.`}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: '#10B981', color: '#fff', border: 'none' }}
              onClick={() => releaseUrl && openUrl(releaseUrl)}
            >
              <Download size={18} />
              {lang === 'pt' ? 'Baixar Atualização' : 'Download Update'}
            </button>
          </div>
        ) : (
          <div style={{ color: '#10B981', fontSize: '14px', textAlign: 'center', padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            {lang === 'pt' ? 'Você está na versão mais recente.' : 'You are on the latest version.'}
          </div>
        )}
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '14px', color: '#A1A1AA', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {lang === 'pt' ? 'Desenvolvedor' : 'Developer'}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#27272A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="https://github.com/vitorGPorto.png" alt="Vitor Porto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Vitor Porto</div>
            <div style={{ color: '#A1A1AA', fontSize: '13px' }}>Equipe TOTVS RM</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="icon-btn" 
              onClick={() => openUrl('https://github.com/vitorGPorto')}
              title="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.6 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.9 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"></path></svg>
            </button>
            <button 
              className="icon-btn" 
              onClick={() => openUrl('https://www.linkedin.com/in/vitor-porto-/')}
              title="LinkedIn"
              style={{ color: '#0A66C2' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
