import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Boxes, Cloud, Cpu, DownloadCloud, Gauge, Keyboard, MapPin, PackageOpen,
  Play, Radio, Server, Settings2, ShieldCheck, SlidersHorizontal, Square,
  Terminal, UserRound, Users, Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import MinecraftHead from '../components/MinecraftHead.jsx';
import eternalLogo from '../../assets/logo.svg';

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

  return <motion.div className={`profile-card beta8-profile-card ${running ? 'running' : ''}`} whileHover={{ x: 3 }}>
    <div className="profile-icon"><Boxes /></div>
    <div className="profile-copy"><b>{instance.name}</b><span>{instance.minecraftVersion} · {instance.loader}</span></div>
    <div className="profile-status">{running ? <><i className="green-dot"/><span>{event?.message || 'Minecraft running'}</span></> : <span>{instance.lastPlayedAt ? `Last played ${new Date(instance.lastPlayedAt).toLocaleString()}` : 'Not played yet'}</span>}</div>
    <button className={running ? 'secondary' : 'play-btn'} disabled={busy} onClick={launch}><Play />{busy ? 'Starting…' : running ? 'Launch another' : 'Play'}</button>
    {running && <button className="danger-icon" onClick={() => call(api.instances.stop(instance.id))} title="Stop all processes for this profile"><Square /></button>}
    <button className="icon-btn" onClick={() => navigate('/library')} title="Profile settings"><Settings2 /></button>
    {error && <div className="beta8-profile-error">{error}</div>}
  </motion.div>;
}

