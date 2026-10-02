import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Download, ExternalLink, Filter, FolderPlus, Gauge, LockKeyhole, PackageOpen, Search, ShieldCheck, Sparkles, Trash2, ToggleLeft, ToggleRight, TrendingUp, Zap } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { useSelectedInstance } from '../lib/useSelectedInstance.js';
import { call, api } from '../lib/api.js';
import eternalLogo from '../../assets/logo.svg';

const quickSearches = [
  ['performance', Zap],
  ['sodium', Gauge],
  ['iris', Sparkles],
  ['fabric api', PackageOpen],
  ['hud', ShieldCheck],
  ['pvp', TrendingUp]
];
const categories = ['all', 'optimization', 'utility', 'technology', 'adventure', 'worldgen', 'decoration'];
const sorts = [
  ['relevance', 'Relevant'],
  ['downloads', 'Most downloaded'],
  ['follows', 'Most followed'],
  ['newest', 'Newest'],
  ['updated', 'Recently updated']
];

export default function Mods() {
  const instances = useEternalStore(s => s.instances);
  const [id, setId] = useSelectedInstance();
  const [mods, setMods] = useState([]);
  const [type, setType] = useState('mod');
  const [world, setWorld] = useState('');
  const [worlds, setWorlds] = useState([]);
  const running = useEternalStore(s => s.running);
  const typeNames = { mod:'Mods', resourcepack:'Resource Packs', datapack:'Datapacks', shader:'Shader Packs' };
  const target = { instanceId:id, type, world };
  const activeTarget = useRef('');
  activeTarget.current = `${id}/${type}/${world}`;
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('relevance');
  const [category, setCategory] = useState('all');
  const [busy, setBusy] = useState(false);
  const [installing, setInstalling] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const current = instances.find(item => item.id === id);
  const locked = running.some(row => row.instanceId === id);
  const needsLoader = type === 'mod' && current?.loader === 'vanilla';
  const canInstall = Boolean(current && !locked && !needsLoader && (type !== 'datapack' || world));
  const enabledCount = useMemo(() => mods.filter(mod => mod.enabled).length, [mods]);
  const managedCount = useMemo(() => mods.filter(mod => mod.managed).length, [mods]);

  async function load() {
    if (!id || (type === 'datapack' && !world)) return setMods([]);
    const key = activeTarget.current;
    setError('');
    try { const files = await call(api.mods.contentList(target)); if (activeTarget.current === key) setMods(files); } catch (e) { if (activeTarget.current === key) setError(e.message); }
  }
  useEffect(() => { setMods([]); setResults([]); setTotal(0); setMessage(''); setError(''); load(); }, [id,type,world]);
  useEffect(() => {
    let canceled = false;
    setWorld(''); setWorlds([]);
    if (id) call(api.mods.worlds(id)).then(rows => { if (!canceled) setWorlds(rows); }).catch(error => { if (!canceled) setError(error.message); });
    return () => { canceled = true; };
  }, [id]);

  async function add() {
    if (!canInstall) return;
    setError(''); setMessage('');
    try {
      const files = await call(api.mods.contentFiles(type));
      if (!files.length) return;
      const added = await call(api.mods.contentAdd({ ...target, files }));
      setMessage(`Added ${added.length} local file(s). ${type === 'resourcepack' ? 'Enable packs in Minecraft Resource Packs.' : type === 'shader' ? 'Select the pack in Iris shader settings.' : type === 'datapack' ? 'Reopen the selected world to load datapacks.' : 'Restart Minecraft to load mods.'}`);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function search(term = q, append = false) {
    const query = String(term || '').trim();
    if (!current || needsLoader) return;
    const key = activeTarget.current;
    setQ(query);
    setBusy(true); setError(''); setMessage('');
    try {
      const offset = append ? results.length : 0;
      const response = await call(api.mods.search({
        query,
        mcVersion: current.minecraftVersion,
        loader: current.loader,
        projectType: type,
        category: category === 'all' ? '' : category,
        index: sort,
        limit: 24,
        offset
      }));
      const incoming = response.hits || [];
      if (key !== activeTarget.current) return;
      setTotal(Number(response.total_hits || incoming.length));
      setResults(previous => append
        ? [...previous, ...incoming.filter(project => !previous.some(existing => existing.project_id === project.project_id))]
        : incoming);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function install(project) {
    if (!canInstall) return;
    setInstalling(project.project_id); setError(''); setMessage('');
    try {
      const result = await call(api.mods.contentInstall({ ...target, projectId: project.project_id }));
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
    try { await call(api.app.openExternal(`https://modrinth.com/${type}/${project.slug || project.project_id}`)); }
    catch (e) { setError(e.message); }
  }

  function changeDiscovery(nextCategory, nextSort = sort) {
    if (nextCategory != null) setCategory(nextCategory);
    if (nextSort != null) setSort(nextSort);
    setResults([]);
    setTotal(0);
  }

  return <div className="beta8-page beta8-mods-page premium-mods-page v1-modhub-page">
    <div className="et-category-tabs" aria-label="Mod Hub content types">{Object.entries(typeNames).map(([value,label]) => <button key={value} disabled={Boolean(installing)} aria-pressed={type === value} className={type === value ? 'active' : ''} onClick={() => {setType(value); setCategory('all'); setQ('');}}>{label}</button>)}</div>
    {type === 'datapack' && <div className="et-pack-notice"><label>Install into world <select disabled={Boolean(installing)} aria-label="Datapack world" value={world} onChange={event => setWorld(event.target.value)}><option value="">Select a singleplayer world</option>{worlds.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><p>Datapacks belong to one world. Close Minecraft before installing. They cannot change a remote server.</p></div>}
    {type === 'shader' && <div className="et-pack-notice">Shader packs need a compatible shader loader such as Iris. Install the loader from Mods, then select the shader in Minecraft.</div>}
    {type === 'resourcepack' && <div className="et-pack-notice">Installed resource packs become available in Minecraft → Options → Resource Packs. Select and apply them there.</div>}
    {locked && <div className="et-pack-notice">Close this Minecraft instance before adding, installing or changing files.</div>}
    <div className="page-head beta8-page-head premium-page-head"><div><small>ETERNAL MOD HUB</small><h1>Build your Minecraft.</h1><p>Discover real Modrinth projects filtered to your Minecraft version and content type. Eternal resolves required dependencies and verifies supplied hashes before files enter your profile.</p></div><div className="premium-instance-switcher"><small>INSTALL TARGET</small><select disabled={Boolean(installing)} className="instance-select" value={id} onChange={e => { setId(e.target.value); setResults([]); setTotal(0); setMessage(''); setError(''); }}>{instances.map(instance => <option key={instance.id} value={instance.id}>{instance.name} · {instance.minecraftVersion} {instance.loader}</option>)}</select></div></div>

    {!current ? <div className="empty-card big beta8-empty"><PackageOpen/><b>Create an instance first</b><span>Mod Hub always installs into one real isolated profile.</span></div> : <>
      <section className="premium-mod-hero v1-mod-hero">
        <div className="premium-mod-hero-copy"><span className="premium-mod-eyebrow"><ShieldCheck/>VERSION-AWARE DISCOVERY</span><h2>Find. Verify. Install.</h2><p>Every result is requested against <b>Minecraft {current.minecraftVersion}</b> + <b>{current.loader}</b>. Downloads keep real progress, dependency resolution and hash verification.</p><div className="premium-mod-filter-pills"><span>{current.minecraftVersion}</span><span>{current.loader}</span><span>hash verified</span><span>dependency aware</span><span>isolated profile</span></div></div>
        <div className="premium-mod-hero-mark"><div/><PackageOpen/><small>MODRINTH<br/>DISCOVERY</small></div>
      </section>

      <div className="beta8-mod-summary premium-mod-summary v1-mod-summary"><div><b>{mods.length}</b><span>Installed</span></div><div><b>{enabledCount}</b><span>Enabled</span></div><div><b>{managedCount}</b><span>Managed</span></div><div><b>{current.loader}</b><span>{current.minecraftVersion}</span></div><div><b>{total || '—'}</b><span>Discovery matches</span></div></div>

      <div className="mod-toolbar beta8-mod-toolbar premium-mod-toolbar v1-mod-toolbar">
        <div className="search-box premium-search-box"><Search/><input disabled={needsLoader} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search(e.currentTarget.value, false)} placeholder={needsLoader ? 'Choose a Fabric profile to install mods' : `Search ${typeNames[type]} for ${current.minecraftVersion}…`}/><button disabled={busy || needsLoader} onClick={() => search(q, false)}>{busy ? 'Searching…' : 'Search'}</button></div>
        <label className="v1-sort-select"><Filter/><select value={sort} onChange={e => { changeDiscovery(category, e.target.value); }}>{sorts.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select><ChevronDown/></label>
        <button className="secondary" disabled={!canInstall} onClick={add}><FolderPlus/>Add local {type === 'mod' ? '.jar' : '.zip'}</button>
      </div>

      <div className="v1-category-rail"><small>CATEGORY</small>{(type === 'mod' ? categories : ['all']).map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => changeDiscovery(item, sort)}>{item === 'all' ? 'All content' : item}</button>)}</div>
      <div className="premium-quick-searches v1-quick-searches"><small>QUICK DISCOVERY</small>{(type === 'mod' ? quickSearches : []).map(([term, Icon]) => <button key={term} disabled={busy || needsLoader} onClick={() => search(term, false)}><Icon/>{term}<ChevronRight/></button>)}</div>

      {needsLoader && <div className="notice beta8-notice"><AlertTriangle/>Vanilla profiles do not load mod JARs. Eternal disables install/add controls instead of pretending the files would work. Create or select a Fabric profile.</div>}
      {message && <div className="beta8-success"><CheckCircle2/>{message}</div>}
      {error && <div className="release-error beta8-inline-error"><AlertTriangle/>{error}</div>}

      {results.length > 0 && <section className="premium-discovery-section v1-discovery-section"><div className="section-head compact premium-section-head"><div><small>DISCOVERY</small><h2>{total.toLocaleString()} compatible result{total === 1 ? '' : 's'}</h2></div><span>{q} · {sort}{category !== 'all' ? ` · ${category}` : ''}</span></div><div className="discover-grid beta8-discover-grid premium-discover-grid v1-discover-grid">{results.map((project, index) => <motion.article className="mod-result beta8-mod-result premium-mod-result v1-mod-result" key={project.project_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, delay: Math.min(index, 10) * .018 }}>
        <div className="premium-mod-art"><img src={project.icon_url || eternalLogo} alt="" onError={event => { event.currentTarget.src = eternalLogo; }}/><span>{String(project.title || 'M').slice(0, 1).toUpperCase()}</span></div>
        <div className="premium-mod-copy"><div className="premium-mod-title-row"><b>{project.title}</b><i>MODRINTH</i></div><span>{project.description}</span><small>{Number(project.downloads || 0).toLocaleString()} downloads · {Number(project.follows || 0).toLocaleString()} followers · by {project.author || 'Modrinth'}</small><div className="v1-project-tags">{(project.categories || []).slice(0, 5).map(tag => <em key={tag}>{tag}</em>)}</div></div>
        <div className="beta8-mod-actions premium-mod-actions"><button className="icon-btn" title="Open on Modrinth" onClick={() => openModrinth(project)}><ExternalLink/></button><button className="premium-install-btn" disabled={!canInstall || Boolean(installing)} onClick={() => install(project)}><Download/>{installing === project.project_id ? 'Installing…' : 'Install'}</button></div>
      </motion.article>)}</div>{results.length < total && <button className="v1-load-more" disabled={busy} onClick={() => search(q, true)}>{busy ? 'Loading…' : `Load more · ${results.length} of ${total.toLocaleString()}`}</button>}</section>}

      {!results.length && q && !busy && <div className="premium-search-placeholder"><Search/><div><b>Ready to search “{q}”</b><span>Press Enter or Search. Eternal asks Modrinth only for projects compatible with {current.minecraftVersion} {current.loader} and your active filters.</span></div></div>}

      <div className="section-head compact premium-section-head"><div><small>INSTALLED</small><h2>{mods.length} {typeNames[type].toLowerCase()} in {current.name}</h2></div><span>{enabledCount} {type === 'mod' ? 'enabled' : 'available'}</span></div>
      <div className="mods-list beta8-mod-list premium-mod-list">{mods.map(mod => <div className={`mod-row premium-mod-row ${mod.managed ? 'managed' : ''}`} key={mod.filename}><div className="mod-glyph premium-mod-glyph">{mod.managed ? <LockKeyhole/> : mod.loader === 'fabric' ? 'F' : 'J'}</div><div><b>{mod.name}</b><span>{mod.version || mod.filename}{mod.managed ? ' · managed by Eternal' : ''}</span></div>{mod.managed ? <div className="beta8-managed-chip"><LockKeyhole/>CORE</div> : <><button className="toggle" disabled={!canInstall} title={mod.enabled ? 'Disable mod' : 'Enable mod'} onClick={async () => { try { await call(api.mods.contentToggle({ ...target, filename: mod.filename, enabled: !mod.enabled })); await load(); } catch (e) { setError(e.message); } }}>{mod.enabled ? <ToggleRight className="on"/> : <ToggleLeft/>}</button><button className="icon-btn" disabled={!canInstall} title="Remove file" onClick={async () => { if (!confirm(`Remove ${mod.name}?`)) return; try { await call(api.mods.contentRemove({ ...target, filename: mod.filename })); await load(); } catch (e) { setError(e.message); } }}><Trash2/></button></>}</div>)}{!mods.length && <div className="empty-card premium-mod-empty"><PackageOpen/><div><b>No content installed</b><span>Search Modrinth or import a local file into this profile.</span></div></div>}</div>
    </>}
  </div>;
}
