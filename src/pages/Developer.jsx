import { useEffect, useState } from 'react';
import { Bug, ExternalLink, FolderOpen, RefreshCw, ShieldCheck, TerminalSquare } from 'lucide-react';
import { api, call } from '../lib/api.js';

export default function Developer() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [java, setJava] = useState([]);
  const [error, setError] = useState('');

  async function refresh() {
    setError('');
    try {
      const [d, j] = await Promise.all([call(api.app.diagnostics()), call(api.java.detect())]);
      setDiagnostics(d);
      setJava(j);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  const rows = diagnostics ? [
    ['Eternal', diagnostics.appVersion], ['Electron', diagnostics.electron], ['Chromium', diagnostics.chromium], ['Node', diagnostics.node], ['Platform', diagnostics.platform], ['Architecture', diagnostics.arch], ['Packaged', diagnostics.packaged ? 'Yes' : 'Development'], ['Data root', diagnostics.dataRoot]
  ] : [];

  return <div className="release-page">
    <div className="page-head"><div><small>DEVELOPER</small><h1>Diagnostics</h1><p>Real runtime information for troubleshooting the launcher and Minecraft environment.</p></div><div className="head-actions"><button className="secondary" onClick={refresh}><RefreshCw />Refresh</button><button className="secondary" onClick={() => api.app.openDataFolder()}><FolderOpen />Data folder</button></div></div>

    <div className="developer-grid">
      <section className="release-panel">
        <div className="release-panel-head"><div><small>RUNTIME</small><h2>Eternal environment</h2></div><ShieldCheck /></div>
        <div className="diagnostic-table">{rows.map(([name, value]) => <div key={name}><span>{name}</span><b title={String(value)}>{String(value)}</b></div>)}</div>
      </section>
      <section className="release-panel">
        <div className="release-panel-head"><div><small>JAVA</small><h2>Detected runtimes</h2></div><TerminalSquare /></div>
        <div className="runtime-list">{java.length === 0 && <div className="empty-state">No Java runtime detected.</div>}{java.map(runtime => <article key={runtime.path}><div><b>Java {runtime.major}</b><span>{runtime.vendor || 'Detected runtime'}</span></div><small title={runtime.path}>{runtime.path}</small></article>)}</div>
      </section>
    </div>

    <section className="release-panel developer-actions">
      <div><Bug /><span><b>Release verification</b><small>GitHub Actions compiles Eternal Core and builds the launcher before a release is published.</small></span></div>
      <button className="secondary" onClick={() => api.app.openExternal('https://github.com/1x1x1x1x1-Ammar/Eternal-Client/actions')}><ExternalLink />Open GitHub Actions</button>
    </section>

    {error && <div className="release-error">{error}</div>}
  </div>;
}
