import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Boxes, Copy, Database, Edit3, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import ProfileCard from '../components/ProfileCard.jsx';
import { call, api } from '../lib/api.js';

const channelLabels = {
  all: 'All official versions',
  release: 'Releases',
  snapshot: 'Snapshots',
  old_beta: 'Old Beta',
  old_alpha: 'Old Alpha'
};

export default function Library() {
  const instances = useEternalStore(s => s.instances);
  const running = useEternalStore(s => s.running);
  const refresh = useEternalStore(s => s.refreshInstances);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [versions, setVersions] = useState([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [latest, setLatest] = useState('1.21.11');
  const [channel, setChannel] = useState('release');
  const [versionSearch, setVersionSearch] = useState('');
  const [versionError, setVersionError] = useState('');
  const [busyVersions, setBusyVersions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mutatingId, setMutatingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', minecraftVersion: '1.21.11', loader: 'fabric', ramMb: 6144 });
  const [editForm, setEditForm] = useState({ name: '', ramMb: 6144 });

  async function loadVersions() {
    setBusyVersions(true);
    setVersionError('');
    try {
      const result = await call(api.instances.versions({ includeSnapshots: true, limit: 1000 }));
      setVersions(result.versions || []);
      setCatalogTotal(Number(result.total || result.versions?.length || 0));
      const release = result.latest?.release || result.versions?.find(v => v.type === 'release')?.id || '1.21.11';
      setLatest(release);
      setForm(value => ({ ...value, minecraftVersion: value.minecraftVersion || release }));
    } catch (e) {
      setVersionError(e.message);
    } finally {
      setBusyVersions(false);
    }
  }

  useEffect(() => { loadVersions(); }, []);

  const versionIds = useMemo(() => new Set(versions.map(version => version.id)), [versions]);
  const visibleVersions = useMemo(() => {
    const query = versionSearch.trim().toLowerCase();
    return versions.filter(version => {
      const channelMatch = channel === 'all' || version.type === channel;
      const queryMatch = !query || version.id.toLowerCase().includes(query) || version.type.toLowerCase().includes(query);
      return channelMatch && queryMatch;
    });
  }, [versions, channel, versionSearch]);

  const runningIds = useMemo(() => new Set(running.map(row => row.instanceId)), [running]);

  async function create() {
    setError(''); setMessage('');
    const name = form.name.trim();
    const mcVersion = form.minecraftVersion.trim();
    if (!name) return setError('Give this instance a name.');
    if (!mcVersion) return setError('Choose a Minecraft version.');
    if (versions.length && !versionIds.has(mcVersion)) return setError('Choose a version from Mojang official metadata. You can type any release, snapshot, old beta or old alpha version in the catalog.');
    setCreating(true);
    try {
      const created = await call(api.instances.create({ ...form, minecraftVersion: mcVersion, name }));
      await refresh();
      setMessage(`Created ${created.name} with an isolated .minecraft directory.`);
      setShow(false);
      setForm(value => ({ ...value, name: '', minecraftVersion: latest || value.minecraftVersion }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  function openEdit(instance) {
    setError(''); setMessage('');
    setEdit(instance);
    setEditForm({ name: instance.name, ramMb: Number(instance.ramMb) || 6144 });
  }

  async function saveEdit() {
    if (!edit) return;
    const name = editForm.name.trim();
    if (!name) return setError('Instance name cannot be empty.');
    setMutatingId(edit.id); setError(''); setMessage('');
    try {
      const saved = await call(api.instances.patch({ instanceId: edit.id, patch: { name, ramMb: editForm.ramMb } }));
      await refresh();
      setMessage(`Saved ${saved.name}.`);
      setEdit(null);
    } catch (e) { setError(e.message); }
    finally { setMutatingId(''); }
  }

  async function duplicate(instance) {
    if (runningIds.has(instance.id)) return setError('Stop this instance before duplicating it.');
    setMutatingId(instance.id); setError(''); setMessage('');
    try {
      const copied = await call(api.instances.duplicate({ instanceId: instance.id, name: `${instance.name} Copy` }));
      await refresh();
      setMessage(`Duplicated ${instance.name} as ${copied.name}. Saves, mods, config and resource packs were copied into a new isolated profile.`);
    } catch (e) { setError(e.message); }
    finally { setMutatingId(''); }
  }

  async function remove(instance) {
    if (!confirm(`Delete ${instance.name}? This permanently removes its managed files, saves and mods.`)) return;
    setMutatingId(instance.id); setError(''); setMessage('');
    try {
      await call(api.instances.remove(instance.id));
      await refresh();
      setMessage(`${instance.name} was removed.`);
    } catch (e) { setError(e.message); }
    finally { setMutatingId(''); }
  }

  return <div className="beta8-page beta8-library-page v1-library-page">
    <div className="page-head beta8-page-head premium-page-head"><div><small>GAME LIBRARY · V1</small><h1>Your Minecraft universe.</h1><p>Create isolated Vanilla or Fabric profiles from Mojang's complete official version catalog. Every instance owns its mods, saves, configs and runtime state.</p></div><div className="head-actions"><button className="secondary" disabled={busyVersions} onClick={() => { refresh(); loadVersions(); }}><RefreshCw className={busyVersions ? 'spin' : ''}/>Refresh</button><button className="primary" onClick={() => { setError(''); setShow(true); }}><Plus/>New instance</button></div></div>

    <section className="v1-instance-commandbar">
      <div><Database/><span><small>MOJANG CATALOG</small><b>{busyVersions ? 'Syncing official metadata…' : `${catalogTotal || versions.length} versions available`}</b></span></div>
      <div><Boxes/><span><small>ISOLATED PROFILES</small><b>{instances.length} managed</b></span></div>
      <div><span className="beta8-latest-dot"/><span><small>LATEST RELEASE</small><b>{latest}</b></span></div>
      <button onClick={() => setShow(true)}><Plus/><span><small>CREATE</small><b>Build new profile</b></span></button>
    </section>

    {message && <div className="beta8-success v1-library-message">{message}</div>}
    {(error || versionError) && <div className="release-error beta8-inline-error"><AlertTriangle/>{error || versionError}</div>}

    <div className="library-grid beta8-library-grid v1-library-grid">{instances.map((instance, index) => <motion.div className="library-item v1-library-item" key={instance.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, delay: Math.min(index, 8) * .025 }}>
      <ProfileCard instance={instance}/>
      <div className="v1-instance-tools">
        <button disabled={mutatingId === instance.id} onClick={() => openEdit(instance)}><Edit3/>Edit</button>
        <button disabled={mutatingId === instance.id || runningIds.has(instance.id)} onClick={() => duplicate(instance)}><Copy/>{mutatingId === instance.id ? 'Working…' : 'Duplicate'}</button>
        <button className="danger" disabled={mutatingId === instance.id || runningIds.has(instance.id)} onClick={() => remove(instance)}><Trash2/>Delete</button>
      </div>
    </motion.div>)}{!instances.length && <div className="empty-card big beta8-empty v1-instance-empty"><Boxes/><b>No Minecraft profiles yet</b><span>Create a real isolated instance from any official Mojang version.</span><button className="primary" onClick={() => setShow(true)}><Plus/>Create instance</button></div>}</div>

    {show && <div className="modal-backdrop"><motion.div className="modal beta8-modal v1-instance-modal" initial={{ opacity: 0, scale: .97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}><button className="modal-x" title="Close" onClick={() => setShow(false)}><X/></button><small>NEW INSTANCE · OFFICIAL VERSION CATALOG</small><h2>Build a real Minecraft profile</h2><p className="muted">Type or select any version present in Mojang's official manifest. Fabric availability is resolved against Fabric metadata when the profile launches.</p>
      <label>Profile name<input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && create()} placeholder="Eternal Survival"/></label>
      <div className="v1-version-browser">
        <div className="v1-version-filters"><label>Channel<select value={channel} onChange={e => setChannel(e.target.value)}>{Object.entries(channelLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label><label>Find a version<div className="v1-version-search"><Search/><input value={versionSearch} onChange={e => setVersionSearch(e.target.value)} placeholder="1.8.9, 1.21.11, 26w…"/></div></label></div>
        <label>Minecraft version<input list="eternal-minecraft-versions" value={form.minecraftVersion} onChange={e => setForm({ ...form, minecraftVersion: e.target.value })} placeholder={latest}/><datalist id="eternal-minecraft-versions">{visibleVersions.map(version => <option key={version.id} value={version.id}>{version.type}{version.id === latest ? ' · latest' : ''}</option>)}</datalist></label>
        <div className="v1-version-meta"><span>{visibleVersions.length} shown</span><span>{catalogTotal || versions.length} official entries loaded</span><span>{versionIds.has(form.minecraftVersion) ? 'Official metadata match' : 'Type an official version'}</span></div>
      </div>
      <div className="form-row"><label>Loader<select value={form.loader} onChange={e => setForm({ ...form, loader: e.target.value })}><option value="vanilla">Vanilla</option><option value="fabric">Fabric</option></select></label><label>RAM<div className="range-line"><input type="range" min="2048" max="16384" step="512" value={form.ramMb} onChange={e => setForm({ ...form, ramMb: Number(e.target.value) })}/><b>{(form.ramMb / 1024).toFixed(1)} GB</b></div></label></div>
      {versionError && <div className="notice"><AlertTriangle/>Could not refresh Mojang metadata: {versionError} <button className="text-button" onClick={loadVersions}>Retry</button></div>}
      <div className="notice">Vanilla can target any official version the launch stack can resolve. Fabric must also have a compatible loader build. Eternal Core is separately certified for Fabric 1.21.11.</div>
      <button className="primary wide" disabled={creating || !form.name.trim() || (versions.length > 0 && !versionIds.has(form.minecraftVersion))} onClick={create}>{creating ? <><RefreshCw className="spin"/>Creating… watch Console</> : <><Plus/>Create instance</>}</button>
      <small className="v1-console-hint">The Eternal Console opens automatically and shows the real backend operation while the profile is created.</small>
    </motion.div></div>}

    {edit && <div className="modal-backdrop"><motion.div className="modal beta8-modal v1-instance-modal compact" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}><button className="modal-x" title="Close" onClick={() => setEdit(null)}><X/></button><small>INSTANCE SETTINGS</small><h2>{edit.name}</h2><p className="muted">Version and loader stay immutable for profile safety. Rename the profile or tune its memory allocation here.</p><label>Profile name<input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}/></label><label>RAM<div className="range-line"><input type="range" min="1024" max="32768" step="512" value={editForm.ramMb} onChange={e => setEditForm({ ...editForm, ramMb: Number(e.target.value) })}/><b>{(editForm.ramMb / 1024).toFixed(1)} GB</b></div></label><div className="v1-instance-lockmeta"><span>{edit.minecraftVersion}</span><span>{edit.loader}</span><span>{edit.loaderVersion || 'loader auto'}</span></div><button className="primary wide" disabled={mutatingId === edit.id || !editForm.name.trim()} onClick={saveEdit}>{mutatingId === edit.id ? 'Saving…' : 'Save instance'}</button></motion.div></div>}
  </div>;
}
