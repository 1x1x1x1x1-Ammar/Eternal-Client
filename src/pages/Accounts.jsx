import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, LogIn, Trash2, UserPlus } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { api, call } from '../lib/api.js';

export default function Accounts() {
  const accounts = useEternalStore(s => s.accounts);
  const activeId = useEternalStore(s => s.activeAccountId);
  const refreshAccounts = useEternalStore(s => s.refreshAccounts);
  const [offlineName, setOfflineName] = useState('');
  const [deviceCode, setDeviceCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => api.on.account(event => {
    if (event?.type === 'device-code') setDeviceCode(event);
  }), []);

  async function addOffline() {
    setError('');
    try {
      await call(api.accounts.addOffline(offlineName));
      setOfflineName('');
      await refreshAccounts();
    } catch (e) {
      setError(e.message);
    }
  }

  async function loginMicrosoft() {
    setBusy(true);
    setError('');
    setDeviceCode(null);
    try {
      await call(api.accounts.loginMicrosoft());
      await refreshAccounts();
      setDeviceCode(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="release-page">
    <div className="page-head">
      <div>
        <small>ACCOUNTS</small>
        <h1>Play your way</h1>
        <p>Microsoft for authenticated online play, or deterministic offline profiles for offline-mode testing.</p>
      </div>
    </div>

    <div className="account-page-grid">
      <section className="release-panel account-manager">
        <div className="release-panel-head"><div><small>YOUR PROFILES</small><h2>Minecraft accounts</h2></div><span>{accounts.length}</span></div>
        <div className="account-page-list">
          {accounts.length === 0 && <div className="empty-card big">No account yet. Add Microsoft or an offline profile below.</div>}
          {accounts.map(account => <article key={account.id} className={`account-page-row ${account.id === activeId ? 'selected' : ''}`}>
            <div className="account-page-avatar">{account.skinUrl ? <img src={account.skinUrl} alt="" /> : account.username[0]?.toUpperCase()}</div>
            <div className="account-page-copy"><b>{account.username}</b><span>{account.type === 'microsoft' ? 'Microsoft / Minecraft Java' : 'Offline profile'}</span><small>{account.uuid}</small></div>
            {account.id === activeId ? <div className="account-selected"><Check /> ACTIVE</div> : <button className="secondary" onClick={async () => { await call(api.accounts.activate(account.id)); await refreshAccounts(); }}>Use account</button>}
            <button className="danger-icon" title="Remove account" onClick={async () => { await call(api.accounts.remove(account.id)); await refreshAccounts(); }}><Trash2 /></button>
          </article>)}
        </div>
      </section>

      <aside className="release-stack">
        <section className="release-panel compact-panel">
          <small>MICROSOFT</small><h2>Authenticated play</h2>
          <p>Uses your own Eternal Azure/Entra application ID and validates Minecraft ownership before storing the profile.</p>
          <button className="primary wide" disabled={busy} onClick={loginMicrosoft}><LogIn />{busy ? 'Waiting for Microsoft…' : 'Sign in with Microsoft'}</button>
          {deviceCode && <div className="device-code-card"><span>DEVICE CODE</span><strong>{deviceCode.userCode}</strong><div><button onClick={() => navigator.clipboard.writeText(deviceCode.userCode)}><Copy />Copy</button><button onClick={() => api.app.openExternal(deviceCode.verificationUri)}><ExternalLink />Open Microsoft</button></div></div>}
        </section>

        <section className="release-panel compact-panel">
          <small>OFFLINE</small><h2>Local profile</h2>
          <p>Offline UUIDs use Minecraft's standard <code>OfflinePlayer:&lt;name&gt;</code> namespace. They cannot authenticate to premium online-mode servers.</p>
          <div className="inline-form"><input value={offlineName} onChange={e => setOfflineName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOffline()} placeholder="3–16 character username" /><button onClick={addOffline}><UserPlus />Add</button></div>
        </section>
      </aside>
    </div>

    {error && <div className="release-error">{error}</div>}
  </div>;
}
