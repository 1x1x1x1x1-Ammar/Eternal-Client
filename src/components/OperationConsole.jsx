import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Download, Gamepad2, LoaderCircle, Terminal, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEternalStore } from '../store/useEternalStore.js';

function timeOf(event) {
  const value = Number(event?.receivedAt || event?.timestamp || Date.now());
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function label(channel = '') {
  return String(channel || 'eternal').replace(':', ' · ').replaceAll('_', ' ').toUpperCase();
}
function stateOf(event) {
  if (event?.level === 'error' || event?.state === 'ERROR' || event?.state === 'PROCESS_ERROR') return 'error';
  if (event?.level === 'warning' || event?.warning) return 'warning';
  if (event?.state === 'SUCCESS' || event?.state === 'RUNNING' || event?.state === 'INSTALLED' || event?.state === 'STOPPED') return 'success';
  if (event?.state === 'LOG' || event?.state === 'DEBUG') return 'log';
  return 'working';
}
function EventIcon({ kind }) {
  if (kind === 'error' || kind === 'warning') return <AlertTriangle/>;
  if (kind === 'success') return <CheckCircle2/>;
  if (kind === 'working') return <LoaderCircle className="spin"/>;
  return <Terminal/>;
}

export default function OperationConsole() {
  const open = useEternalStore(s => s.operationConsoleOpen);
  const setOpen = useEternalStore(s => s.setOperationConsoleOpen);
  const operations = useEternalStore(s => s.operationEvents);
  const launchLogs = useEternalStore(s => s.launchLogs);
  const launchEvents = useEternalStore(s => s.launchEvents);
  const downloads = useEternalStore(s => s.downloadEvents);
  const clearOperations = useEternalStore(s => s.clearOperationEvents);
  const [tab, setTab] = useState('operations');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  const minecraft = useMemo(() => {
    const lifecycle = Object.values(launchEvents).map(event => ({ ...event, channel: `minecraft:${event.state || 'state'}` }));
    const logs = Object.values(launchLogs).flat().map(event => ({ ...event, channel: `minecraft:${event.level || event.state || 'log'}` }));
    return [...logs, ...lifecycle].sort((a, b) => Number(a.receivedAt || 0) - Number(b.receivedAt || 0));
  }, [launchEvents, launchLogs]);

  const rows = useMemo(() => {
    if (tab === 'minecraft') return minecraft.slice(-180);
    if (tab === 'transfers') return downloads.slice(-140).map(event => ({ ...event, channel: event.name ? `download:${event.name}` : 'download:event' }));
    return operations.slice(-140);
  }, [tab, minecraft, downloads, operations]);

  const errors = [...operations, ...minecraft].filter(event => stateOf(event) === 'error').length;
  const warnings = minecraft.filter(event => stateOf(event) === 'warning').length;
  const working = operations.filter(event => event.state === 'STARTED').length - operations.filter(event => event.state === 'SUCCESS' || event.state === 'ERROR').length;

  async function copyVisible() {
    const text = rows.map(event => `[${timeOf(event)}] ${label(event.channel)} ${event.level || event.state || ''} ${event.message || ''}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return <>
    {!open && <button className={`v1-console-peek ${errors ? 'has-error' : ''}`} onClick={() => setOpen(true)} title="Open Eternal operation console (Ctrl+J)">
      <Terminal/><span>CONSOLE</span>{working > 0 && <i/>}{warnings > 0 && <b>{warnings}</b>}{errors > 0 && <b>{errors}</b>}
    </button>}
    <AnimatePresence>
      {open && <motion.section className="v1-operation-console" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: .18, ease: [0.2, 0.8, 0.2, 1] }}>
        <header>
          <div className="v1-console-brand"><span className="v1-console-led"/><Terminal/><div><b>ETERNAL CONSOLE</b><small>REAL OPERATIONS + MINECRAFT RUNTIME · CTRL + J</small></div></div>
          <nav>
            <button className={tab === 'operations' ? 'active' : ''} onClick={() => setTab('operations')}><Terminal/>Operations <em>{operations.length}</em></button>
            <button className={tab === 'minecraft' ? 'active' : ''} onClick={() => setTab('minecraft')}><Gamepad2/>Minecraft <em>{minecraft.length}</em></button>
            <button className={tab === 'transfers' ? 'active' : ''} onClick={() => setTab('transfers')}><Download/>Transfers <em>{downloads.length}</em></button>
          </nav>
          <div className="v1-console-actions">
            <button onClick={copyVisible} title="Copy visible console"><Copy/>{copied ? 'Copied' : 'Copy'}</button>
            {tab === 'operations' && <button onClick={clearOperations} title="Clear operation history"><Trash2/>Clear</button>}
            <button className="icon" onClick={() => setOpen(false)} title="Close console"><X/></button>
          </div>
        </header>
        <div className="v1-console-terminal" role="log" aria-live="polite">
          {rows.length ? rows.map((event, index) => {
            const kind = stateOf(event);
            const progress = event?.progress && Number(event.progress.total) > 0
              ? Math.max(0, Math.min(100, Number(event.progress.current ?? event.progress.transferred ?? 0) / Number(event.progress.total) * 100))
              : null;
            return <div className={`v1-console-line ${kind}`} key={`${event.id || event.channel || 'event'}-${event.receivedAt || event.timestamp || index}-${index}`}>
              <time>{timeOf(event)}</time>
              <EventIcon kind={kind}/>
              <code>{label(event.channel)}</code>
              <span>{event.message || event.state || 'Event received'}</span>
              <strong>{event.level?.toUpperCase() || event.state || (kind === 'log' ? 'LOG' : 'WORKING')}</strong>
              {progress != null && <div className="v1-console-progress"><i style={{ width: `${progress}%` }}/></div>}
            </div>;
          }) : <div className="v1-console-empty"><Terminal/><b>No events yet</b><span>Create an instance, install content or launch Minecraft. Install/start warnings, Core diagnostics, JVM log lines and real failures will stream here.</span></div>}
        </div>
        <footer><span><i className="ok"/>SUCCESS</span><span><i className="work"/>ACTIVE</span><span><i className="bad"/>WARNING / ERROR</span><b>Nothing here is simulated.</b></footer>
      </motion.section>}
    </AnimatePresence>
  </>;
}
