import { useEffect, useMemo, useState } from 'react';
import {
  Check, CheckCircle2, Copy, ExternalLink, Image, LogIn, RefreshCw, RotateCcw,
  ShieldCheck, Sparkles, Trash2, Upload, UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEternalStore } from '../store/useEternalStore.js';
import { api, call } from '../lib/api.js';
import MinecraftHead from '../components/MinecraftHead.jsx';
import MinecraftSkinPreview from '../components/MinecraftSkinPreview.jsx';

export default function Accounts() {
  const accounts = useEternalStore(s => s.accounts);
  const activeId = useEternalStore(s => s.activeAccountId);
  const refreshAccounts = useEternalStore(s => s.refreshAccounts);
  const [offlineName, setOfflineName] = useState('');
  const [deviceCode, setDeviceCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [skinBusy, setSkinBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [studioId, setStudioId] = useState(activeId || accounts[0]?.id || '');
  const [variant, setVariant] = useState('classic');
  const [previews, setPreviews] = useState({});

  const studio = useMemo(() => accounts.find(a => a.id === studioId) || accounts.find(a => a.id === activeId) || accounts[0] || null, [accounts, studioId, activeId]);
  const active = accounts.find(a => a.id === activeId) || null;

  useEffect(() => api.on.account(event => {
    if (event?.type === 'device-code') setDeviceCode(event);
  }), []);

  useEffect(() => {
    if (!accounts.length) {
      setStudioId('');
      return;
    }
    if (!accounts.some(a => a.id === studioId)) setStudioId(activeId || accounts[0].id);
  }, [accounts, activeId, studioId]);

  useEffect(() => {
    if (studio) setVariant(studio.skinVariant === 'slim' ? 'slim' : 'classic');
  }, [studio?.id, studio?.skinVariant]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const next = {};
      await Promise.all(accounts.map(async account => {
        try {
          const value = await call(api.accounts.skinPreview(account.id));
          if (value?.dataUrl) next[account.id] = value;
        } catch {}
      }));
      if (!cancelled) setPreviews(current => ({ ...current, ...next }));
    }
    load();
    return () => { cancelled = true; };
  }, [accounts.map(a => `${a.id}:${a.skinUrl || ''}:${a.localSkin ? 1 : 0}`).join('|')]);

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
      const added = await call(api.accounts.addOffline(offlineName));
      setOfflineName('');
      await refreshAccounts();
      setStudioId(added.id);
    }, 'Offline account added and selected.');
  }

  async function loginMicrosoft() {
    setBusy(true);
    setError(''); setMessage(''); setDeviceCode(null);
    try {
      const connected = await call(api.accounts.loginMicrosoft());
      await refreshAccounts();
      setStudioId(connected.id);
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

  async function refreshProfile() {
    if (!studio || studio.type !== 'microsoft') return;
    setSkinBusy(true);
    try {
      await run(async () => {
        await call(api.accounts.refreshProfile(studio.id));
        await refreshAccounts();
        const preview = await call(api.accounts.skinPreview(studio.id));
        setPreviews(value => ({ ...value, [studio.id]: preview }));
      }, 'Minecraft profile, skin and cape refreshed from Mojang.');
    } finally { setSkinBusy(false); }
  }

  async function uploadSkin() {
    if (!studio) return;
    const filePath = await run(() => call(api.dialog.skin()));
    if (!filePath) return;
    setSkinBusy(true);
    try {
      const result = await run(() => call(api.accounts.setSkin({ id: studio.id, filePath, variant })));
      if (!result) return;
      await refreshAccounts();
      if (result.preview) setPreviews(value => ({ ...value, [studio.id]: result.preview }));
      setMessage(result.scope === 'minecraft'
        ? `Skin uploaded to the official Minecraft profile as ${variant}.`
        : `Offline skin saved locally in Eternal as ${variant}.`);
    } finally { setSkinBusy(false); }
  }

  async function resetSkin() {
    if (!studio) return;
    setSkinBusy(true);
    try {
      const result = await run(() => call(api.accounts.resetSkin(studio.id));
      if (!result) return;
      await refreshAccounts();
      setPreviews(value => ({ ...value, [studio.id]: result.preview || { dataUrl: '' } }));
      setMessage(result.scope === 'minecraft' ? 'Minecraft skin reset to the account default.' : 'Local offline skin removed.');
    } finally { setSkinBusy(false); }
  }

  return <div className="release-page beta8-page beta8-accounts-page v101-accounts-page">
    <div className="page-head beta8-page-head v101-account-head">
      <div><small>IDENTITY</small><h1>Accounts + Skin Studio</h1><p>Real Microsoft authentication, deterministic offline profiles, official Minecraft skin changes, and local-only offline cosmetics.</p></div>
      <div className="v101-account-health"><ShieldCheck/><span><b>{active ? active.username : 'NO ACTIVE PROFILE'}</b><small>{active ? `${active.type === 'microsoft' ? 'Microsoft authenticated' : 'Offline profile'} · ${accounts.length} total` : 'Add or select a profile'}</small></span></div>
    </div>

    {(error || message) && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={error ? 'release-error beta8-inline-error' : 'beta8-success'}>{error ? error : <><CheckCircle2/>{message}</>}</motion.div>}

    <section className="v101-account-hero">
      <div className="v101-account-hero-copy">
        <span className="v101-kicker"><Sparkles/> ETERNAL IDENTITY SYSTEM</span>
        <h2>{active?.username || 'Choose your Minecraft identity'}</h2>
        <p>{active ? (active.type === 'microsoft' ? 'This profile launches with a renewable Microsoft/Minecraft session and official online skin.' : 'This profile launches in offline mode. Any skin selected here remains local to Eternal and is never presented as a Mojang account change.') : 'Microsoft accounts support official skin uploads. Offline accounts stay intentionally local.'}</p>
        <div className="v101-identity-facts">
          <span><small>PROFILE TYPE</small><b>{active?.type === 'microsoft' ? 'MICROSOFT' : active ? 'OFFLINE' : '—'}</b></span>
          <span><small>MODEL</small><b>{active?.skinVariant?.toUpperCase() || 'CLASSIC'}</b></span>
          <span><small>CAPE</small><b>{active?.capeName || (active?.type === 'microsoft' ? 'NONE ACTIVE' : 'LOCAL MODE')}</b></span>
        </div>
      </div>
      <div className="v101-active-head">{active ? <MinecraftHead skinUrl={previews[active.id]?.dataUrl || active.skinUrl || ''} username={active.username} size={88}/> : <UserPlus/>}<i/></div>
    </section>

    <div className="v101-account-layout">
      <section className="release-panel account-manager beta8-account-manager v101-account-manager">
        <div className="release-panel-head"><div><small>PROFILES</small><h2>Minecraft accounts</h2></div><span>{accounts.length}</span></div>
        <div className="v101-account-list">
          {accounts.length === 0 && <div className="empty-card big beta8-empty"><UserPlus/><b>No account yet</b><span>Connect Microsoft for premium online play or create an offline identity for local/offline-mode testing.</span></div>}
          {accounts.map((account, index) => <motion.article key={account.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .025 }} className={`v101-account-row ${account.id === activeId ? 'selected' : ''} ${account.id === studio?.id ? 'studio' : ''}`} onClick={() => setStudioId(account.id)}>
            <div className="v101-account-avatar"><MinecraftHead skinUrl={previews[account.id]?.dataUrl || account.skinUrl || ''} username={account.username} size={48}/><span className={account.type === 'microsoft' ? 'online' : 'offline'}/></div>
            <div className="v101-account-copy"><div><b>{account.username}</b>{account.id === activeId && <em><Check/> ACTIVE</em>}</div><span>{account.type === 'microsoft' ? 'Microsoft · Minecraft Java' : 'Offline · local identity'}</span><small>{account.uuid}</small></div>
            <div className="v101-account-row-actions" onClick={event => event.stopPropagation()}>
              {account.id !== activeId && <button className="secondary" onClick={() => run(async () => { await call(api.accounts.activate(account.id)); await refreshAccounts(); }, `Using ${account.username}.`)}>Use</button>}
              <button className="danger-icon" title="Remove account" onClick={() => run(async () => { await call(api.accounts.remove(account.id)); await refreshAccounts(); }, `${account.username} removed.`)}><Trash2/></button>
            </div>
          </motion.article>)}
        </div>
      </section>

      <aside className="v101-skin-studio">
        <section className="v101-skin-stage">
          <div className="v101-skin-stage-head"><span><Image/><b>SKIN STUDIO</b></span><small>{studio?.type === 'microsoft' ? 'OFFICIAL MINECRAFT PROFILE' : 'LOCAL OFFLINE PREVIEW'}</small></div>
          <div className="v101-skin-visual"><div className="v101-skin-aura"/><MinecraftSkinPreview dataUrl={studio ? previews[studio.id]?.dataUrl || '' : ''} variant={variant}/><div className="v101-skin-floor"/></div>
          <div className="v101-skin-name"><b>{studio?.username || 'No profile selected'}</b><span>{studio ? `${variant.toUpperCase()} model · ${studio.type === 'microsoft' ? 'Minecraft Services' : 'Eternal local storage'}` : 'Select an account'}</span></div>
          <div className="v101-model-switch"><button className={variant === 'classic' ? 'active' : ''} disabled={!studio || skinBusy} onClick={() => setVariant('classic')}>CLASSIC</button><button className={variant === 'slim' ? 'active' : ''} disabled={!studio || skinBusy} onClick={() => setVariant('slim')}>SLIM</button></div>
          <div className="v101-skin-actions">
            <button className="primary" disabled={!studio || skinBusy} onClick={uploadSkin}><Upload/>{skinBusy ? 'Working…' : 'Choose & apply PNG'}</button>
            <button className="secondary" disabled={!studio || skinBusy} onClick={resetSkin}><RotateCcw/>Reset</button>
            {studio?.type === 'microsoft' && <button className="icon-btn" title="Refresh profile cosmetics from Minecraft Services" disabled={skinBusy} onClick={refreshProfile}><RefreshCw className={skinBusy ? 'spin' : ''}/></button>}
          </div>
          <p className="v101-skin-scope">{studio?.type === 'microsoft' ? 'Microsoft skins are uploaded through the authenticated Minecraft Services skin endpoint and will appear anywhere Mojang serves your profile.' : 'Offline skins are deliberately local to Eternal. They are never uploaded to Mojang and do not claim to change premium-server cosmetics.'}</p>
        </section>
      </aside>
    </div>

    <div className="v101-auth-grid">
      <section className="release-panel compact-panel beta8-auth-card v101-auth-card">
        <small>MICROSOFT</small><h2>Authenticated Java profile</h2>
        <p>Device-code login uses your configured Entra/Azure public-client ID, verifies Minecraft ownership, and stores renewable session state locally.</p>
        <button className="primary wide" disabled={busy} onClick={loginMicrosoft}><LogIn/>{busy ? 'Waiting for Microsoft…' : 'Sign in with Microsoft'}</button>
        {deviceCode && <div className="device-code-card beta8-device-code"><span>DEVICE CODE</span><strong>{deviceCode.userCode}</strong><small>Complete this code on Microsoft's verification page.</small><div><button onClick={copyCode}><Copy/>Copy</button><button onClick={openMicrosoft}><ExternalLink/>Open Microsoft</button></div></div>}
      </section>

      <section className="release-panel compact-panel beta8-auth-card v101-auth-card">
        <small>OFFLINE</small><h2>Local Minecraft identity</h2>
        <p>Offline UUIDs use Minecraft's standard <code>OfflinePlayer:&lt;name&gt;</code> namespace. Premium online-mode authentication is intentionally unavailable.</p>
        <div className="inline-form"><input value={offlineName} onChange={e => setOfflineName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOffline()} placeholder="3–16 character username"/><button disabled={!offlineName.trim()} onClick={addOffline}><UserPlus/>Add</button></div>
      </section>
    </div>
  </div>;
}
