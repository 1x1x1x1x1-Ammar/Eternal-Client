import { AlertTriangle, CheckCircle2, CircleStop, LoaderCircle } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';

function progress(event) {
  const data = event?.progress;
  if (!data || typeof data !== 'object') return null;
  const current = Number(data.current ?? data.task ?? data.downloaded ?? NaN);
  const total = Number(data.total ?? data.size ?? NaN);
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return null;
  return Math.max(0, Math.min(100, current / total * 100));
}

export default function ActivityDock() {
  const events = useEternalStore(s => s.launchEvents);
  const instances = useEternalStore(s => s.instances);
  const list = Object.values(events)
    .sort((a, b) => Number(b.receivedAt || 0) - Number(a.receivedAt || 0))
    .slice(0, 3);
  if (!list.length) return null;

  return <div className="activity-dock beta8-activity-dock" aria-live="polite">
    {list.map(event => {
      const value = progress(event);
      const instance = instances.find(item => item.id === event.instanceId);
      const stopped = event.state === 'STOPPED';
      const running = event.state === 'RUNNING';
      return <div className={`activity-row ${running ? 'is-running' : stopped ? 'is-stopped' : ''}`} key={event.instanceId}>
        {running ? <CheckCircle2 className="green"/> : stopped ? <CircleStop/> : event.warning ? <AlertTriangle className="amber"/> : <LoaderCircle className="spin"/>}
        <div className="activity-copy"><small>{instance?.name || 'Minecraft'}</small><b>{event.state}</b><span>{event.message || 'Working…'}</span>{value != null && <div className="activity-progress"><i style={{ width: `${value}%` }}/></div>}</div>
        <strong>{value != null ? `${Math.round(value)}%` : running ? 'LIVE' : stopped ? 'DONE' : '…'}</strong>
      </div>;
    })}
  </div>;
}
