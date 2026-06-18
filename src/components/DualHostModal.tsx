import { useState, useEffect } from 'react';
import { X, Zap, AlertTriangle } from 'lucide-react';
import './DualHostModal.css';

type Props = {
  rmVersion: string;
  onClose: () => void;
  onStart: (port: string, httpPort: string, apiPort: string) => Promise<void>;
};

const DEFAULT_OFFSET = 3;

export default function DualHostModal({ rmVersion, onClose, onStart }: Props) {
  const [port, setPort]         = useState('');
  const [httpPort, setHttpPort] = useState('');
  const [apiPort, setApiPort]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  // ── On mount: read the primary host's config and suggest offset ports ──
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.readHostConfig) {
      // Fallback defaults if running outside Electron
      setPort(String(8050 + DEFAULT_OFFSET));
      setHttpPort(String(8051 + DEFAULT_OFFSET));
      setApiPort(String(8051 + DEFAULT_OFFSET));
      setFetching(false);
      return;
    }

    api.readHostConfig(rmVersion).then((res: any) => {
      const p  = res.port     ? String(parseInt(res.port)     + DEFAULT_OFFSET) : String(8050 + DEFAULT_OFFSET);
      const hp = res.httpPort ? String(parseInt(res.httpPort) + DEFAULT_OFFSET) : String(8051 + DEFAULT_OFFSET);
      const ap = res.apiPort  ? String(parseInt(res.apiPort)  + DEFAULT_OFFSET) : String(8051 + DEFAULT_OFFSET);
      setPort(p);
      setHttpPort(hp);
      setApiPort(ap);
      setFetching(false);
    }).catch(() => {
      setPort(String(8050 + DEFAULT_OFFSET));
      setHttpPort(String(8051 + DEFAULT_OFFSET));
      setApiPort(String(8051 + DEFAULT_OFFSET));
      setFetching(false);
    });
  }, [rmVersion]);

  // ── Close on Escape key ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleStart = async () => {
    if (!port || !httpPort || !apiPort) return;
    setLoading(true);
    try {
      await onStart(port, httpPort, apiPort);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const isValid = port.trim() !== '' && httpPort.trim() !== '' && apiPort.trim() !== '';

  return (
    <div className="dual-host-overlay" onClick={onClose}>
      <div className="dual-host-card" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="dual-host-header">
          <div className="dual-host-title-block">
            <div className="dual-host-icon">
              <Zap size={18} />
            </div>
            <div>
              <p className="dual-host-title">Dual Host</p>
              <p className="dual-host-subtitle">Host Secundário — RM.Host1.exe</p>
            </div>
          </div>
          <button className="dual-host-close-btn" onClick={onClose} title="Fechar">
            <X size={16} />
          </button>
        </div>

        {/* Port Fields */}
        <div className="dual-host-fields">
          <p className="port-field-label">Portas do Host Secundário</p>
          <div className="port-field-row">
            <div className="port-field">
              <p className="port-field-label">Port</p>
              <input
                className="port-input"
                type="number"
                value={fetching ? '...' : port}
                disabled={fetching || loading}
                onChange={(e) => setPort(e.target.value)}
                placeholder="8053"
                min={1}
                max={65535}
              />
            </div>
            <div className="port-field">
              <p className="port-field-label">HttpPort</p>
              <input
                className="port-input"
                type="number"
                value={fetching ? '...' : httpPort}
                disabled={fetching || loading}
                onChange={(e) => setHttpPort(e.target.value)}
                placeholder="8054"
                min={1}
                max={65535}
              />
            </div>
            <div className="port-field">
              <p className="port-field-label">ApiPort</p>
              <input
                className="port-input"
                type="number"
                value={fetching ? '...' : apiPort}
                disabled={fetching || loading}
                onChange={(e) => setApiPort(e.target.value)}
                placeholder="8054"
                min={1}
                max={65535}
              />
            </div>
          </div>
        </div>

        <div className="dual-host-divider" />

        {/* Warning note */}
        <div className="dual-host-note">
          <AlertTriangle size={13} />
          <span>
            Serão criados <strong>RM.Host1.exe</strong> e <strong>RM.Host1.exe.config</strong> na
            pasta Bin. Inicie o host principal primeiro.
          </span>
        </div>

        {/* CTA */}
        <button
          className="dual-host-cta"
          onClick={handleStart}
          disabled={fetching || loading || !isValid}
        >
          {loading
            ? <><div className="dual-host-spinner" /> Iniciando...</>
            : <><Zap size={15} /> Iniciar Host Secundário</>}
        </button>

      </div>
    </div>
  );
}
