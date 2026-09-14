import { Boxes, FolderOpen, Layers3, Play, Square } from 'lucide-react';
import { useState } from 'react';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';

export default function ProfileCard({ instance }) {
  const running = useEternalStore(s => s.running).find(item => item.instanceId === instance.id);
  const event = useEternalStore(s => s.launchEvents[instance.id]);
  const [error, setError] = useState('');
  const busy = event && ['VALIDATING', 'RESOLVING_LOADER', 'DOWNLOADING', 'STARTING_JVM'].includes(event.state);
  const Icon = instance.loader === 'fabric' ? Layers3 : Boxes;

  async function action(fn) {
    setError('');
    try { return await fn(); } catch (e) { setError(e.message); }
  }

  return <div className={`profile-card beta8-profile-card ${running ? 'running' : ''}`}>
    <div className="profile-icon"><Icon /></div>
    <div className="profile-copy"><b>{instance.name}</b><span>{instance.minecraftVersion} · {instance.loader}{instance.loaderVersion ? ` ${instance.loaderVersion}` : ''}</span><small>{instance.playtimeSeconds ? `${Math.floor(instance.playtimeSeconds / 3600)}h ${Math.floor((instance.playtimeSeconds % 3600) / 60)}m played` : 'Ready to launch'}</small></div>
    <div className="profile-status">{busy && <><i className="pulse"/><span>{event.message}</span></>}{running && <><i className="green-dot"/><span>Running · {running.count} process{running.count === 1 ? '' : 'es'}</span></>}{!busy && !running && event?.state === 'STOPPED' && <span>{event.message}</span>}</div>
    {running ? <>
      <button className="secondary" disabled={busy} onClick={() => action(() => call(api.instances.launch({ instanceId: instance.id })))}><Play/>Launch another</button>
      <button className="danger-icon" title="Stop all running Minecraft processes for this profile" onClick={() => action(() => call(api.instances.stop(instance.id)))}><Square/></button>
    </> : <button className="play-btn" disabled={busy} onClick={() => action(() => call(api.instances.launch({ instanceId: instance.id })))}><Play fill="currentColor"/>{busy ? 'Starting…' : 'Play'}</button>}
    <button className="icon-btn" title="Open profile folder" onClick={() => action(() => call(api.instances.openFolder(instance.id)))}><FolderOpen/></button>
    {error && <div className="beta8-profile-error">{error}</div>}
  </div>;
}
