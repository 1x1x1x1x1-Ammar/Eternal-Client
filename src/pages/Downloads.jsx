import { DownloadCloud, HardDrive, LoaderCircle } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';

function progressValue(progress) {
  if (!progress || typeof progress !== 'object') return null;
  const done = Number(progress.task ?? progress.downloaded ?? progress.current ?? NaN);
  const total = Number(progress.total ?? progress.size ?? NaN);
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
  return Math.max(0, Math.min(100, (done / total) * 100));
}

export default function Downloads() {
  const launchEvents = useEternalStore(s => s.launchEvents);
  const downloads = useEternalStore(s => s.downloadEvents);
  const instances = useEternalStore(s => s.instances);

  const pipeline = Object.values(launchEvents).filter(event => ['DOWNLOADING', 'RESOLVING_LOADER', 'PREPARING_MODS', 'STARTING_JVM', 'VALIDATING'].includes(event.state));
  const rows = [...downloads.slice(-12).reverse(), ...pipeline];
  const liveCount = rows.filter(event => progressValue(event.progress) == null || progressValue(event.progress) < 100).length;

  return <div className="release-page beta8-page beta8-downloads-page">
    <div className="page-head beta8-page-head"><div><small>DOWNLOADS</small><h1>Transfer center</h1><p>Only genuine launcher/download activity is displayed here. Eternal never animates fake percentages.</p></div></div>

    <div className="beta8-download-summary">
      <div><DownloadCloud/><span><b>{rows.length}</b><small>Recent transfers</small></span></div>
      <div><LoaderCircle className={liveCount ? 'spin' : ''}/><span><b>{liveCount}</b><small>Active pipeline</small></span></div>
      <div><HardDrive/><span><b>ISOLATED</b><small>Instance storage</small></span></div>
    </div>

    <section className="release-panel beta8-download-panel">
      <div className="release-panel-head"><div><small>LIVE PIPELINE</small><h2>Downloads & preparation</h2></div><span>{rows.length}</span></div>
      <div className="download-page-list beta8-download-list">
        {rows.length === 0 && <div className="empty-downloads beta8-empty"><DownloadCloud /><b>Nothing transferring right now</b><span>Launch a fresh Minecraft version or install compatible content from Mod Hub and real progress will appear here.</span></div>}
        {rows.map((event, index) => {
          const instance = instances.find(i => i.id === event.instanceId);
          const percent = progressValue(event.progress);
          return <article className="download-page-row beta8-download-row" key={`${event.instanceId || 'download'}-${event.id || event.type || event.state}-${index}`}>
            <div className={`download-state-icon ${percent == null ? 'indeterminate' : ''}`}>{event.state === 'DOWNLOADING' || event.type === 'download' ? <DownloadCloud /> : <LoaderCircle />}</div>
            <div className="download-page-copy"><b>{instance?.name || event.name || 'Eternal download'}</b><span>{event.message || event.state || 'Transferring files…'}</span>{percent != null ? <div className="download-bar"><i style={{ width: `${percent}%` }} /></div> : <div className="download-bar indeterminate"><i /></div>}</div>
            <div className="download-page-meta"><strong>{percent == null ? 'LIVE' : `${percent.toFixed(0)}%`}</strong><small>{event.progress?.type || event.state || 'ACTIVE'}</small></div>
          </article>;
        })}
      </div>
    </section>

    <div className="download-footnote beta8-download-footnote"><HardDrive /><span>Files are written into the selected isolated instance directory. Temporary/incomplete transfers are never presented as installed content.</span></div>
  </div>;
}
