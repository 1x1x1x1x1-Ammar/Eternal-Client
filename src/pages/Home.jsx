import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Boxes, Cpu, PackageOpen, Play, Radio, Server, Settings2, ShieldCheck, Square, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';

function ProfileCard({ instance, running, event }) {
  const navigate = useNavigate();
  const refresh = useEternalStore(s => s.refreshInstances);

  async function launch() {
    await call(api.instances.launch({ instanceId: instance.id }));
    setTimeout(refresh, 1000);
  }

  return <motion.div className={`profile-card ${running ? 'running' : ''}`} whileHover={{ x: 3 }}>
    <div className="profile-icon"><Boxes /></div>
    <div className="profile-copy"><b>{instance.name}</b><span>{instance.minecraftVersion} · {instance.loader}</span></div>
    <div className="profile-status">{running ? <><i className="green-dot" /><span>{event?.message || 'Minecraft running'}</span></> : <span>{instance.lastPlayedAt ? `Last played ${new Date(instance.lastPlayedAt).toLocaleString()}` : 'Not played yet'}</span>}</div>
    <button className={running ? 'secondary' : 'play-btn'} onClick={launch}><Play />{running ? 'Launch another' : 'Play'}</button>
    {running && <button className="danger-icon" onClick={() => call(api.instances.stop(instance.id))} title="Stop all processes for this profile"><Square /></button>}
    <button className="icon-btn" onClick={() => navigate('/library')} title="Profile settings"><Settings2 /></button>
  </motion.div>;
}

const featureTiles = [
  ['/library', Boxes, 'Latest release', 'Create and manage isolated Minecraft profiles'],
  ['/mods', PackageOpen, 'Mods', 'Browse compatible Modrinth content'],
  ['/servers', Server, 'Servers', 'Ping and join saved Minecraft servers'],
  ['/accounts', UserRound, 'Accounts', 'Microsoft and offline profiles']
];

export default function Home() {
  const navigate = useNavigate();
  const accounts = useEternalStore(s => s.accounts);
  const activeId = useEternalStore(s => s.activeAccountId);
  const instances = useEternalStore(s => s.instances);
  const running = useEternalStore(s => s.running);
  const events = useEternalStore(s => s.launchEvents);
  const servers = useEternalStore(s => s.servers);
  const [selectedId, setSelectedId] = useState('');
  const [launchError, setLaunchError] = useState('');

  const account = accounts.find(a => a.id === activeId) || null;
  const recent = useMemo(() => [...instances].sort((a, b) => new Date(b.lastPlayedAt || 0) - new Date(a.lastPlayedAt || 0)).slice(0, 4), [instances]);

  useEffect(() => {
    if (!instances.length) return setSelectedId('');
    if (!instances.some(i => i.id === selectedId)) setSelectedId(recent[0]?.id || instances[0].id);
  }, [instances, recent, selectedId]);

  const selected = instances.find(i => i.id === selectedId) || recent[0] || instances[0] || null;
  const selectedRunning = selected ? running.some(r => r.instanceId === selected.id) : false;
  const runningProcesses = running.reduce((total, item) => total + Number(item.count || item.pids?.length || 1), 0);

  async function playSelected() {
    setLaunchError('');
    if (!selected) return navigate('/library');
    try { await call(api.instances.launch({ instanceId: selected.id })); }
    catch (error) { setLaunchError(error.message); }
  }

  return <div className="release-home">
    <section className="release-hero">
      <div className="release-hero-grid" />
      <div className="release-hero-atmosphere" />
      <motion.div className="release-hero-copy" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .28 }}>
        <span className="release-kicker">ETERNAL CLIENT · v0.5.0-beta.5</span>
        <h1>Play Minecraft<br/><strong>Your Way.</strong></h1>
        <p>Fast. Clean. Powerful. Eternal.</p>
        <div className="release-launch-row">
          <button className="release-play" onClick={playSelected}><Play fill="currentColor" />{selected ? (selectedRunning ? 'Launch another' : 'Play') : 'Create profile'}</button>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={!instances.length}>
            {!instances.length && <option>No profiles yet</option>}
            {instances.map(instance => <option key={instance.id} value={instance.id}>{instance.minecraftVersion} · {instance.loader} · {instance.name}</option>)}
          </select>
          <button className="release-gear" onClick={() => navigate('/library')} title="Instance settings"><Settings2 /></button>
        </div>
        {launchError && <div className="release-inline-error">{launchError}</div>}
      </motion.div>

      <motion.div className="release-hero-emblem" initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .4 }}>
        <div className="release-emblem-glow" />
        <img src="/assets/logo.svg" alt="Eternal" />
        <span>BEYOND SURVIVAL</span>
      </motion.div>

      <div className="release-hero-account"><span className={account ? 'online' : ''} /> <b>{account?.username || 'No account'}</b><small>{account ? (account.type === 'microsoft' ? 'Microsoft' : 'Offline') : 'Add account'}</small></div>

      <div className="release-feature-row">
        {featureTiles.map(([to, Icon, title, copy]) => <button key={to} onClick={() => navigate(to)}><Icon /><span><b>{title}</b><small>{copy}</small></span></button>)}
      </div>
    </section>

    <section className="home-live-strip" aria-label="Live Eternal status">
      <div><Boxes /><span>PROFILES</span><b>{instances.length}</b></div>
      <div><Radio /><span>GAME PROCESSES</span><b>{runningProcesses}</b></div>
      <div><Cpu /><span>SELECTED</span><b>{selected ? `${selected.minecraftVersion} · ${selected.loader}` : 'None'}</b></div>
      <div><ShieldCheck /><span>ACCOUNT</span><b>{account ? account.type.toUpperCase() : 'NONE'}</b></div>
    </section>

    <div className="home-columns release-home-columns">
      <section className="profiles-panel">
        <div className="section-head"><div><small>CONTINUE PLAYING</small><h2>Recent instances</h2></div><button onClick={() => navigate('/library')}>Manage everything</button></div>
        <div className="profile-list">{recent.length ? recent.map(instance => <ProfileCard key={instance.id} instance={instance} running={running.some(r => r.instanceId === instance.id)} event={events[instance.id]} />) : <div className="empty-card">No profiles yet. Create a real Minecraft instance to begin.</div>}</div>
      </section>

      <aside className="integration-rail release-rail">
        <div className="rail-title"><span>ETERNAL NETWORK</span><small>Real capabilities only</small></div>
        <div className="rail-card red"><div><b>ETERNAL CORE</b><span>Real in-game client · 1.21.11 Fabric</span></div><button onClick={() => navigate('/core')}>OPEN</button></div>
        <div className="rail-card"><div><b>MODRINTH</b><span>Loader + version filtered installs</span></div><button onClick={() => navigate('/mods')}>BROWSE</button></div>
        <div className="rail-card"><div><b>ATERNOS</b><span>Real server status + quick join</span></div><button onClick={() => navigate('/servers')}>SERVERS</button></div>
        {servers.length > 0 && <div className="server-mini"><Server /><div><b>{servers[0].name}</b><span>{servers[0].host}:{servers[0].port || 25565}</span></div></div>}
      </aside>
    </div>
  </div>;
}
