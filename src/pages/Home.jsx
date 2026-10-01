import { useEffect, useMemo, useState } from 'react';
import { Activity, Boxes, ChevronRight, DownloadCloud, FolderOpen, Keyboard, PackageOpen, Play, Server, Settings2, ShieldCheck, SlidersHorizontal, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import { keyName, launchStatus, recentTransfers } from '../lib/launcherView.js';
import MinecraftHead from '../components/MinecraftHead.jsx';
import eternalLogo from '../../assets/logo.svg';

export default function Home() {
  const navigate = useNavigate();
  const { accounts, activeAccountId, instances, running, launchEvents, downloadEvents, settings, patchSettings } = useEternalStore();
  const [selectedId, setSelectedId] = useState('');
  const [launchError, setLaunchError] = useState('');
  const [launching, setLaunching] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [core, setCore] = useState(null);
  const [ram, setRam] = useState(settings?.ramMb || 6144);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const account = accounts.find(item => item.id === activeAccountId) || null;
  const recent = useMemo(() => [...instances].sort((a, b) => new Date(b.lastPlayedAt || 0) - new Date(a.lastPlayedAt || 0)), [instances]);

  useEffect(() => {
    if (!instances.some(item => item.id === selectedId)) setSelectedId(recent[0]?.id || '');
  }, [instances, recent, selectedId]);
  useEffect(() => setRam(settings?.ramMb || 6144), [settings?.ramMb]);

  const selected = instances.find(item => item.id === selectedId) || recent[0] || null;
  const selectedRunning = Boolean(selected && running.some(item => item.instanceId === selected.id));
  const selectedEvent = selected ? launchEvents[selected.id] : null;
  const selectedBusy = ['VALIDATING', 'RESOLVING_LOADER', 'DOWNLOADING', 'PREPARING_MODS', 'STARTING_JVM'].includes(selectedEvent?.state);
  const supportedCore = selected?.loader === 'fabric' && selected?.minecraftVersion === '1.21.11';
  const activity = useMemo(() => recentTransfers(downloadEvents), [downloadEvents]);

  useEffect(() => {
    let current = true;
    setCore(null);
    if (supportedCore) Promise.all([call(api.core.status(selected.id)), call(api.core.config(selected.id))])
      .then(([status, config]) => { if (current) setCore({ status, config }); })
      .catch(error => { if (current) setCore({ error: error.message }); });
    return () => { current = false; };
  }, [selected?.id, supportedCore, selectedRunning]);

  async function playSelected() {
    setLaunchError('');
    if (!selected) return navigate('/library');
    if (!account) return navigate('/accounts');
    setLaunching(true);
    try { await call(api.instances.launch({ instanceId: selected.id })); }
    catch (error) { setLaunchError(error.message); }
    finally { setLaunching(false); }
  }
  async function stopSelected() {
    setStopping(true); setLaunchError('');
    try { await call(api.instances.stop(selected.id)); await useEternalStore.getState().refreshRuntime(); }
    catch (error) { setLaunchError(error.message); }
    finally { setStopping(false); }
  }
  async function saveMemory() {
    setSaving(true); setSaved('');
    try { await patchSettings({ ramMb: ram }); setSaved('Memory saved'); }
    catch (error) { setLaunchError(error.message); }
    finally { setSaving(false); }
  }
  const coreLabel = !selected ? 'Select an instance' : !supportedCore ? 'Core needs Fabric 1.21.11'
    : core?.error ? 'Could not read Core status' : !core ? 'Checking Core...'
    : core.status.installedValid ? `Core ${core.status.installedVersion || ''} installed`
    : core.status.stagedExists ? 'Core will install on launch' : 'Core is not available in this build';

  return <div className="et-home">
    <section className="et-launchbar" aria-label="Launch setup">
      <button className="et-account-choice" onClick={() => navigate('/accounts')}>
        <MinecraftHead skinUrl={account?.skinUrl || ''} username={account?.username || '?'} size={36}/>
        <span><small>ACCOUNT</small><b>{account?.username || 'Add an account'}</b><em>{account ? account.type === 'microsoft' ? 'Microsoft' : 'Offline account' : 'No account selected'}</em></span>
      </button>
      <label><small>INSTANCE</small><select aria-label="Selected instance" value={selected?.id || ''} onChange={event => setSelectedId(event.target.value)}>
        {!instances.length && <option value="">Create an instance</option>}{instances.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      <div><small>MINECRAFT</small><b>{selected?.minecraftVersion || 'Not selected'}</b></div>
      <div><small>LOADER</small><b>{selected?.loader || 'Not selected'}</b></div>
      <button className="et-play" onClick={playSelected} disabled={launching || selectedBusy || stopping}><Play fill="currentColor"/>{launching || selectedBusy ? 'Starting...' : !selected ? 'Create instance' : !account ? 'Add account' : selectedRunning ? 'Launch another' : 'Play'}</button>
    </section>
    {launchError && <div className="release-error" role="alert">{launchError}</div>}
    <section className="et-landscape">
      <div><img src={eternalLogo} alt=""/><h1>ETERNAL <strong>CLIENT</strong></h1><p>{selected ? selected.name : 'Your Minecraft launcher'}</p><span>{selected ? `${selected.minecraftVersion} / ${selected.loader}` : 'Create an instance to get started'}</span></div>
      <button onClick={() => navigate(`/studio?instance=${encodeURIComponent(selected?.id || '')}`)} className="et-hero-link">Open Studio <ChevronRight/></button>
    </section>
    <section className="et-home-grid">
      <article className="et-panel"><header>SELECTED INSTANCE <button title="Manage instance" aria-label="Manage instance" onClick={() => navigate('/library')}><Settings2/></button></header>
        <div className="et-instance-name"><Boxes/><div><h2>{selected?.name || 'No instance yet'}</h2><p>{selected ? `${selected.minecraftVersion} / ${selected.loader}` : 'Each instance keeps its own worlds, mods and settings.'}</p></div></div>
        <div className="et-facts"><span><ShieldCheck/>{coreLabel}</span><span role="status"><Activity/>{launchStatus({ selected, account, running: selectedRunning, event: selectedEvent })}</span>
          {core?.config && <span><Keyboard/>{keyName(core.config.openKey)}: Modules / {keyName(core.config.hudEditorKey)}: HUD editor</span>}
          {selected?.lastPlayedAt && <span>Last played {new Date(selected.lastPlayedAt).toLocaleString()}</span>}
          {core?.error && <span>{core.error}</span>}
        </div>
        <div className="et-instance-actions"><button className="secondary" onClick={() => navigate('/library')}>Manage <ChevronRight/></button>
          {selected && <button className="secondary" onClick={() => call(api.instances.openFolder(selected.id)).catch(error => setLaunchError(error.message))}><FolderOpen/>Folder</button>}
          {selectedRunning && <button className="secondary" disabled={stopping} onClick={stopSelected}><Square/>{stopping ? 'Stopping...' : 'Stop'}</button>}
        </div>
      </article>
      <article className="et-panel"><header>LAUNCH OPTIONS <SlidersHorizontal/></header>
        <label className="et-memory"><span>Default memory <b>{(ram / 1024).toFixed(1)} GB</b></span><input aria-label="Default memory allocation" type="range" min="1024" max="16384" step="512" value={ram} onChange={event => { setRam(Number(event.target.value)); setSaved(''); }}/><small>1 GB <span>16 GB</span></small></label>
        <p>Per-instance memory overrides this default. Leave memory for your operating system and other apps.</p>
        <button className="secondary" disabled={saving || ram === settings?.ramMb} onClick={saveMemory}>{saving ? 'Saving...' : 'Save memory'}</button>
        <label className="et-checkbox"><input type="checkbox" checked={Boolean(settings?.reducedMotion)} onChange={event => patchSettings({ reducedMotion: event.target.checked }).catch(error => setLaunchError(error.message))}/>Reduced motion</label>
        <button className="secondary" onClick={() => navigate('/settings')}>Java &amp; display settings <ChevronRight/></button><small role="status">{saved}</small>
      </article>
      <article className="et-panel"><header>RECENT ACTIVITY <button onClick={() => navigate('/downloads')}>View all</button></header><div className="et-activity">
        {activity.map((event, index) => <div key={event.id || index}><DownloadCloud/><span><b>{event.name || 'Download'}</b><small>{event.message || event.state}</small></span></div>)}
        {!activity.length && <p>No downloads this session.</p>}
      </div><button className="secondary" onClick={() => navigate('/mods')}><PackageOpen/>Explore Mod Hub</button></article>
    </section>
    <section className="et-shortcuts">{[['/studio', SlidersHorizontal, 'Modules & settings', 'Configure the selected instance'], ['/mods', PackageOpen, 'Mod Hub', 'Mods, packs and shaders'], ['/servers', Server, 'Multiplayer', 'Saved servers and live pings']].map(([to, Icon, title, description]) => <button key={to} onClick={() => navigate(to)}><Icon/><span><b>{title}</b><small>{description}</small></span><ChevronRight/></button>)}</section>
  </div>;
}
