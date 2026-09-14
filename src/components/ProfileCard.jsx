import { Boxes, Clock3, FolderOpen, Layers3, Play, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';

export default function ProfileCard({ instance }) {
  const running = useEternalStore(s => s.running).find(item => item.instanceId === instance.id);
  const event = useEternalStore(s => s.launchEvents[instance.id]);
  const [error, setError] = useState('');
  const busy = event && ['VALIDATING', 'RESOLVING_LOADER', 'DOWNLOADING', 'PREPARING_MODS', 'STARTING_JVM'].includes(event.state);
  const Icon = instance.loader === 'fabric' ? Layers3 : Boxes;
  const played = instance.playtimeSeconds ? `${Math.floor(instance.playtimeSeconds / 3600)}h ${Math.floor((instance.playtimeSeconds % 3600) / 60)}m` : '0m';
  const stateLabel = busy ? event?.state?.replaceAll('_', ' ') : running ? 'RUNNING' : 'READY';

  async function action(fn) {
    setError('');
    try { return await fn(); } catch (e) { setError(e.message); }
  }

  return <motion.div className={`profile-card beta8-profile-card premium-library-profile ${running ? 'running' : ''} ${busy ? 'busy' : ''}`} whileHover={{ y: -2 }} transition={{ duration: .14 }}>
    <div className="profile-icon premium-library-icon"><Icon /></div>
    <div className="profile-copy premium-library-copy"><div className="premium-profile-title-row"><b>{instance.name}</b><span className={`premium-state-chip ${running ? 'running' : busy ? 'busy' : ''}`}>{stateLabel}</span></div><span>{instance.minecraftVersion} · {instance.loader}{instance.loaderVersion ? ` ${instance.loaderVersion}` : ''}</span><small><Clock3/>{played} played</small></div>
    <div className="profile-status premium-library-status">{busy && <><i className="pulse"/><span>{event.message}</span></>}{running && !busy && <><i className="green-dot"/><span>Running · {running.count} process{running.count === 1 ? '' : 'es'}</span></>}{!busy && !running && <><i className="premium-idle-dot"/><span>{instance.lastPlayedAt ? `Last played ${new Date(instance.lastPlayedAt).toLocaleString()}` : 'Ready for first launch'}</span></>}</div>
    <div className="premium-profile-actions">
      {running ? <>
        <button className="secondary" disabled={busy} onClick={() => action(() => call(api.instances.launch({ instanceId: instance.id })))}><Play/>Launch another</button>
        <button className="danger-icon" title="Stop all running Minecraft processes for this profile" onClick={() => action(() => call(api.instances.stop(instance.id)))}><Square/></button>
      </> : <button className="play-btn premium-card-play" disabled={busy} onClick={() => action(() => call(api.instances.launch({ instanceId: instance.id })))}><Play fill="currentColor"/>{busy ? 'Starting…' : 'Play'}</button>}
      <button className="icon-btn" title="Open profile folder" onClick={() => action(() => call(api.instances.openFolder(instance.id)))}><FolderOpen/></button>
    </div>
    {error && <div className="beta8-profile-error">{error}</div>}
  </motion.div>;
}
