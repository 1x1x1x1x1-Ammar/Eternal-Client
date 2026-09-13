import { useState } from 'react';
import { FolderOpen, RefreshCw, UserPlus, LogIn, Trash2, Check, MessageCircle, ExternalLink } from 'lucide-react';
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

  return <div>
    <div className="page-head">
      <div><small>SETTINGS</small><h1>Control room</h1><p>Launcher paths, Java, memory, accounts and real integration configuration.</p></div>
    </div>

    <div className="settings-grid">
      <section className="settings-card">
        <h3>Accounts</h3>
        <div className="account-list">
          {accounts.map(account => <div className={`account-row ${account.id === active ? 'selected' : ''}`} key={account.id}>
            <div className="avatar"><MinecraftHead skinUrl={account.skinUrl || ''} username={account.username} size={34} /></div>
            <div><b>{account.username}</b><span>{account.type === 'microsoft' ? 'Microsoft / Minecraft' : 'Offline'}</span></div>
            {account.id === active ? <Check /> : <button onClick={async () => { await call(api.accounts.activate(account.id)); refresh(); }}>Use</button>}
            <button className="icon-btn" onClick={async () => { await call(api.accounts.remove(account.id)); refresh(); }}><Trash2 /></button>
          </div>)}
        </div>
        <div className="inline-form">
          <input value={offline} onChange={e => setOffline(e.target.value)} placeholder="Offline username" />
          <button onClick={async () => { await call(api.accounts.addOffline(offline)); setOffline(''); refresh(); }}><UserPlus />Add</button>
        </div>
        <button className="primary wide" onClick={async () => { try { await call(api.accounts.loginMicrosoft()); await refresh(); } catch (e) { alert(e.message); } }}><LogIn />Sign in with Microsoft</button>
      </section>

      <section className="settings-card">
        <h3>Microsoft application</h3>
        <label>Azure / Entra public client ID
          <input value={settings.azureClientId || ''} onChange={e => patch({ azureClientId: e.target.value })} placeholder="Your own application client ID" />
        </label>
        <small className="muted">Eternal never copies another launcher's client ID. Enable public client/device-code flows on your own app registration.</small>
      </section>

      <section className="settings-card">
        <h3>Java</h3>
        <label>Java executable<input value={settings.javaPath || ''} onChange={e => patch({ javaPath: e.target.value })} placeholder="Auto detect if empty" /></label>
        <button className="secondary wide" onClick={async () => setJava(await call(api.java.detect()))}><RefreshCw />Detect Java</button>
        {java.map(runtime => <button className="java-row" key={runtime.path} onClick={() => patch({ javaPath: runtime.path })}><b>Java {runtime.major}</b><span>{runtime.path}</span></button>)}
      </section>

      <section className="settings-card">
        <h3>Game</h3>
        <label>Default memory<div className="range-line"><input type="range" min="2048" max="16384" step="512" value={settings.ramMb || 6144} onChange={e => patch({ ramMb: Number(e.target.value) })} /><b>{((settings.ramMb || 6144) / 1024).toFixed(1)} GB</b></div></label>
        <div className="form-row">
          <label>Width<input type="number" value={settings.resolution?.width || 1280} onChange={e => patch({ resolution: { ...settings.resolution, width: Number(e.target.value) } })} /></label>
          <label>Height<input type="number" value={settings.resolution?.height || 720} onChange={e => patch({ resolution: { ...settings.resolution, height: Number(e.target.value) } })} /></label>
        </div>
      </section>

      <section className="settings-card">
        <h3>Storage</h3>
        <label>Eternal data folder<input value={settings.dataDir || ''} readOnly placeholder="Default Electron user data" /></label>
        <button className="secondary wide" onClick={async () => { const selected = await call(api.dialog.folder()); if (selected) patch({ dataDir: selected }); }}><FolderOpen />Choose folder</button>
        <small className="muted">Changing this setting affects newly resolved paths after restart. Existing data is not silently deleted.</small>
      </section>

      <section className="settings-card integration-settings-card">
        <h3>Integrations</h3>
        <label>Discord invite URL
          <input value={settings.discordInvite || ''} onChange={e => patch({ discordInvite: e.target.value })} placeholder="https://discord.gg/your-server" />
        </label>
        <div className="integration-setting-status">
          <MessageCircle />
          <span>{settings.discordInvite ? 'Sidebar Discord shortcut uses this exact URL.' : 'Discord shortcut stays hidden until a real invite is configured.'}</span>
          {settings.discordInvite?.startsWith('https://') && <button className="icon-btn" onClick={() => api.app.openExternal(settings.discordInvite)} title="Open configured invite"><ExternalLink /></button>}
        </div>
        <small className="muted">Eternal does not ship a fake placeholder invite or pretend an integration is connected.</small>
      </section>
    </div>
  </div>;
}