const featureTiles = [
  ['/library', Boxes, 'Instances', 'Create and manage isolated Minecraft profiles'],
  ['/mods', PackageOpen, 'Mods', 'Browse and install compatible Modrinth content'],
  ['/servers', Server, 'Servers', 'Ping and join saved Minecraft servers'],
  ['/accounts', UserRound, 'Accounts', 'Microsoft and offline profiles']
];
const capabilityTiles = [
  ['/developer', Gauge, 'High performance', 'Real launch/runtime diagnostics'],
  ['/mods', PackageOpen, 'Modrinth integration', 'Version + loader filtered installs'],
  ['/servers', Server, 'Server browser', 'Real status, ping and quick join'],
  ['/core', ShieldCheck, 'Real in-game client', 'Eternal Core runs inside Minecraft'],
  ['/core', SlidersHorizontal, 'Full customization', 'HUD, ClickGUI, zoom and profiles'],
  ['/downloads', Cloud, 'Regular updates', 'Build and download activity']
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

  async function playSelected() {
    setLaunchError('');
    if (!selected) return navigate('/library');
    setLaunching(true);
    try { await call(api.instances.launch({ instanceId: selected.id })); }
    catch (error) { setLaunchError(error.message); }
    finally { setLaunching(false); }
  }

  return <div className="release-home beta6-home beta8-home">
    <section className="release-hero beta6-hero beta8-hero">
      <div className="release-hero-grid"/><div className="release-hero-atmosphere"/><div className="beta6-scanline"/>
      <motion.div className="release-hero-copy" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .28 }}>
        <span className="release-kicker">ETERNAL CLIENT · v{appVersion || '0.8.0-beta.8'}</span>
        <h1>Play Minecraft<br/><strong>Your Way.</strong></h1>
        <p>Fast. Clean. Powerful. Eternal.</p>
        <div className="release-launch-row">
          <button className="release-play" disabled={launching} onClick={playSelected}><Play fill="currentColor"/>{launching ? 'Starting…' : selected ? selectedRunning ? 'Launch another' : 'Play' : 'Create profile'}</button>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={!instances.length || launching}>{!instances.length && <option>No profiles yet</option>}{instances.map(instance => <option key={instance.id} value={instance.id}>{instance.minecraftVersion} · {instance.loader} · {instance.name}</option>)}</select>
          <button className="release-gear" onClick={() => navigate('/library')} title="Instance settings"><Settings2/></button>
        </div>
        {launchError && <div className="release-inline-error">{launchError}</div>}
      </motion.div>
      <motion.div className="release-hero-emblem" initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .4 }}><div className="release-emblem-glow"/><img src={eternalLogo} alt="Eternal"/><span>BEYOND SURVIVAL</span></motion.div>
      <div className="release-hero-account"><MinecraftHead skinUrl={account?.skinUrl || ''} username={account?.username || '?'} size={24}/><span className={account ? 'online' : ''}/><b>{account?.username || 'No account'}</b><small>{account ? account.type === 'microsoft' ? 'Microsoft' : 'Offline' : 'Add account'}</small></div>
      <div className="release-feature-row">{featureTiles.map(([to, Icon, title, copy]) => <button key={to} onClick={() => navigate(to)}><Icon/><span><b>{title}</b><small>{copy}</small></span></button>)}</div>
    </section>

    <section className="beta6-console-grid beta8-console-grid">
      <article className="beta6-console beta6-command-card"><header><div><b>COMMAND CENTER</b><span>CTRL + K</span></div><Terminal/></header><div className="beta6-command-input">/<span>Run real launcher actions</span></div><div className="beta6-command-list"><button onClick={playSelected} disabled={!selected || launching}><Play/>Launch selected instance <kbd>{selected?.name || 'none'}</kbd></button><button onClick={() => navigate('/library')}><Boxes/>Switch / manage instance <kbd>instances</kbd></button><button onClick={() => navigate('/mods')}><PackageOpen/>Open mods <kbd>mods</kbd></button><button onClick={() => navigate('/servers')}><Server/>Open servers <kbd>servers</kbd></button><button onClick={() => navigate('/settings')}><Settings2/>Open settings <kbd>settings</kbd></button><button onClick={() => navigate('/developer')}><Wrench/>Diagnostics <kbd>developer</kbd></button></div></article>

      <article className="beta6-console beta6-hud-card"><header><div><b>HUD EDITOR</b><span>MAKE IT YOURS</span></div><Keyboard/></header><div className="beta6-hud-stage"><span className="hud-node node-fps"><Gauge/> FPS</span><span className="hud-node node-coords"><MapPin/> Coordinates</span><span className="hud-node node-keys">Keystrokes</span><span className="hud-node node-ping"><Activity/> Ping</span><div className="hud-crosshair">+</div></div><div className="beta6-card-actions"><button onClick={() => navigate('/core')}>Eternal Core</button><button className="accent" onClick={playSelected} disabled={!supportedCore || launching}>Launch Core profile</button></div><small className="beta6-hint">Actual drag/edit happens in Minecraft: press <b>H</b>. This launcher preview never writes fake positions.</small></article>

      <article className="beta6-console beta6-account-card"><header><div><b>ACCOUNTS</b><span>PLAY YOUR WAY</span></div><Users/></header><div className="beta6-mini-list">{accounts.slice(0, 3).map(item => <button key={item.id} onClick={() => navigate('/accounts')} className={item.id === activeId ? 'selected' : ''}><MinecraftHead skinUrl={item.skinUrl || ''} username={item.username} size={32}/><span><b>{item.username}</b><small>{item.type === 'microsoft' ? 'Microsoft' : 'Offline'}</small></span>{item.id === activeId && <i/>}</button>)}{!accounts.length && <div className="beta6-empty">No account added yet.</div>}</div><button className="beta6-wide-action" onClick={() => navigate('/accounts')}><UserRound/>Manage accounts</button></article>

      <article className="beta6-console beta6-instance-card"><header><div><b>INSTANCES</b><span>MANAGE EVERYTHING</span></div><Boxes/></header><button className="beta6-wide-action" onClick={() => navigate('/library')}>+ New instance</button><div className="beta6-mini-list instance-list">{instances.slice(0, 4).map(item => { const isRunning = running.some(row => row.instanceId === item.id); return <button key={item.id} onClick={() => { setSelectedId(item.id); navigate('/library'); }} className={item.id === selectedId ? 'selected' : ''}><span className={`instance-light ${isRunning ? 'live' : ''}`}/><span><b>{item.minecraftVersion} · {item.loader}</b><small>{item.name}</small></span><Settings2/></button>; })}{!instances.length && <div className="beta6-empty">Create your first Minecraft profile.</div>}</div></article>
    </section>

    <section className="beta6-feature-strip">{capabilityTiles.map(([to, Icon, title, copy]) => <button key={`${to}-${title}`} onClick={() => navigate(to)}><Icon/><span><b>{title}</b><small>{copy}</small></span></button>)}</section>
    <section className="home-live-strip beta6-live-strip" aria-label="Live Eternal status"><div><Boxes/><span>PROFILES</span><b>{instances.length}</b></div><div><Radio/><span>GAME PROCESSES</span><b>{runningProcesses}</b></div><div><Cpu/><span>SELECTED</span><b>{selected ? `${selected.minecraftVersion} · ${selected.loader}` : 'None'}</b></div><div><ShieldCheck/><span>ACCOUNT</span><b>{account ? account.type.toUpperCase() : 'NONE'}</b></div><div><DownloadCloud/><span>RECENT ACTIVITY</span><b>{downloads.length}</b></div></section>

    <div className="home-columns release-home-columns beta6-recent-row"><section className="profiles-panel"><div className="section-head"><div><small>CONTINUE PLAYING</small><h2>Recent instances</h2></div><button onClick={() => navigate('/library')}>Manage everything</button></div><div className="profile-list">{recent.length ? recent.map(instance => <ProfileCard key={instance.id} instance={instance} running={running.some(row => row.instanceId === instance.id)} event={events[instance.id]}/>) : <div className="empty-card">No profiles yet. Create a real Minecraft instance to begin.</div>}</div></section></div>
  </div>;
}
