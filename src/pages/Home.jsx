import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crosshair as CrosshairIcon, Activity, Boxes, CheckCircle2, ChevronRight, Cloud, Cpu, DownloadCloud, Gauge, Keyboard, MapPin, PackageOpen,
  Play, Radio, Server, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Square,
  Terminal, UserRound, Users, WandSparkles, Wrench, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import MinecraftHead from '../components/MinecraftHead.jsx';
import eternalLogo from '../../assets/logo.svg';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: .045, delayChildren: .04 } }
};
const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: .24, ease: [0.2, 0.8, 0.2, 1] } }
};

function ProfileCard({ instance, running, event }) {
  const navigate = useNavigate();
  const refresh = useEternalStore(s => s.refreshInstances);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function launch() {
    setError(''); setBusy(true);
    try {
      await call(api.instances.launch({ instanceId: instance.id }));
      setTimeout(refresh, 1000);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <motion.div className={`profile-card beta8-profile-card premium-profile-card ${running ? 'running' : ''}`} whileHover={{ y: -2 }} transition={{ duration: .14 }}>
    <div className="profile-icon premium-profile-icon"><Boxes /></div>
    <div className="profile-copy"><b>{instance.name}</b><span>{instance.minecraftVersion} · {instance.loader}</span><small>{instance.playtimeSeconds ? `${Math.floor(instance.playtimeSeconds / 3600)}h ${Math.floor((instance.playtimeSeconds % 3600) / 60)}m played` : 'Ready to play'}</small></div>
    <div className="profile-status">{running ? <><i className="green-dot"/><span>{event?.message || 'Minecraft running'}</span></> : <><i className="premium-idle-dot"/><span>{instance.lastPlayedAt ? `Last played ${new Date(instance.lastPlayedAt).toLocaleString()}` : 'Never launched'}</span></>}</div>
    <button className={running ? 'secondary' : 'play-btn'} disabled={busy} onClick={launch}><Play fill={!running ? 'currentColor' : 'none'} />{busy ? 'Starting…' : running ? 'Launch another' : 'Play'}</button>
    {running && <button className="danger-icon" onClick={() => call(api.instances.stop(instance.id))} title="Stop all processes for this profile"><Square /></button>}
    <button className="icon-btn" onClick={() => navigate('/library')} title="Profile settings"><Settings2 /></button>
    {error && <div className="beta8-profile-error">{error}</div>}
  </motion.div>;
}

const featureTiles = [
  ['/library', Boxes, 'Instances', 'Isolated profiles with their own mods, saves and settings'],
  ['/mods', PackageOpen, 'Mod Hub', 'Discover and install version-matched Modrinth content'],
  ['/servers', Server, 'Servers', 'Live ping, saved servers and one-click joining'],
  ['/core', ShieldCheck, 'Eternal Core', 'Your real in-game HUD, ClickGUI, zoom and utilities']
];
const capabilityTiles = [
  ['/developer', Gauge, 'Performance first', 'Real launcher and runtime diagnostics'],
  ['/mods', PackageOpen, 'Verified installs', 'Hashes and required dependencies resolved'],
  ['/servers', Server, 'Quick join', 'Server state, ping and direct launch'],
  ['/core', ShieldCheck, 'In-game client', 'Persistent modules and HUD editor'],
  ['/core', SlidersHorizontal, 'Full customization', 'Keybinds, layouts, opacity and accent'],
  ['/downloads', Cloud, 'Live transfers', 'Only real build and download activity']
];

export default function Home() {
  const navigate = useNavigate();
  const accounts = useEternalStore(s => s.accounts);
  const activeId = useEternalStore(s => s.activeAccountId);
  const instances = useEternalStore(s => s.instances);
  const running = useEternalStore(s => s.running);
  const events = useEternalStore(s => s.launchEvents);
  const downloads = useEternalStore(s => s.downloadEvents);
  const appVersion = useEternalStore(s => s.appVersion);
  const [selectedId, setSelectedId] = useState('');
  const [launchError, setLaunchError] = useState('');
  const [launching, setLaunching] = useState(false);

  const account = accounts.find(a => a.id === activeId) || null;
  const recent = useMemo(() => [...instances].sort((a, b) => new Date(b.lastPlayedAt || 0) - new Date(a.lastPlayedAt || 0)).slice(0, 4), [instances]);

  useEffect(() => {
    if (!instances.length) return setSelectedId('');
    if (!instances.some(i => i.id === selectedId)) setSelectedId(recent[0]?.id || instances[0].id);
  }, [instances, recent, selectedId]);

  const selected = instances.find(i => i.id === selectedId) || recent[0] || instances[0] || null;
  const selectedRunning = selected ? running.some(r => r.instanceId === selected.id) : false;
  const runningProcesses = running.reduce((total, item) => total + Number(item.count || item.pids?.length || 1), 0);
  const supportedCore = selected?.loader === 'fabric' && selected?.minecraftVersion === '1.21.11';
  const selectedEvent = selected ? events[selected.id] : null;
  const selectedBusy = selectedEvent && ['VALIDATING', 'RESOLVING_LOADER', 'DOWNLOADING', 'PREPARING_MODS', 'STARTING_JVM'].includes(selectedEvent.state);

  async function playSelected() {
    setLaunchError('');
    if (!selected) return navigate('/library');
    setLaunching(true);
    try { await call(api.instances.launch({ instanceId: selected.id })); }
    catch (error) { setLaunchError(error.message); }
    finally { setLaunching(false); }
  }

  const settings = useEternalStore(s => s.settings) || {};
  const patchSettings = useEternalStore(s => s.patchSettings);
  const [ram, setRam] = useState(settings.ramMb || 6144);
  const [saved, setSaved] = useState('');
  useEffect(() => setRam(settings.ramMb || 6144), [settings.ramMb]);
  async function saveMemory() {
    try { await patchSettings({ ramMb: ram }); setSaved('Launch memory saved'); }
    catch (error) { setLaunchError(error.message); }
  }
  return <div className="et-home">
    <section className="et-launchbar" aria-label="Launch setup">
      <button className="et-account-choice" onClick={() => navigate('/accounts')}><MinecraftHead skinUrl={account?.skinUrl || ''} username={account?.username || '?'} size={40}/><span><small>ACCOUNT</small><b>{account?.username || 'Add an account'}</b><em>{account?.type === 'microsoft' ? 'Microsoft account' : 'Offline profile'}</em></span></button>
      <label><small>INSTANCE</small><select aria-label="Selected instance" value={selectedId} onChange={e => setSelectedId(e.target.value)}>{!instances.length && <option value="">Create an instance</option>}{instances.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div><small>MINECRAFT</small><b>{selected?.minecraftVersion || '—'}</b></div>
      <div><small>LOADER</small><b>{selected?.loader || '—'}</b></div>
      <button className="et-play" onClick={playSelected} disabled={launching || selectedBusy}><Play fill="currentColor"/>{launching || selectedBusy ? 'Starting…' : selected ? selectedRunning ? 'Launch another' : 'Play' : 'Create instance'}</button>
    </section>
    {launchError && <div className="release-error" role="alert">{launchError}</div>}
    <section className="et-landscape">
      <div><img src={eternalLogo} alt=""/><h1>ETERNAL <strong>CLIENT</strong></h1><span>PLAY · CREATE · CUSTOMIZE · EXPLORE</span><p>Your worlds. Your loadouts.<br/>Everything in one place.</p></div>
      <button onClick={() => navigate('/studio')} className="et-hero-link">OPEN STUDIO <ChevronRight/></button>
    </section>
    <section className="et-home-grid">
      <article className="et-panel"><header>SELECTED INSTANCE <button aria-label="Manage instance" onClick={() => navigate('/library')}><Settings2/></button></header>
        <div className="et-instance-name"><Boxes/><div><h2>{selected?.name || 'Your first adventure'}</h2><p>{selected ? selected.minecraftVersion + ' · ' + selected.loader : 'Create an isolated Minecraft instance to get started.'}</p></div></div>
        <div className="et-facts"><span><ShieldCheck/>{supportedCore ? 'Eternal Core compatible' : 'Core requires Fabric 1.21.11'}</span><span><Activity/>{selectedRunning ? 'Minecraft is running' : 'Ready when you are'}</span><span><Keyboard/>Right Shift · Modules / H · HUD editor</span></div>
        <button className="secondary" onClick={() => navigate('/library')}>Manage instances <ChevronRight/></button>
      </article>
      <article className="et-panel"><header>LAUNCH OPTIONS <SlidersHorizontal/></header><label className="et-memory"><span>Default memory <b>{(ram / 1024).toFixed(1)} GB</b></span><input aria-label="Default memory allocation" type="range" min="1024" max="16384" step="512" value={ram} onChange={e => { setRam(Number(e.target.value)); setSaved(''); }} onPointerUp={saveMemory} onKeyUp={saveMemory} onBlur={saveMemory}/><small>1 GB <span>16 GB</span></small></label><p>Per-instance memory overrides this default. Leave room for Windows and other apps.</p>
        <label className="et-checkbox"><input type="checkbox" checked={Boolean(settings.reducedMotion)} onChange={e => patchSettings({ reducedMotion:e.target.checked }).catch(error => setLaunchError(error.message))}/>Reduced motion</label>
        <button className="secondary" onClick={() => navigate('/settings')}>Java, display &amp; launcher settings <ChevronRight/></button><small role="status">{saved}</small>
      </article>
      <article className="et-panel"><header>RECENT ACTIVITY <button onClick={() => navigate('/downloads')}>View all</button></header><div className="et-activity">{downloads.slice(0,4).map((event,index) => <div key={event.id || index}><DownloadCloud/><span><b>{event.name || 'Download'}</b><small>{event.message || event.state}</small></span></div>)}{!downloads.length && <p>No downloads this session. Explore Mod Hub to find your next mod or pack.</p>}</div><button className="secondary" onClick={() => navigate('/mods')}><PackageOpen/>Explore Mod Hub</button></article>
    </section>
    <section className="et-shortcuts">{[['/studio',CrosshairIcon,'Modules & settings','Build your PvP workspace'],['/mods',PackageOpen,'Mod Hub','Mods, resource packs, datapacks, shaders'],['/servers',Server,'Multiplayer','Your saved servers and live pings']].map(([to,Icon,title,description]) => <button key={to} onClick={() => navigate(to)}><Icon/><span><b>{title}</b><small>{description}</small></span><ChevronRight/></button>)}</section>
  </div>;
}
