import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronRight, Download, ExternalLink, FolderPlus, Gauge, LockKeyhole, PackageOpen, Search, ShieldCheck, Sparkles, Trash2, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import eternalLogo from '../../assets/logo.svg';

const quickSearches = [
  ['performance', Zap],
  ['sodium', Gauge],
  ['iris', Sparkles],
  ['fabric api', PackageOpen]
];

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
  const managedCount = useMemo(() => mods.filter(mod => mod.managed).length, [mods]);

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

  async function search(term = q) {
    const query = String(term || '').trim();
    if (!current || current.loader === 'vanilla' || !query) return;
    setQ(query);
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await call(api.mods.search({ query, mcVersion: current.minecraftVersion, loader: current.loader }));
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

  return <div className="beta8-page beta8-mods-page premium-mods-page">
    <div className="page-head beta8-page-head premium-page-head"><div><small>MOD HUB</small><h1>Build the perfect instance.</h1><p>Discover real Modrinth projects filtered to the selected Minecraft version and loader. Eternal verifies downloaded files and resolves required dependencies before they reach your profile.</p></div><div className="premium-instance-switcher"><small>INSTALL TARGET</small><select className="instance-select" value={id} onChange={e => { setId(e.target.value); setResults([]); setMessage(''); setError(''); }}>{instances.map(instance => <option key={instance.id} value={instance.id}>{instance.name} · {instance.minecraftVersion} {instance.loader}</option>)}</select></div></div>

    {!current ? <div className="empty-card big beta8-empty"><PackageOpen/><b>Create an instance first</b><span>Mod Hub always installs into one real isolated profile.</span></div> : <>
      <section className="premium-mod-hero">
        <div className="premium-mod-hero-copy"><span className="premium-mod-eyebrow"><ShieldCheck/>VERSION-AWARE DISCOVERY</span><h2>Find. Verify. Install.</h2><p>Search results are scoped to <b>Minecraft {current.minecraftVersion}</b> and <b>{current.loader}</b>, so the hub behaves like a real launcher library instead of a generic web search.</p><div className="premium-mod-filter-pills"><span>{current.minecraftVersion}</span><span>{current.loader}</span><span>hash verified</span><span>dependency aware</span></div></div>
        <div className="premium-mod-hero-mark"><div/><PackageOpen/><small>MODRINTH<br/>DISCOVERY</small></div>
      </section>

      <div className="beta8-mod-summary premium-mod-summary"><div><b>{mods.length}</b><span>Installed</span></div><div><b>{enabledCount}</b><span>Enabled</span></div><div><b>{managedCount}</b><span>Managed</span></div><div><b>{current.loader}</b><span>{current.minecraftVersion}</span></div></div>

      <div className="mod-toolbar beta8-mod-toolbar premium-mod-toolbar">
        <div className="search-box premium-search-box"><Search/><input disabled={current.loader === 'vanilla'} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder={current.loader === 'vanilla' ? 'Choose a Fabric profile to install mods' : `Search Modrinth for ${current.minecraftVersion} ${current.loader}…`}/><button disabled={busy || current.loader === 'vanilla' || !q.trim()} onClick={() => search()}>{busy ? 'Searching…' : 'Search'}</button></div>
        <button className="secondary" disabled={current.loader === 'vanilla'} onClick={add}><FolderPlus/>Add local .jar</button>
      </div>

      <div className="premium-quick-searches"><small>QUICK DISCOVERY</small>{quickSearches.map(([term, Icon]) => <button key={term} disabled={busy || current.loader === 'vanilla'} onClick={() => search(term)}><Icon/>{term}<ChevronRight/></button>)}</div>

      {current.loader === 'vanilla' && <div className="notice beta8-notice"><AlertTriangle/>Vanilla profiles do not load mod JARs. Eternal disables install/add controls instead of pretending the files would work. Create or select a Fabric profile.</div>}
      {message && <div className="beta8-success"><CheckCircle2/>{message}</div>}
      {error && <div className="release-error beta8-inline-error"><AlertTriangle/>{error}</div>}

      {results.length > 0 && <section className="premium-discovery-section"><div className="section-head compact premium-section-head"><div><small>DISCOVERY</small><h2>{results.length} compatible result{results.length === 1 ? '' : 's'}</h2></div><span>{q}</span></div><div className="discover-grid beta8-discover-grid premium-discover-grid">{results.slice(0, 18).map((project, index) => <motion.article className="mod-result beta8-mod-result premium-mod-result" key={project.project_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, delay: Math.min(index, 8) * .025 }}>
        <div className="premium-mod-art"><img src={project.icon_url || eternalLogo} alt="" onError={event => { event.currentTarget.src = eternalLogo; }}/><span>{String(project.title || 'M').slice(0, 1).toUpperCase()}</span></div>
        <div className="premium-mod-copy"><div className="premium-mod-title-row"><b>{project.title}</b><i>MODRINTH</i></div><span>{project.description}</span><small>{Number(project.downloads || 0).toLocaleString()} downloads · by {project.author || 'Modrinth'}</small></div>
        <div className="beta8-mod-actions premium-mod-actions"><button className="icon-btn" title="Open on Modrinth" onClick={() => openModrinth(project)}><ExternalLink/></button><button className="premium-install-btn" disabled={current.loader === 'vanilla' || Boolean(installing)} onClick={() => install(project)}><Download/>{installing === project.project_id ? 'Installing…' : 'Install'}</button></div>
      </motion.article>)}</div></section>}

      {!results.length && q && !busy && <div className="premium-search-placeholder"><Search/><div><b>Ready to search “{q}”</b><span>Press Enter or Search. Eternal will ask Modrinth for projects compatible with {current.minecraftVersion} {current.loader}.</span></div></div>}

      <div className="section-head compact premium-section-head"><div><small>INSTALLED</small><h2>{mods.length} mod{mods.length === 1 ? '' : 's'} in {current.name}</h2></div><span>{enabledCount} active</span></div>
      <div className="mods-list beta8-mod-list premium-mod-list">{mods.map(mod => <div className={`mod-row premium-mod-row ${mod.managed ? 'managed' : ''}`} key={mod.filename}><div className="mod-glyph premium-mod-glyph">{mod.managed ? <LockKeyhole/> : mod.loader === 'fabric' ? 'F' : 'J'}</div><div><b>{mod.name}</b><span>{mod.version || mod.filename}{mod.managed ? ' · managed by Eternal' : ''}</span></div>{mod.managed ? <div className="beta8-managed-chip"><LockKeyhole/>CORE</div> : <><button className="toggle" title={mod.enabled ? 'Disable mod' : 'Enable mod'} onClick={async () => { try { await call(api.mods.toggle({ instanceId: id, filename: mod.filename, enabled: !mod.enabled })); await load(); } catch (e) { setError(e.message); } }}>{mod.enabled ? <ToggleRight className="on"/> : <ToggleLeft/>}</button><button className="icon-btn" title="Remove mod" onClick={async () => { if (!confirm(`Remove ${mod.name}?`)) return; try { await call(api.mods.remove({ instanceId: id, filename: mod.filename })); await load(); } catch (e) { setError(e.message); } }}><Trash2/></button></>}</div>)}{!mods.length && <div className="empty-card premium-mod-empty"><PackageOpen/><div><b>No mods installed</b><span>Search Modrinth above or add a local JAR to this isolated profile.</span></div></div>}</div>
    </>}
  </div>;
}
