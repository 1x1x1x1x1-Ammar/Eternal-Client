import { useState } from 'react';
import {
  Check, ExternalLink, FolderOpen, Gauge, LogIn, MessageCircle, RefreshCw,
  ShieldCheck, Trash2, UserPlus, WandSparkles
} from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import MinecraftHead from '../components/MinecraftHead.jsx';

export default function Settings() {
  const settings = useEternalStore(s => s.settings) || {};
  const patch = useEternalStore(s => s.patchSettings);
  const accounts = useEternalStore(s => s.accounts);
  const active = useEternalStore(s => s.activeAccountId);
  const refresh = useEternalStore(s => s.refreshAccounts);
  const [offline, setOffline] = useState('');
  const [java, setJava] = useState([]);
  const [javaStatus, setJavaStatus] = useState(null);
  const [busyJava, setBusyJava] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  async function act(fn, success = '') {
    setError(''); setSaved('');
    try {
      const result = await fn();
      if (success) setSaved(success);
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }

  async function detectJava() {
    setBusyJava(true); setJavaStatus(null);
    const result = await act(() => call(api.java.detect()));
    if (result) setJava(result);
    setBusyJava(false);
  }

  async function validateJava(value = settings.javaPath) {
    if (!value) { setJavaStatus(null); return; }
    setBusyJava(true); setError('');
    try {
      const runtime = await call(api.java.validate(value));
      setJavaStatus(runtime || { invalid: true });
    } catch (e) { setError(e.message); }
    finally { setBusyJava(false); }
  }

  async function chooseJava() {
    const chosen = await act(() => call(api.dialog.java()));
    if (!chosen) return;
    await patch({ javaPath: chosen });
    await validateJava(chosen);
  }

  const discordValid = (() => {
    try {
      const url = new URL(settings.discordInvite || '');
      return url.protocol === 'https:' && (url.hostname === 'discord.gg' || url.hostname === 'discord.com');
    } catch { return false; }
  })();

  return <div className="beta8-page beta8-settings-page">
    <div className="page-head beta8-page-head"><div><small>SETTINGS</small><h1>Control room</h1><p>Every control below changes a real launcher value or invokes a real backend action.</p></div><div className="beta8-settings-health"><ShieldCheck/><span><b>Local-first</b><small>Settings stored on this PC</small></span></div></div>

    {(error || saved) && <div className={error ? 'release-error beta8-inline-error' : 'beta8-success'}>{error || saved}</div>}

    <div className="settings-grid beta8-settings-grid">
      <section className="settings-card beta8-settings-card">
        <div className="beta8-card-title"><UserPlus/><div><h3>Accounts</h3><small>Launcher identity</small></div></div>
        <div className="account-list">
          {accounts.map(account => <div className={`account-row ${account.id === active ? 'selected' : ''}`} key={account.id}>
            <div className="avatar"><MinecraftHead skinUrl={account.skinUrl || ''} username={account.username} size={34}/></div>
            <div><b>{account.username}</b><span>{account.type === 'microsoft' ? 'Microsoft / Minecraft' : 'Offline'}</span></div>
            {account.id === active ? <Check/> : <button onClick={() => act(async () => { await call(api.accounts.activate(account.id)); await refresh(); }, `Using ${account.username}`)}>Use</button>}
            <button className="icon-btn" title="Remove account" onClick={() => act(async () => { await call(api.accounts.remove(account.id)); await refresh(); })}><Trash2/></button>
          </div>)}
          {!accounts.length && <div className="empty-card">No Minecraft account added.</div>}
        </div>
        <div className="inline-form"><input value={offline} onChange={e => setOffline(e.target.value)} onKeyDown={e => e.key === 'Enter' && offline && act(async () => { await call(api.accounts.addOffline(offline)); setOffline(''); await refresh(); }, 'Offline account added.')} placeholder="Offline username"/><button disabled={!offline.trim()} onClick={() => act(async () => { await call(api.accounts.addOffline(offline)); setOffline(''); await refresh(); }, 'Offline account added.')}><UserPlus/>Add</button></div>
        <button className="primary wide" onClick={() => act(async () => { await call(api.accounts.loginMicrosoft()); await refresh(); }, 'Microsoft account connected.')}><LogIn/>Sign in with Microsoft</button>
      </section>

      <section className="settings-card beta8-settings-card">
        <div className="beta8-card-title"><ShieldCheck/><div><h3>Microsoft application</h3><small>OAuth configuration</small></div></div>
        <label>Azure / Entra public client ID<input value={settings.azureClientId || ''} onChange={e => patch({ azureClientId: e.target.value })} placeholder="Your own application client ID"/></label>
        <small className="muted">Eternal uses your public-client/device-code application registration. It does not borrow another launcher's client ID.</small>
      </section>

      <section className="settings-card beta8-settings-card beta8-java-card">
        <div className="beta8-card-title"><Gauge/><div><h3>Java runtime</h3><small>Validated before launch</small></div></div>
        <label>Java executable or JDK folder<input value={settings.javaPath || ''} onChange={e => { setJavaStatus(null); patch({ javaPath: e.target.value }); }} onBlur={() => validateJava()} placeholder="Auto detect if empty"/></label>
        <div className="beta8-button-row"><button className="secondary" disabled={busyJava} onClick={chooseJava}><FolderOpen/>Browse</button><button className="secondary" disabled={busyJava} onClick={detectJava}><RefreshCw/>{busyJava ? 'Checking…' : 'Detect'}</button><button className="secondary" disabled={busyJava || !settings.javaPath} onClick={() => validateJava()}><Check/>Validate</button></div>
        {javaStatus && <div className={`beta8-runtime-status ${javaStatus.invalid ? 'bad' : 'good'}`}>{javaStatus.invalid ? 'Configured path is not a working Java runtime.' : <><b>Java {javaStatus.major}</b><span>{javaStatus.version} · {javaStatus.path}</span></>}</div>}
        {java.length > 0 && <div className="beta8-runtime-picker">{java.map(runtime => <button key={runtime.path} onClick={async () => { await patch({ javaPath: runtime.path }); setJavaStatus(runtime); }}><b>Java {runtime.major}</b><span>{runtime.path}</span><small>{runtime.version}</small></button>)}</div>}
      </section>

      <section className="settings-card beta8-settings-card">
        <div className="beta8-card-title"><WandSparkles/><div><h3>Game & interface</h3><small>Real launch parameters</small></div></div>
        <label>Default memory<div className="range-line"><input type="range" min="2048" max="16384" step="512" value={settings.ramMb || 6144} onChange={e => patch({ ramMb: Number(e.target.value) })}/><b>{((settings.ramMb || 6144) / 1024).toFixed(1)} GB</b></div></label>
        <div className="form-row"><label>Width<input type="number" min="640" max="7680" value={settings.resolution?.width || 1280} onChange={e => patch({ resolution: { ...settings.resolution, width: Number(e.target.value) } })}/></label><label>Height<input type="number" min="360" max="4320" value={settings.resolution?.height || 720} onChange={e => patch({ resolution: { ...settings.resolution, height: Number(e.target.value) } })}/></label></div>
        <label className="beta8-toggle-row"><span><b>Reduced motion</b><small>Disables page transition motion</small></span><input type="checkbox" checked={Boolean(settings.reducedMotion)} onChange={e => patch({ reducedMotion: e.target.checked })}/></label>
      </section>

      <section className="settings-card beta8-settings-card">
        <div className="beta8-card-title"><FolderOpen/><div><h3>Storage</h3><small>Managed instance root</small></div></div>
        <label>Eternal data folder<input value={settings.dataDir || ''} readOnly placeholder="Default Electron user data"/></label>
        <div className="beta8-button-row"><button className="secondary" onClick={async () => { const selected = await act(() => call(api.dialog.folder())); if (selected) { await patch({ dataDir: selected }); setSaved('Managed data root updated. Refresh Instances to read the new root.'); } }}><FolderOpen/>Choose folder</button><button className="secondary" onClick={() => act(() => api.app.openDataFolder())}><ExternalLink/>Open current</button></div>
        <small className="muted">Changing the root never deletes or migrates existing files automatically.</small>
      </section>

      <section className="settings-card integration-settings-card beta8-settings-card">
        <div className="beta8-card-title"><MessageCircle/><div><h3>Discord shortcut</h3><small>Optional external integration</small></div></div>
        <label>Discord invite URL<input value={settings.discordInvite || ''} onChange={e => patch({ discordInvite: e.target.value })} placeholder="https://discord.gg/your-server"/></label>
        <div className={`integration-setting-status ${settings.discordInvite && !discordValid ? 'invalid' : ''}`}><MessageCircle/><span>{!settings.discordInvite ? 'Sidebar shortcut stays hidden until a real invite is configured.' : discordValid ? 'Valid Discord invite. Sidebar shortcut is enabled.' : 'Invite must use https://discord.gg or https://discord.com.'}</span>{discordValid && <button className="icon-btn" onClick={() => api.app.openExternal(settings.discordInvite)} title="Open configured invite"><ExternalLink/></button>}</div>
      </section>
    </div>
  </div>;
}
