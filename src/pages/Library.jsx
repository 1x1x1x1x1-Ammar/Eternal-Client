import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import ProfileCard from '../components/ProfileCard.jsx';
import { call, api } from '../lib/api.js';

export default function Library() {
  const instances = useEternalStore(s => s.instances);
  const refresh = useEternalStore(s => s.refreshInstances);
  const [show, setShow] = useState(false);
  const [versions, setVersions] = useState([]);
  const [latest, setLatest] = useState('1.21.11');
  const [versionError, setVersionError] = useState('');
  const [busyVersions, setBusyVersions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', minecraftVersion: '1.21.11', loader: 'fabric', ramMb: 6144 });

  async function loadVersions() {
    setBusyVersions(true);
    setVersionError('');
    try {
      const result = await call(api.instances.versions({ includeSnapshots: false, limit: 140 }));
      setVersions(result.versions || []);
      const release = result.latest?.release || result.versions?.[0]?.id || '1.21.11';
      setLatest(release);
      setForm(value => ({ ...value, minecraftVersion: value.minecraftVersion || release }));
    } catch (e) {
      setVersionError(e.message);
    } finally {
      setBusyVersions(false);
    }
  }

  useEffect(() => { loadVersions(); }, []);

  const releaseIds = useMemo(() => new Set(versions.map(version => version.id)), [versions]);

  async function create() {
    setError('');
    const name = form.name.trim();
    if (!name) return setError('Give this instance a name.');
    if (!form.minecraftVersion.trim()) return setError('Choose a Minecraft version.');
    if (versions.length && !releaseIds.has(form.minecraftVersion)) return setError('Choose a version returned by Mojang metadata.');
    setCreating(true);
    try {
      await call(api.instances.create({ ...form, name }));
      await refresh();
      setShow(false);
      setForm(value => ({ ...value, name: '' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  return <div className="beta8-page beta8-library-page">
    <div className="page-head beta8-page-head"><div><small>GAME LIBRARY</small><h1>Your Minecraft instances</h1><p>Every profile has its own game directory, mods, saves, settings and runtime state.</p></div><div className="head-actions"><button className="secondary" onClick={() => refresh()}><RefreshCw/>Refresh</button><button className="primary" onClick={() => { setError(''); setShow(true); }}><Plus/>New instance</button></div></div>

    <div className="beta8-library-summary">
      <div><Boxes/><span><b>{instances.length}</b><small>Managed profiles</small></span></div>
      <div><RefreshCw/><span><b>{busyVersions ? 'Syncing…' : versions.length || 'Offline'}</b><small>Mojang release metadata</small></span></div>
      <div><span className="beta8-latest-dot"/><span><b>{latest}</b><small>Latest official release</small></span></div>
    </div>

    <div className="library-grid beta8-library-grid">{instances.map(instance => <div className="library-item" key={instance.id}><ProfileCard instance={instance}/><button className="text-danger" onClick={async () => { if (confirm(`Delete ${instance.name}? This permanently removes its managed files.`)) { try { await call(api.instances.remove(instance.id)); await refresh(); } catch (e) { setError(e.message); } } }}><Trash2/>Delete profile</button></div>)}{!instances.length && <div className="empty-card big beta8-empty"><Boxes/><b>No Minecraft profiles yet</b><span>Create your first real isolated instance.</span><button className="primary" onClick={() => setShow(true)}><Plus/>Create instance</button></div>}</div>

    {(error || versionError) && <div className="release-error beta8-inline-error"><AlertTriangle/>{error || versionError}</div>}

    {show && <div className="modal-backdrop"><div className="modal beta8-modal"><button className="modal-x" title="Close" onClick={() => setShow(false)}><X/></button><small>NEW INSTANCE</small><h2>Build a real Minecraft profile</h2><p className="muted">Release versions come from Mojang's official version manifest. Fabric loader metadata resolves at launch.</p>
      <label>Profile name<input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && create()} placeholder="Eternal Survival"/></label>
      <div className="form-row">
        <label>Minecraft version
          {versions.length ? <select value={form.minecraftVersion} onChange={e => setForm({ ...form, minecraftVersion: e.target.value })}>{versions.map(version => <option key={version.id} value={version.id}>{version.id}{version.id === latest ? ' · latest' : ''}</option>)}</select> : <input value={form.minecraftVersion} onChange={e => setForm({ ...form, minecraftVersion: e.target.value })} placeholder="1.21.11"/>}
        </label>
        <label>Loader<select value={form.loader} onChange={e => setForm({ ...form, loader: e.target.value })}><option value="vanilla">Vanilla</option><option value="fabric">Fabric</option></select></label>
      </div>
      <label>RAM<div className="range-line"><input type="range" min="2048" max="16384" step="512" value={form.ramMb} onChange={e => setForm({ ...form, ramMb: Number(e.target.value) })}/><b>{(form.ramMb / 1024).toFixed(1)} GB</b></div></label>
      {versionError && <div className="notice"><AlertTriangle/>Could not refresh Mojang metadata: {versionError} <button className="text-button" onClick={loadVersions}>Retry</button></div>}
      <div className="notice">Eternal launches Vanilla and Fabric profiles. Eternal Core itself is currently certified for Fabric 1.21.11 only.</div>
      <button className="primary wide" disabled={creating || !form.name.trim()} onClick={create}>{creating ? <><RefreshCw className="spin"/>Creating…</> : <><Plus/>Create instance</>}</button>
    </div></div>}
  </div>;
}
