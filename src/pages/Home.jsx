import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Settings2, Plus, Sparkles, Server, ShieldCheck, Cpu, Boxes, Radio, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import MinecraftHead from '../components/MinecraftHead.jsx';

function ProfileCard({ instance, running, event }) {
  const navigate = useNavigate();
  const refresh = useEternalStore(s => s.refreshInstances);

  async function launch() {
    await call(api.instances.launch({ instanceId: instance.id }));
    setTimeout(refresh, 1000);
  }

  return <motion.div className={`profile-card ${running ? 'running' : ''}`} whileHover={{ x: 3 }}>
    <div className="profile-icon">{instance.loader === 'fabric' ? '🧵' : '⛏'}</div>
    <div className="profile-copy">
      <b>{instance.name}</b>
      <span>{instance.loader} {instance.minecraftVersion}</span>
    </div>
    <div className="profile-status">
      {running ? <><i className="green-dot" /><span>{event?.message || 'Minecraft running'}</span></> : <span>{instance.lastPlayedAt ? `Last played ${new Date(instance.lastPlayedAt).toLocaleString()}` : 'Not played yet'}</span>}
    </div>
    <button className={running ? 'secondary' : 'play-btn'} onClick={launch}><Play />{running ? 'Launch another' : 'Play'}</button>
    {running && <button className="danger-icon" onClick={() => call(api.instances.stop(instance.id))} title="Stop all processes for this profile"><Square /></button>}
    <button className="icon-btn" onClick={() => navigate('/library')} title="Profile settings"><Settings2 /></button>
  </motion.div>;
}

export default function Home({ setPath }) {
  const navigate = useNavigate();
  const accounts = useEternalStore(s => s.accounts);
  const activeId = useEternalStore(s => s.activeAccountId);
  const instances = useEternalStore(s => s.instances);
  const running = useEternalStore(s => s.running);
  const events = useEternalStore(s => s.launchEvents);
  const servers = useEternalStore(s => s.servers);

  const account = accounts.find(a => a.id === activeId) || null;
  const recent = useMemo(() => [...instances].sort((a, b) => new Date(b.lastPlayedAt || 0) - new Date(a.lastPlayedAt || 0)).slice(0, 4), [instances]);
  const quick = recent[0] || instances[0] || null;
  const quickRunning = quick ? running.some(r => r.instanceId === quick.id) : false;
  const runningProcesses = running.reduce((total, item) => total + Number(item.count || item.pids?.length || 1), 0);

  async function quickLaunch() {
    if (!quick) return navigate('/library');
    await call(api.instances.launch({ instanceId: quick.id }));
  }

  return <div>
    <section className="hero eternal-home-hero">
      <div className="hero-grid" /><div className="hero-glow" />
      <motion.div className="hero-copy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }}>
        <span className="eyebrow"><Sparkles />ETERNAL CLIENT · REAL MINECRAFT</span>
        <h1>YOUR GAME.<br /><span>YOUR ETERNAL.</span></h1>
        <p>Launch isolated Minecraft profiles, manage compatible mods, join real servers, and run Eternal Core inside Minecraft — from one compact desktop client.</p>
        <div className="hero-actions">
          <button className="hero-play" onClick={quickLaunch}><Play />{quick ? (quickRunning ? `Launch another · ${quick.name}` : `Play ${quick.name}`) : 'Create first profile'}</button>
          <button className="ghost" onClick={() => navigate('/library')}><Plus />New profile</button>
        </div>
      </motion.div>

      <div className="hero-mark">
        <img src="/assets/logo.svg" alt="Eternal" />
        <div className="hero-badge"><span>ETERNAL</span><b>v0.5.0-beta.5</b></div>
      </div>

      <div className="hero-account-card">
        <MinecraftHead skinUrl={account?.skinUrl || ''} username={account?.username || '?'} size={46} />
        <div><small>ACTIVE ACCOUNT</small><strong>{account?.username || 'No account'}</strong><span>{account ? (account.type === 'microsoft' ? 'Microsoft · Minecraft verified' : 'Offline profile') : 'Add an account in Settings'}</span></div>
        <i className={account ? 'connected' : ''} />
      </div>
    </section>

    <section className="home-live-strip" aria-label="Live Eternal status">
      <div><Boxes /><span>PROFILES</span><b>{instances.length}</b></div>
      <div><Radio /><span>GAME PROCESSES</span><b>{runningProcesses}</b></div>
      <div><Cpu /><span>QUICK PROFILE</span><b>{quick ? `${quick.minecraftVersion} · ${quick.loader}` : 'None'}</b></div>
      <div><ShieldCheck /><span>ACCOUNT</span><b>{account ? account.type.toUpperCase() : 'NONE'}</b></div>
    </section>

    <div className="home-columns">
      <section className="profiles-panel">
        <div className="section-head"><div><small>RECENT</small><h2>Last played profiles</h2></div><button onClick={() => navigate('/library')}>Manage all</button></div>
        <div className="profile-list">
          {recent.length ? recent.map(instance => <ProfileCard key={instance.id} instance={instance} running={running.some(r => r.instanceId === instance.id)} event={events[instance.id]} />) : <div className="empty-card">No profiles yet. Create a real Minecraft profile to begin.</div>}
        </div>
      </section>

      <aside className="integration-rail">
        <div className="rail-title"><span>INTEGRATIONS</span><small>Real links & capabilities</small></div>
        <div className="rail-card red"><div><b>ETERNAL CORE</b><span>In-game client · 1.21.11 Fabric</span></div><button onClick={() => setPath('/core')}>Open</button></div>
        <div className="rail-card"><div><b>MODRINTH</b><span>Mods resolved per profile</span></div><button onClick={() => navigate('/mods')}>Browse</button></div>
        <div className="rail-card"><div><b>ATERNOS</b><span>Standard mode · status / join / dashboard</span></div><button onClick={() => api.app.openExternal('https://aternos.org/servers/')}><ExternalLink />Open</button></div>
        {servers.length > 0 && <div className="server-mini"><Server /><div><b>{servers[0].name}</b><span>{servers[0].host}:{servers[0].port || 25565}</span></div></div>}
      </aside>
    </div>
  </div>;
}
