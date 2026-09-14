import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, LogIn, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { api, call } from '../lib/api.js';
import MinecraftHead from '../components/MinecraftHead.jsx';

export default function Accounts() {
  const accounts = useEternalStore(s => s.accounts);
  const activeId = useEternalStore(s => s.activeAccountId);
  const refreshAccounts = useEternalStore(s => s.refreshAccounts);
  const [offlineName, setOfflineName] = useState('');
  const [deviceCode, setDeviceCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => api.on.account(event => {
    if (event?.type === 'device-code') setDeviceCode(event);
  }), []);

  async function run(fn, success = '') {
    setError(''); setMessage('');
    try {
      const result = await fn();
      if (success) setMessage(success);
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }

  async function addOffline() {
    if (!offlineName.trim()) return;
    await run(async () => {
      await call(api.accounts.addOffline(offlineName));
      setOfflineName('');
      await refreshAccounts();
    }, 'Offline account added and selected.');
  }

  async function loginMicrosoft() {
    setBusy(true);
    setError(''); setMessage(''); setDeviceCode(null);
    try {
      await call(api.accounts.loginMicrosoft());
      await refreshAccounts();
      setDeviceCode(null);
      setMessage('Microsoft Minecraft account connected and selected.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!deviceCode?.userCode) return;
    try {
      await navigator.clipboard.writeText(deviceCode.userCode);
      setMessage('Device code copied.');
    } catch {
      setError('Could not copy the device code automatically. Select and copy it manually.');
    }
  }

  async function openMicrosoft() {
    if (!deviceCode?.verificationUri) return;
    await run(() => call(api.app.openExternal(deviceCode.verificationUri)));
  }

  return <div className="release-page beta8-page beta8-accounts-page">
    <div className="page-head beta8-page-head">
      <div><small>ACCOUNTS</small><h1>Play your way.</h1><p>Authenticated Microsoft Minecraft Java profiles and deterministic offline profiles, with no fake account state.</p></div>
      <div className="beta8-settings-health"><ShieldCheck/><span><b>{accounts.length} profile{accounts.length === 1 ? '' : 's'}</b><small>{activeId ? 'Active account selected' : 'Select or add an account'}</small></span></div>
    </div>

    {(error || message) && <div className={error ? 'release-error beta8-inline-error' : 'beta8-success'}>{error ? error : <><CheckCircle2/>{message}</>}</div>}

    <div className="account-page-grid beta8-account-grid">
      <section className="release-panel account-manager beta8-account-manager">
        <div className="release-panel-head"><div><small>YOUR PROFILES</small><h2>Minecraft accounts</h2></div><span>{accounts.length}</span></div>
        <div className="account-page-list">
          {accounts.length === 0 && <div className="empty-card big beta8-empty"><UserPlus/><b>No account yet</b><span>Add Microsoft for premium online-mode play, or an offline profile for offline-mode testing.</span></div>}
          {accounts.map(account => <article key={account.id} className={`account-page-row ${account.id === activeId ? 'selected' : ''}`}>
            <div className="account-page-avatar"><MinecraftHead skinUrl={account.skinUrl || ''} username={account.username} size={42}/></div>
            <div className="account-page-copy"><b>{account.username}</b><span>{account.type === 'microsoft' ? 'Microsoft / Minecraft Java' : 'Offline profile'}</span><small>{account.uuid}</small></div>
            {account.id === activeId ? <div className="account-selected"><Check/> ACTIVE</div> : <button className="secondary" onClick={() => run(async () => { await call(api.accounts.activate(account.id)); await refreshAccounts(); }, `Using ${account.username}.`)}>Use account</button>}
            <button className="danger-icon" title="Remove account" onClick={() => run(async () => { await call(api.accounts.remove(account.id)); await refreshAccounts(); }, `${account.username} removed.`)}><Trash2/></button>
          </article>)}
        </div>
      </section>

      <aside className="release-stack beta8-account-stack">
        <section className="release-panel compact-panel beta8-auth-card">
          <small>MICROSOFT</small><h2>Authenticated play</h2>
          <p>Uses your own Eternal Azure/Entra public-client application and verifies Minecraft ownership before the profile is stored.</p>
          <button className="primary wide" disabled={busy} onClick={loginMicrosoft}><LogIn/>{busy ? 'Waiting for Microsoft…' : 'Sign in with Microsoft'}</button>
          {deviceCode && <div className="device-code-card beta8-device-code"><span>DEVICE CODE</span><strong>{deviceCode.userCode}</strong><small>Complete this code on Microsoft's verification page. Eternal only stores the resulting Minecraft session locally.</small><div><button onClick={copyCode}><Copy/>Copy</button><button onClick={openMicrosoft}><ExternalLink/>Open Microsoft</button></div></div>}
        </section>

        <section className="release-panel compact-panel beta8-auth-card">
          <small>OFFLINE</small><h2>Local profile</h2>
          <p>Offline UUIDs use Minecraft's standard <code>OfflinePlayer:&lt;name&gt;</code> namespace and cannot authenticate to premium online-mode servers.</p>
          <div className="inline-form"><input value={offlineName} onChange={e => setOfflineName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOffline()} placeholder="3–16 character username"/><button disabled={!offlineName.trim()} onClick={addOffline}><UserPlus/>Add</button></div>
        </section>
      </aside>
    </div>
  </div>;
}
