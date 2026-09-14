import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, FolderPlus, LockKeyhole, PackageOpen, Search, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import eternalLogo from '../../assets/logo.svg';

export default function Mods() {
  const instances = useEternalStore(s => s.instances);
  const [id, setId] = useState(instances[0]?.id || '');
  const [mods, setMods] = useState([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [installing, setInstalling] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const current = instances.find(item => item.id === id);
  const enabledCount = useMemo(() => mods.filter(mod => mod.enabled).length, [mods]);

  useEffect(() => {
    if (!instances.length) return setId('');
    if (!instances.some(item => item.id === id)) setId(instances[0].id);
  }, [instances, id]);

  async function load() {
    if (!id) return setMods([]);
    setError('');
    try { setMods(await call(api.mods.list(id))); } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, [id]);

  async function add() {
    if (!current || current.loader === 'vanilla') return;
    setError(''); setMessage('');
    try {
      const files = await call(api.dialog.jars());
      if (!files.length) return;
      const added = await call(api.mods.add({ instanceId: id, files }));
      setMessage(`Added ${added.length} local mod${added.length === 1 ? '' : 's'}.`);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function search() {
    if (!current || current.loader === 'vanilla' || !q.trim()) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await call(api.mods.search({ query: q.trim(), mcVersion: current.minecraftVersion, loader: current.loader }));
      setResults(response.hits || []);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function install(project) {
    setInstalling(project.project_id); setError(''); setMessage('');
    try {
      const result = await call(api.mods.install({ instanceId: id, projectId: project.project_id }));
      const installed = result.installed || [];
      const fresh = installed.filter(item => !item.alreadyPresent).length;
      const dependencies = Math.max(0, installed.length - 1);
      setMessage(`Installed ${project.title}${dependencies ? ` with ${dependencies} required dependenc${dependencies === 1 ? 'y' : 'ies'}` : ''}.${fresh === 0 ? ' Verified files were already present.' : ''}`);
      await load();
    } catch (e) { setError(e.message); }
    finally { setInstalling(''); }
  }

  async function openModrinth(project) {
    setError('');
    try { await call(api.app.openExternal(`https://modrinth.com/mod/${project.slug || project.project_id}`)); }
    catch (e) { setError(e.message); }
  }

  return <div className="beta8-page beta8-mods-page">
    <div className="page-head beta8-page-head"><div><small>MOD HUB</small><h1>Mods without the mess.</h1><p>Search Modrinth by the selected Minecraft version and loader. Downloads are hash-verified and required dependencies are resolved.</p></div><select className="instance-select" value={id} onChange={e => { setId(e.target.value); setResults([]); setMessage(''); setError(''); }}>{instances.map(instance => <option key={instance.id} value={instance.id}>{instance.name} · {instance.minecraftVersion} {instance.loader}</option>)}</select></div>

    {!current ? <div className="empty-card big beta8-empty"><PackageOpen/><b>Create an instance first</b><span>Mod Hub always installs into one real isolated profile.</span></div> : <>
      <div className="beta8-mod-summary"><div><b>{mods.length}</b><span>Installed</span></div><div><b>{enabledCount}</b><span>Enabled</span></div><div><b>{current.minecraftVersion}</b><span>Minecraft</span></div><div><b>{current.loader}</b><span>Loader</span></div></div>
      <div className="mod-toolbar beta8-mod-toolbar"><div className="search-box"><Search/><input disabled={current.loader === 'vanilla'} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder={current.loader === 'vanilla' ? 'Choose a Fabric profile to install mods' : `Search Modrinth for ${current.minecraftVersion} ${current.loader}…`}/><button disabled={busy || current.loader === 'vanilla' || !q.trim()} onClick={search}>{busy ? 'Searching…' : 'Search'}</button></div><button className="secondary" disabled={current.loader === 'vanilla'} onClick={add}><FolderPlus/>Add local .jar</button></div>

      {current.loader === 'vanilla' && <div className="notice beta8-notice"><AlertTriangle/>Vanilla profiles do not load mod JARs. Eternal disables install/add controls instead of pretending the files would work. Create or select a Fabric profile.</div>}
      {message && <div className="beta8-success"><CheckCircle2/>{message}</div>}
      {error && <div className="release-error beta8-inline-error"><AlertTriangle/>{error}</div>}

      {results.length > 0 && <section className="discover-grid beta8-discover-grid">{results.slice(0, 18).map(project => <article className="mod-result beta8-mod-result" key={project.project_id}>
        <img src={project.icon_url || eternalLogo} alt="" onError={event => { event.currentTarget.src = eternalLogo; }}/>
        <div><b>{project.title}</b><span>{project.description}</span><small>{Number(project.downloads || 0).toLocaleString()} downloads · {project.author || 'Modrinth'}</small></div>
        <div className="beta8-mod-actions"><button className="icon-btn" title="Open on Modrinth" onClick={() => openModrinth(project)}><ExternalLink/></button><button disabled={current.loader === 'vanilla' || Boolean(installing)} onClick={() => install(project)}><Download/>{installing === project.project_id ? 'Installing…' : 'Install'}</button></div>
      </article>)}</section>}

      <div className="section-head compact"><div><small>INSTALLED</small><h2>{mods.length} mod{mods.length === 1 ? '' : 's'}</h2></div></div>
      <div className="mods-list beta8-mod-list">{mods.map(mod => <div className={`mod-row ${mod.managed ? 'managed' : ''}`} key={mod.filename}><div className="mod-glyph">{mod.managed ? <LockKeyhole/> : mod.loader === 'fabric' ? 'F' : 'J'}</div><div><b>{mod.name}</b><span>{mod.version || mod.filename}{mod.managed ? ' · managed by Eternal' : ''}</span></div>{mod.managed ? <div className="beta8-managed-chip"><LockKeyhole/>CORE</div> : <><button className="toggle" title={mod.enabled ? 'Disable mod' : 'Enable mod'} onClick={async () => { try { await call(api.mods.toggle({ instanceId: id, filename: mod.filename, enabled: !mod.enabled })); await load(); } catch (e) { setError(e.message); } }}>{mod.enabled ? <ToggleRight className="on"/> : <ToggleLeft/>}</button><button className="icon-btn" title="Remove mod" onClick={async () => { if (!confirm(`Remove ${mod.name}?`)) return; try { await call(api.mods.remove({ instanceId: id, filename: mod.filename })); await load(); } catch (e) { setError(e.message); } }}><Trash2/></button></>}</div>)}{!mods.length && <div className="empty-card"><PackageOpen/><span>No mods installed in this profile.</span></div>}</div>
    </>}
  </div>;
}
