import { AlertTriangle, CheckCircle2, DownloadCloud, HardDrive, LoaderCircle, PackageCheck, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useEternalStore } from '../store/useEternalStore.js';

function progressValue(progress) {
  if (!progress || typeof progress !== 'object') return null;
  const done = Number(progress.task ?? progress.downloaded ?? progress.current ?? progress.transferred ?? NaN);
  const total = Number(progress.total ?? progress.size ?? NaN);
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
  return Math.max(0, Math.min(100, (done / total) * 100));
}
function bytePair(progress) {
  if (!progress || typeof progress !== 'object') return null;
  const done = Number(progress.current ?? progress.transferred ?? NaN);
  const total = Number(progress.total ?? NaN);
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
  return { done, total };
}
function formatBytes(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(number) / Math.log(1024)));
  return `${(number / Math.pow(1024, index)).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}
function isDone(event) {
  return ['INSTALLED', 'CURRENT', 'SUCCESS', 'RUNNING', 'STOPPED'].includes(event?.state) || progressValue(event?.progress) >= 100;
}
function isError(event) {
  return event?.state === 'ERROR' || event?.warning || event?.level === 'error';
}

export default function Downloads() {
  const launchEvents = useEternalStore(s => s.launchEvents);
  const downloads = useEternalStore(s => s.downloadEvents);
  const instances = useEternalStore(s => s.instances);
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const pipeline = Object.values(launchEvents)
      .filter(event => ['DOWNLOADING', 'RESOLVING_LOADER', 'PREPARING_MODS', 'STARTING_JVM', 'VALIDATING', 'PROCESS_ERROR', 'STOPPED'].includes(event.state))
      .map(event => ({ ...event, type: event.type || 'minecraft', name: instances.find(i => i.id === event.instanceId)?.name || 'Minecraft' }));
    return [...downloads.slice(-80), ...pipeline]
      .sort((a, b) => Number(b.receivedAt || 0) - Number(a.receivedAt || 0));
  }, [downloads, launchEvents, instances]);

  const visible = rows.filter(event => filter === 'all' || (filter === 'active' ? !isDone(event) && !isError(event) : filter === 'errors' ? isError(event) : isDone(event)));
  const active = rows.filter(event => !isDone(event) && !isError(event));
  const completed = rows.filter(event => isDone(event) && !isError(event));
  const errors = rows.filter(isError);
  const measuredBytes = rows.reduce((sum, event) => sum + (bytePair(event.progress)?.done || 0), 0);

  return <div className="release-page beta8-page beta8-downloads-page v1-downloads-page">
    <div className="page-head beta8-page-head premium-page-head"><div><small>TRANSFERS</small><h1>Real download center</h1><p>Minecraft assets, libraries, Modrinth content and Eternal updates appear here from backend events. Unknown-size work stays indeterminate instead of inventing a percentage.</p></div></div>

    <div className="beta8-download-summary v1-download-summary">
      <div><DownloadCloud/><span><b>{active.length}</b><small>Active transfers</small></span></div>
      <div><PackageCheck/><span><b>{completed.length}</b><small>Completed this session</small></span></div>
      <div><AlertTriangle/><span><b>{errors.length}</b><small>Warnings / failures</small></span></div>
      <div><HardDrive/><span><b>{formatBytes(measuredBytes)}</b><small>Measured bytes transferred</small></span></div>
    </div>

    <section className="release-panel beta8-download-panel v1-download-panel">
      <div className="release-panel-head v1-transfer-head">
        <div><small>BACKEND EVENT STREAM</small><h2>Downloads & launch preparation</h2></div>
        <div className="v1-transfer-filters">
          {['all','active','complete','errors'].map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value.toUpperCase()}</button>)}
          <span>{visible.length}</span>
        </div>
      </div>
      <div className="download-page-list beta8-download-list v1-download-list">
        {visible.length === 0 && <div className="empty-downloads beta8-empty"><DownloadCloud /><b>No matching transfer events</b><span>Launch a version, install from Mod Hub or download an Eternal update. Real backend activity will appear here automatically.</span></div>}
        {visible.map((event, index) => {
          const percent = progressValue(event.progress);
          const bytes = bytePair(event.progress);
          const speed = Number(event.progress?.bytesPerSecond || 0);
          const done = isDone(event);
          const failed = isError(event);
          return <article className={`download-page-row beta8-download-row v1-download-row ${done ? 'done' : ''} ${failed ? 'failed' : ''}`} key={`${event.instanceId || 'download'}-${event.id || event.type || event.state}-${event.receivedAt || index}-${index}`}>
            <div className={`download-state-icon ${percent == null && !done ? 'indeterminate' : ''}`}>{failed ? <AlertTriangle/> : done ? <CheckCircle2/> : event.state === 'DOWNLOADING' || event.type === 'download' || event.type === 'update' ? <DownloadCloud /> : <LoaderCircle className="spin"/>}</div>
            <div className="download-page-copy">
              <div className="v1-download-title"><b>{event.name || 'Eternal transfer'}</b><small>{event.type || event.progress?.type || event.source || 'launcher'}</small></div>
              <span>{event.message || event.state || 'Transferring files…'}</span>
              {percent != null ? <div className="download-bar"><i style={{ width: `${percent}%` }} /></div> : !done && !failed ? <div className="download-bar indeterminate"><i /></div> : null}
              <div className="v1-download-telemetry">
                {bytes && <span>{formatBytes(bytes.done)} / {formatBytes(bytes.total)}</span>}
                {speed > 0 && <span>{formatBytes(speed)}/s</span>}
                {event.receivedAt && <span>{new Date(event.receivedAt).toLocaleTimeString()}</span>}
              </div>
            </div>
            <div className="download-page-meta"><strong>{failed ? 'ERROR' : done ? 'DONE' : percent == null ? 'LIVE' : `${percent.toFixed(0)}%`}</strong><small>{event.state || event.progress?.type || 'ACTIVE'}</small></div>
          </article>;
        })}
      </div>
    </section>

    <div className="download-footnote beta8-download-footnote"><HardDrive /><span>Transfers originate from real launcher/core/updater events. `.part` downloads and unknown-size preparation are never shown as completed until the backend reports completion.</span></div>
  </div>;
}
