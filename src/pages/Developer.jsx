import { useEffect, useState } from 'react';
import { AlertTriangle, Bug, ExternalLink, FolderOpen, RefreshCw, ShieldCheck, TerminalSquare } from 'lucide-react';
import { api, call } from '../lib/api.js';

export default function Developer() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [java, setJava] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true); setError('');
    try {
      const [d, j] = await Promise.all([call(api.app.diagnostics()), call(api.java.detect())]);
      setDiagnostics(d);
      setJava(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function action(fn) {
    setError('');
    try { await fn(); }
    catch (e) { setError(e.message); }
  }

  useEffect(() => { refresh(); }, []);

  const rows = diagnostics ? [
    ['Eternal', diagnostics.appVersion], ['Electron', diagnostics.electron], ['Chromium', diagnostics.chromium], ['Node', diagnostics.node], ['V8', diagnostics.v8], ['Platform', diagnostics.platform], ['Architecture', diagnostics.arch], ['Packaged', diagnostics.packaged ? 'Yes' : 'Development'], ['Data root', diagnostics.dataRoot], ['App path', diagnostics.appPath]
  ] : [];

  return <div className="release-page beta8-page beta8-developer-page">
    <div className="page-head beta8-page-head"><div><small>DEVELOPER</small><h1>Diagnostics</h1><p>Real runtime information for troubleshooting the launcher, Java and release environment.</p></div><div className="head-actions"><button className="secondary" disabled={busy} onClick={refresh}><RefreshCw className={busy ? 'spin' : ''}/>{busy ? 'Refreshing…' : 'Refresh'}</button><button className="secondary" onClick={() => action(() => call(api.app.openDataFolder()))}><FolderOpen/>Data folder</button></div></div>

    {error && <div className="release-error beta8-inline-error"><AlertTriangle/>{error}</div>}

    <div className="developer-grid beta8-developer-grid">
      <section className="release-panel beta8-developer-panel">
        <div className="release-panel-head"><div><small>RUNTIME</small><h2>Eternal environment</h2></div><ShieldCheck/></div>
        <div className="diagnostic-table">{rows.map(([name, value]) => <div key={name}><span>{name}</span><b title={String(value ?? '')}>{String(value ?? '—')}</b></div>)}</div>
      </section>
      <section className="release-panel beta8-developer-panel">
        <div className="release-panel-head"><div><small>JAVA</small><h2>Detected runtimes</h2></div><TerminalSquare/></div>
        <div className="runtime-list">{java.length === 0 && <div className="empty-state">No Java runtime detected.</div>}{java.map(runtime => <article key={runtime.path}><div><b>Java {runtime.major}</b><span>{runtime.version || runtime.vendor || 'Detected runtime'}</span></div><small title={runtime.path}>{runtime.path}</small></article>)}</div>
      </section>
    </div>

    <section className="release-panel developer-actions beta8-developer-actions">
      <div><Bug/><span><b>Release verification</b><small>CI compiles Eternal Core, runs launcher tests, builds the Vite renderer, packages Windows and boots the packaged EXE before a beta is published.</small></span></div>
      <button className="secondary" onClick={() => action(() => call(api.app.openExternal('https://github.com/1x1x1x1x1-Ammar/Eternal-Client/actions')))}><ExternalLink/>Open GitHub Actions</button>
    </section>
  </div>;
}
