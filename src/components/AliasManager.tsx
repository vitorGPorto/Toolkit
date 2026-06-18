import { useState, useEffect } from 'react';
import { 
  Trash2, 
  Database,
  ChevronRight,
  Server,
  Plus,
  Check,
  ArrowLeft
} from 'lucide-react';

export interface AliasConfig {
  id: string;
  name: string;
  rmUser: string;
  rmPass: string;
  dbType: 'sql' | 'oracle';
  server: string;
  base: string;
  dbUser: string;
  dbPass: string;
  runService: boolean;
  jobProcessing: boolean;
  localOnly: boolean;
  processPool: boolean;
  maxThreads: number;
  dbVersion?: string;
}

interface AliasManagerProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function AliasManager({ onClose, onSaved }: AliasManagerProps) {
  const [aliases, setAliases] = useState<AliasConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState<AliasConfig | null>(null);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [isSaved, setIsSaved] = useState(false);

  const api = (window as any).electronAPI;

  const [availableVersions, setAvailableVersions] = useState<string[]>([]);

  useEffect(() => {
    loadAliases();
    loadVersions();
  }, []);

  const loadVersions = async () => {
    if (api && api.loadRMVersions) {
      const versions = await api.loadRMVersions();
      setAvailableVersions(versions);
    }
  };

  const loadAliases = async () => {
    if (api) {
      const data = await api.loadAliases();
      setAliases(data || []);
    } else {
      // Mock data for dev
      const mock: AliasConfig[] = [
        { 
          id: '1', name: 'ALIAS_MATRIZ_PROD', rmUser: 'mestre', rmPass: 'totvs', dbType: 'sql', 
          server: '10.0.0.45', base: 'CNI_2502', dbUser: 'sa', dbPass: 'masterkey',
          runService: true, jobProcessing: false, localOnly: false, processPool: false, maxThreads: 0
        },
        { 
          id: '2', name: 'ALIAS_FILIAL_NORTE', rmUser: 'mestre', rmPass: 'totvs', dbType: 'oracle', 
          server: '192.168.1.12', base: 'RM_DEV', dbUser: 'SYSDBA', dbPass: 'totvs',
          runService: true, jobProcessing: true, localOnly: true, processPool: false, maxThreads: 4
        },
        { 
          id: '3', name: 'DB_SANDBOX_DEV', rmUser: 'mestre', rmPass: 'totvs', dbType: 'sql', 
          server: 'localhost', base: 'RM_DEV', dbUser: 'sa', dbPass: 'totvs',
          runService: false, jobProcessing: false, localOnly: false, processPool: false, maxThreads: 0
        }
      ];
      setAliases(mock);
    }
  };

