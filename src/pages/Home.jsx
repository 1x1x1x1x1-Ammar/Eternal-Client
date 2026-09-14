import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Boxes, CheckCircle2, ChevronRight, Cloud, Cpu, DownloadCloud, Gauge, Keyboard, MapPin, PackageOpen,
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

  return <motion.div className="release-home beta6-home beta8-home premium-home v1-home" variants={stagger} initial="hidden" animate="show">
    <motion.section className="release-hero beta6-hero beta8-hero premium-hero" variants={rise}>
      <div className="release-hero-grid"/><div className="release-hero-atmosphere"/><div className="beta6-scanline"/><div className="premium-hero-noise"/><div className="premium-hero-beam"/>
      <motion.div className="release-hero-copy premium-hero-copy" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .34 }}>
        <div className="premium-kicker-row"><span className="release-kicker">ETERNAL CLIENT · v{appVersion || '1.0.0'}</span><span className="premium-live-pill"><i/>STABLE V1</span></div>
        <h1>Play Minecraft<br/><strong>without compromise.</strong></h1>
        <p>A fast, isolated, mod-ready launcher with a real in-game client. Every profile stays clean. Every action maps to actual runtime state.</p>
        <div className="premium-hero-pills">
          <span><Zap/>Fast launch</span><span><ShieldCheck/>Verified Core</span><span><PackageOpen/>Modrinth</span><span><Sparkles/>Premium UX</span>
        </div>
        <div className="release-launch-row premium-launch-row">
          <button className="release-play premium-play" disabled={launching || selectedBusy} onClick={playSelected}><Play fill="currentColor"/>{launching || selectedBusy ? selectedEvent?.message || 'Starting…' : selected ? selectedRunning ? 'Launch another' : 'Play now' : 'Create profile'}</button>
          <div className="premium-instance-select-wrap"><small>READY PROFILE</small><select value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={!instances.length || launching}>{!instances.length && <option>No profiles yet</option>}{instances.map(instance => <option key={instance.id} value={instance.id}>{instance.name} · {instance.minecraftVersion} · {instance.loader}</option>)}</select></div>
          <button className="release-gear" onClick={() => navigate('/library')} title="Instance settings"><Settings2/></button>
        </div>
        {launchError && <div className="release-inline-error">{launchError}</div>}
        <div className="premium-selected-meta">
          <span className={selected ? 'good' : ''}><CheckCircle2/>{selected ? `${selected.minecraftVersion} ${selected.loader}` : 'No profile selected'}</span>
          <span className={account ? 'good' : ''}><UserRound/>{account?.username || 'No account'}</span>
          <span className={supportedCore ? 'good' : ''}><ShieldCheck/>{supportedCore ? 'Core compatible' : 'Core requires Fabric 1.21.11'}</span>
        </div>
      </motion.div>
      <motion.div className="release-hero-emblem premium-hero-emblem" initial={{ opacity: 0, scale: .88, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .48, ease: [0.2, 0.8, 0.2, 1] }}><div className="premium-orbit orbit-one"/><div className="premium-orbit orbit-two"/><div className="release-emblem-glow"/><img src={eternalLogo} alt="Eternal"/><span>BEYOND SURVIVAL</span></motion.div>
      <div className="release-hero-account premium-hero-account"><MinecraftHead skinUrl={account?.skinUrl || ''} username={account?.username || '?'} size={28}/><span className={account ? 'online' : ''}/><div><b>{account?.username || 'No account'}</b><small>{account ? account.type === 'microsoft' ? 'Microsoft authenticated' : 'Offline profile' : 'Open Accounts to begin'}</small></div></div>
      <div className="release-feature-row premium-feature-row">{featureTiles.map(([to, Icon, title, copy], index) => <motion.button variants={rise} key={to} onClick={() => navigate(to)}><span className="premium-feature-number">0{index + 1}</span><Icon/><span><b>{title}</b><small>{copy}</small></span><ChevronRight className="premium-feature-arrow"/></motion.button>)}</div>
    </motion.section>

    <motion.section className="premium-status-deck" variants={rise} aria-label="Eternal live overview">
      <div><span><Radio/><small>CLIENT STATE</small></span><b className={runningProcesses ? 'green' : ''}>{runningProcesses ? `${runningProcesses} running` : 'Ready'}</b><i className={runningProcesses ? 'live' : ''}/></div>
      <div><span><Boxes/><small>PROFILES</small></span><b>{instances.length}</b><em>{instances.length === 1 ? 'isolated instance' : 'isolated instances'}</em></div>
      <div><span><Cpu/><small>SELECTED</small></span><b>{selected?.minecraftVersion || '—'}</b><em>{selected?.loader || 'No loader'}</em></div>
      <div><span><DownloadCloud/><small>ACTIVITY</small></span><b>{downloads.length}</b><em>transfer events</em></div>
      <button onClick={() => navigate('/developer')}><WandSparkles/><span><small>SYSTEM</small><b>Diagnostics</b></span><ChevronRight/></button>
    </motion.section>

    <motion.section className="beta6-console-grid beta8-console-grid premium-console-grid" variants={rise}>
      <article className="beta6-console beta6-command-card premium-console"><header><div><b>COMMAND CENTER</b><span>CTRL + K</span></div><Terminal/></header><div className="beta6-command-input"><i>/</i><span>Run real launcher actions</span><kbd>⌘K</kbd></div><div className="beta6-command-list"><button onClick={playSelected} disabled={!selected || launching}><Play/>Launch selected instance <kbd>{selected?.name || 'none'}</kbd></button><button onClick={() => navigate('/library')}><Boxes/>Switch / manage instance <kbd>instances</kbd></button><button onClick={() => navigate('/mods')}><PackageOpen/>Open Mod Hub <kbd>mods</kbd></button><button onClick={() => navigate('/servers')}><Server/>Open servers <kbd>servers</kbd></button><button onClick={() => navigate('/settings')}><Settings2/>Open settings <kbd>settings</kbd></button><button onClick={() => navigate('/developer')}><Wrench/>Diagnostics <kbd>developer</kbd></button></div></article>

      <article className="beta6-console beta6-hud-card premium-console"><header><div><b>ETERNAL CORE V1</b><span>IN-GAME CLIENT</span></div><Keyboard/></header><div className="beta6-hud-stage premium-hud-stage"><span className="hud-node node-fps"><Gauge/> FPS</span><span className="hud-node node-coords"><MapPin/> Coordinates</span><span className="hud-node node-keys">W A S D</span><span className="hud-node node-ping"><Activity/> Ping</span><div className="hud-crosshair">+</div><div className="premium-hud-vignette"/></div><div className="beta6-card-actions"><button onClick={() => navigate('/core')}>Explore Core</button><button className="accent" onClick={playSelected} disabled={!supportedCore || launching}>Launch Core profile</button></div><small className="beta6-hint">Real drag/edit happens in Minecraft. Press <b>H</b> for the HUD editor and <b>Right Shift</b> for ClickGUI.</small></article>

      <article className="beta6-console beta6-account-card premium-console"><header><div><b>ACCOUNTS</b><span>PLAY YOUR WAY</span></div><Users/></header><div className="beta6-mini-list">{accounts.slice(0, 3).map(item => <button key={item.id} onClick={() => navigate('/accounts')} className={item.id === activeId ? 'selected' : ''}><MinecraftHead skinUrl={item.skinUrl || ''} username={item.username} size={32}/><span><b>{item.username}</b><small>{item.type === 'microsoft' ? 'Microsoft' : 'Offline'}</small></span>{item.id === activeId && <i/>}</button>)}{!accounts.length && <div className="beta6-empty">No account added yet.</div>}</div><button className="beta6-wide-action" onClick={() => navigate('/accounts')}><UserRound/>Manage accounts</button></article>

      <article className="beta6-console beta6-instance-card premium-console"><header><div><b>INSTANCES</b><span>ISOLATED & CLEAN</span></div><Boxes/></header><button className="beta6-wide-action" onClick={() => navigate('/library')}>+ New instance</button><div className="beta6-mini-list instance-list">{instances.slice(0, 4).map(item => { const isRunning = running.some(row => row.instanceId === item.id); return <button key={item.id} onClick={() => { setSelectedId(item.id); navigate('/library'); }} className={item.id === selectedId ? 'selected' : ''}><span className={`instance-light ${isRunning ? 'live' : ''}`}/><span><b>{item.minecraftVersion} · {item.loader}</b><small>{item.name}</small></span><Settings2/></button>; })}{!instances.length && <div className="beta6-empty">Create your first Minecraft profile.</div>}</div></article>
    </motion.section>

    <motion.section className="beta6-feature-strip premium-capability-strip" variants={rise}>{capabilityTiles.map(([to, Icon, title, copy]) => <button key={`${to}-${title}`} onClick={() => navigate(to)}><Icon/><span><b>{title}</b><small>{copy}</small></span><ChevronRight/></button>)}</motion.section>

    <motion.div className="home-columns release-home-columns beta6-recent-row premium-recent-row" variants={rise}><section className="profiles-panel premium-recent-panel"><div className="section-head"><div><small>CONTINUE PLAYING</small><h2>Recent instances</h2></div><button onClick={() => navigate('/library')}>Manage everything <ChevronRight/></button></div><div className="profile-list">{recent.length ? recent.map(instance => <ProfileCard key={instance.id} instance={instance} running={running.some(row => row.instanceId === instance.id)} event={events[instance.id]}/>) : <div className="empty-card">No profiles yet. Create a real Minecraft instance to begin.</div>}</div></section></motion.div>
  </motion.div>;
}
