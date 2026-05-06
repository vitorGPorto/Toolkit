import { Terminal, Trash2 } from 'lucide-react';
import './LogsView.css';

type LogEntry = {
  time: string;
  type: string;
  message: string;
};

type LogsViewProps = {
  t: any;
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
};

export default function LogsView({ t, logs, setLogs }: LogsViewProps) {
  return (
    <div className="view-logs animate-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-title" style={{ margin: 0, padding: '16px' }}>
          <Terminal size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {t.logs}
        </span>
        <button
          className="icon-btn"
          style={{ marginRight: '16px', background: 'var(--bg-active)', borderRadius: '8px' }}
          onClick={() => setLogs([])}
          title="Limpar Logs"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="logs-container">
        {logs.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>Nenhum log disponível.</div>
        ) : (
          logs.map((log, idx) => {
            let color = '#7a8a99';
            if (log.type === 'error' || log.type === 'stderr') color = '#ff4d4f';
            if (log.type === 'info') color = '#4caf50';
            if (log.type === 'stdout') color = '#5ba3d9';

            return (
              <div key={idx} style={{ marginBottom: '8px', borderBottom: '1px solid #222', paddingBottom: '4px' }}>
                <span style={{ color: '#888', marginRight: '8px' }}>[{new Date(log.time).toLocaleTimeString()}]</span>
                <span style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