  const selectAlias = (alias: AliasConfig) => {
    setSelectedId(alias.id);
    setEditingAlias({ ...alias });
    setTestStatus({ loading: false });
    // Scroll to the edit form smoothly if needed
    document.getElementById('edit-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNew = () => {
    const newAlias: AliasConfig = {
      id: Date.now().toString(),
      name: '',
      rmUser: '',
      rmPass: '',
      dbType: 'sql',
      server: '',
      base: '',
      dbUser: '',
      dbPass: '',
      runService: true,
      jobProcessing: false,
      localOnly: false,
      processPool: false,
      maxThreads: 0,
      dbVersion: ''
    };
    setSelectedId(null);
    setEditingAlias(newAlias);
    setTestStatus({ loading: false });
    document.getElementById('edit-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextAliases = aliases.filter(a => a.id !== id);
    setAliases(nextAliases);
    if (api) {
      await api.saveAliases(nextAliases);
      onSaved();
    }
    if (selectedId === id) {
      setSelectedId(null);
      setEditingAlias(null);
    }
  };

  const handleSave = async () => {
    if (!editingAlias) return;
    
    const isUpdating = aliases.some(a => a.id === editingAlias.id);
    const nextAliases = isUpdating 
      ? aliases.map(a => a.id === editingAlias.id ? editingAlias : a)
      : [...aliases, editingAlias];

    setAliases(nextAliases);
    if (api) {
      await api.saveAliases(nextAliases);
      onSaved();
    }
    
    // Refresh selection
    setSelectedId(editingAlias.id);
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const testConnection = async () => {
    if (!editingAlias || !api) return;
    setTestStatus({ loading: true });
    try {
      const result = await api.testDbConnection({
        server: editingAlias.server,
        base: editingAlias.base,
        user: editingAlias.dbUser,
        pass: editingAlias.dbPass,
        type: editingAlias.dbType
      });
      setTestStatus({ loading: false, success: result.success, message: result.message });
    } catch (e) {
      setTestStatus({ loading: false, success: false, message: String(e) });
    }
  };

  return (
    <div className="alias-page-overlay animate-in">
      <div className="alias-page-container">
        
        {/* Header Block */}
        <header className="alias-page-header">
          <div className="title-row" style={{ alignItems: 'flex-start' }}>
            <div>
              <h1>Gerenciar Aliases</h1>
              <p className="page-desc" style={{ marginTop: '8px' }}>Configure e gerencie conexões de banco de dados para a integração de sistemas RM e plataformas satélites.</p>
            </div>
          </div>
        </header>

        {/* Active Connections List */}
        <div className="alias-section">
          <div className="section-header-spaced">
            <span className="section-subtitle">CONEXÕES ATIVAS</span>
            <span className="connection-count">{aliases.length} Total</span>
          </div>

          <div className="connections-list">
            {aliases.map(alias => (
              <div 
                key={alias.id} 
                className={`connection-card ${selectedId === alias.id ? 'active' : ''}`}
                onClick={() => selectAlias(alias)}
              >
                <div className="conn-icon-block">
                  <Database size={16} />
                </div>
                <div className="conn-info">
                  <span className="conn-name">{alias.name || 'Sem Nome'}</span>
                  <span className="conn-meta">
                    {alias.dbType === 'sql' ? 'SQL' : 'Oracle'} • {alias.dbVersion ? `v${alias.dbVersion} • ` : ''} {alias.server || 'Sem host'}
                  </span>
                </div>
                <div className="conn-actions">
                  <button className="delete-icon-btn" onClick={(e) => handleDelete(alias.id, e)}>
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} className="chevron" />
                </div>
              </div>
            ))}
            
            {aliases.length === 0 && (
              <div className="empty-conn-msg">Nenhuma conexão configurada.</div>
            )}
          </div>
          
          {!editingAlias && !selectedId && (
             <button className="add-initial-btn" onClick={handleNew}>
               <Plus size={18} /> Adicionar Novo Alias
             </button>
          )}
        </div>

        {/* Form Container (Mockup-style panel) */}
        {(editingAlias || selectedId) && (
          <div id="edit-form-section" className="alias-form-wrapper">
            <div className="section-header-spaced">
               <span className="section-subtitle">
                 {selectedId ? "EDITAR ALIAS" : "NOVO ALIAS"}
               </span>
               {selectedId && (
                 <button className="new-alias-small-btn" onClick={handleNew}>+ Novo</button>
               )}
            </div>

            {editingAlias && (
              <div className="form-card">
                
                <div className="form-group-vertical">
                  <label>Provedor de Dados</label>
                  <div className="db-segmented-control">
                    <button 
                      className={`segment-btn ${editingAlias.dbType === 'sql' ? 'active' : ''}`}
                      onClick={() => setEditingAlias({...editingAlias, dbType: 'sql'})}
                    >
                      MS SQL Server
                    </button>
                    <button 
                      className={`segment-btn ${editingAlias.dbType === 'oracle' ? 'active' : ''}`}
                      onClick={() => setEditingAlias({...editingAlias, dbType: 'oracle'})}
                    >
                      Oracle
                    </button>
                  </div>
                </div>

                <div className="form-group-vertical">
                  <label>Nome do Alias</label>
                  <input 
                    type="text" 
                    className="mockup-input"
                    value={editingAlias.name} 
                    onChange={e => setEditingAlias({...editingAlias, name: e.target.value})}
                    placeholder="Ex: ALIAS_TREINAMENTO"
                  />
                </div>

                <div className="form-group-vertical">
                  <label>Versão da Base (RM)</label>
                  <select 
                    className="mockup-input"
                    value={editingAlias.dbVersion || ''} 
                    onChange={e => setEditingAlias({...editingAlias, dbVersion: e.target.value})}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="">Selecionar Versão...</option>
                    {availableVersions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    {!availableVersions.includes('12.1.2602') && <option value="12.1.2602">12.1.2602</option>}
                    {!availableVersions.includes('12.1.2502') && <option value="12.1.2502">12.1.2502</option>}
                  </select>
                </div>

                <div className="form-group-vertical">
                  <label>Usuário RM</label>
                  <input 
                    type="text" 
                    className="mockup-input"
                    value={editingAlias.rmUser} 
                    onChange={e => setEditingAlias({...editingAlias, rmUser: e.target.value})}
                    placeholder="mestre"
                  />
                </div>

                <div className="form-group-vertical">
                  <label>Senha RM</label>
                  <input 
                    type="password" 
                    className="mockup-input"
                    value={editingAlias.rmPass} 
                    onChange={e => setEditingAlias({...editingAlias, rmPass: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-divider" style={{ marginTop: '16px' }}></div>

                <div className="section-header-spaced">
                  <span className="section-subtitle">CONFIGURAÇÕES AVANÇADAS</span>
                </div>

                <div className="form-group-vertical">
                  <label>Servidor de Banco</label>
                  <input 
                    type="text" 
                    className="mockup-input"
                    value={editingAlias.server} 
                    onChange={e => setEditingAlias({...editingAlias, server: e.target.value})}
                    placeholder={editingAlias.dbType === 'oracle' ? "Ex: HOST/NOME_DO_SERVICO" : "Ex: SRVDCV156\\SQL2022"}
                  />
                </div>

                {editingAlias.dbType === 'sql' && (
                  <div className="form-group-vertical">
                    <label>Base de Dados</label>
                    <input 
                      type="text" 
                      className="mockup-input"
                      value={editingAlias.base} 
                      onChange={e => setEditingAlias({...editingAlias, base: e.target.value})}
                      placeholder="Ex: CorporeRM"
                    />
                  </div>
                )}
                
                <div className="form-grid-2">
                  <div className="form-group-vertical">
                    <label>Usuário BD</label>
                    <input 
                      type="text" 
                      className="mockup-input"
                      value={editingAlias.dbUser} 
                      onChange={e => setEditingAlias({...editingAlias, dbUser: e.target.value})}
                    />
                  </div>
                  <div className="form-group-vertical">
                    <label>Senha BD</label>
                    <input 
                      type="password" 
                      className="mockup-input"
                      value={editingAlias.dbPass} 
                      onChange={e => setEditingAlias({...editingAlias, dbPass: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group-vertical" style={{ marginTop: '16px' }}>
                  <label>Serviços de Job</label>
                  <div className="mockup-checkbox-col">
                    <label className="mockup-checkbox">
                      <input 
                        type="checkbox" 
                        checked={editingAlias.runService} 
                        onChange={e => setEditingAlias({...editingAlias, runService: e.target.checked})} 
                      />
                      <span>RunService</span>
                    </label>
                    <label className="mockup-checkbox">
                      <input 
                        type="checkbox" 
                        checked={editingAlias.jobProcessing} 
                        onChange={e => setEditingAlias({...editingAlias, jobProcessing: e.target.checked})} 
                      />
                      <span>Habilitar Processamento de Jobs</span>
                    </label>
                    <label className="mockup-checkbox">
                      <input 
                        type="checkbox" 
                        checked={editingAlias.localOnly} 
                        onChange={e => setEditingAlias({...editingAlias, localOnly: e.target.checked})} 
                      />
                      <span>Executar Apenas Jobs Locais</span>
                    </label>
                    <label className="mockup-checkbox">
                      <input 
                        type="checkbox" 
                        checked={editingAlias.processPool} 
                        onChange={e => setEditingAlias({...editingAlias, processPool: e.target.checked})} 
                      />
                      <span>Habilitar pool de processos</span>
                    </label>
                  </div>
                </div>

                <div className="form-group-horizontal">
                  <label>Execuções Simultâneas</label>
                  <input 
                    type="number" 
                    className="mockup-input small-number-input"
                    value={editingAlias.maxThreads} 
                    onChange={e => setEditingAlias({...editingAlias, maxThreads: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="form-divider" style={{ margin: '8px 0' }}></div>

                <div className="action-buttons-stack">
                  <button 
                    className="test-conn-gradient-btn"
                    onClick={testConnection}
                    disabled={testStatus.loading}
                  >
                    {testStatus.loading ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <Server size={18} />
                    )}
                    {testStatus.loading ? 'Testando...' : 'Testar Conexão'}
                  </button>
                  {testStatus.message && (
                    <p className={`test-feedback-msg ${testStatus.success ? 'success' : 'error'}`}>
                      {testStatus.message}
                    </p>
                  )}

                  <button 
                    className="save-action-btn" 
                    onClick={handleSave}
                    style={isSaved ? { backgroundColor: '#34D399', color: '#161618' } : {}}
                  >
                    {isSaved ? (
                      <>
                        <Check size={18} /> Salvo com Sucesso!
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div style={{ marginTop: 'auto', paddingTop: '32px', display: 'flex', justifyContent: 'center' }}>
          <button className="close-btn-modern" onClick={onClose} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            <ArrowLeft size={16} /> Voltar para o Início
          </button>
        </div>
      </div>
    </div>
  );
}
