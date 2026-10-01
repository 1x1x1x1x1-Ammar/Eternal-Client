import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Aperture, Boxes, ChevronRight, CheckCircle2, Clock3, Crosshair, Download, Eye, Gauge, Gem, Heart, Keyboard, MapPin,
  MemoryStick, MousePointer2, Palette, Play, Server, Shield, ShieldCheck, SlidersHorizontal,
  Sparkles, Sun, Timer, Waypoints, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import { keyName } from '../lib/launcherView.js';
import eternalLogo from '../../assets/logo.svg';

const modules = [
  ['Watermark', Sparkles, 'Animated Eternal identity chip rendered in-game'],
  ['FPS', Gauge, 'Live Minecraft client FPS'],
  ['CPS', MousePointer2, 'Actual left/right click activity'],
  ['Keystrokes', Keyboard, 'Current WASD input state'],
  ['Coordinates', MapPin, 'Live player XYZ'],
  ['Ping', Activity, 'Current server latency'],
  ['Speed', Gauge, 'Horizontal movement speed'],
  ['Direction', Waypoints, 'Live player direction'],
  ['Health', Heart, 'Current and maximum health'],
  ['Armor', Shield, 'Live armor points'],
  ['Food', Activity, 'Live hunger level'],
  ['Server', Server, 'Current server or local world state'],
  ['Memory', MemoryStick, 'Current JVM heap usage'],
  ['Session', Timer, 'Elapsed Core session time'],
  ['Clock', Clock3, 'Local 24-hour clock'],
  ['AttackCooldown', Crosshair, 'Attack recovery with a live ready indicator'],
  ['HeldItem', Shield, 'Held item count and durability'],
  ['ArmorDurability', ShieldCheck, 'Lowest equipped armor durability'],
  ['Offhand', Shield, 'Offhand item count and durability'],
  ['Movement', Gauge, 'Fall distance and vertical speed'],
  ['CombatSupplies', Boxes, 'Preset-aware counts of carried combat supplies'],
  ['Zoom', Eye, 'Smooth configurable hold-key FOV zoom'],
  ['Crosshair', Crosshair, 'Custom gap, length, thickness, dot and target color'],
  ['Fullbright', Sun, 'Maximum client brightness with restore on disable'],
  ['ToggleSprint', Zap, 'Syncs to Minecraft toggle sprint'],
  ['ToggleSneak', Zap, 'Syncs to Minecraft toggle sneak'],
  ['Perspective', Aperture, 'Rebindable camera perspective cycle']
];

function shortHash(value) { return value ? `${value.slice(0, 12)}…` : '—'; }

export default function Core() {
  const instances = useEternalStore(s => s.instances);
  const running = useEternalStore(s => s.running);
  const appVersion = useEternalStore(s => s.appVersion);
  const supported = useMemo(() => instances.filter(i => i.loader === 'fabric' && i.minecraftVersion === '1.21.11'), [instances]);
  const [id, setId] = useState(supported[0]?.id || instances[0]?.id || '');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [config, setConfig] = useState(null);
  const request = useRef(0);

  async function refreshStatus(target = id) {
    const sequence = ++request.current;
    setStatus(null); setConfig(null);
    if (!target) return;
    try {
      const [nextStatus, nextConfig] = await Promise.all([call(api.core.status(target)), call(api.core.config(target))]);
      if (request.current === sequence) { setStatus(nextStatus); setConfig(nextConfig); }
    } catch (e) { if (request.current === sequence) setError(e.message); }
  }

  useEffect(() => { setError(''); refreshStatus(id); }, [id]);
  useEffect(() => {
    if (!instances.length) return setId('');
    if (!instances.some(i => i.id === id)) setId(supported[0]?.id || instances[0].id);
  }, [instances, supported, id]);

  const selected = instances.find(i => i.id === id);
  const isRunning = selected ? running.some(row => row.instanceId === selected.id) : false;

  async function launch() {
    setError(''); setLaunching(true);
    if (!selected) { setLaunching(false); return; }
    try {
      await call(api.instances.launch({ instanceId: selected.id, requireCore: true }));
      await refreshStatus(selected.id);
    } catch (e) { setError(e.message); }
    finally { setLaunching(false); }
  }

  async function exportStandalone() {
    setError(''); setExportMessage(''); setExporting(true);
    try {
      const result = await call(api.core.exportStandalone());
      if (!result?.canceled) setExportMessage(`Standalone Core ${result.version} exported and SHA-256 verified (${shortHash(result.sha256)}).`);
    } catch (e) { setError(e.message); }
    finally { setExporting(false); }
  }

  const statusLabel = !selected
    ? 'Select a Minecraft profile'
    : !status ? 'Checking Core installation...'
    : !status.supported
      ? `Unsupported profile · ${selected.minecraftVersion} ${selected.loader}`
      : status.installed && !status.installedValid
        ? 'Invalid eternal-core.jar detected · launcher will replace it before Core launch'
        : status.exactMatch
          ? `Core ${status.installedVersion || ''} metadata + SHA-256 verified in this profile`
          : status.needsUpdate
            ? `Installed Core differs from staged ${status.stagedVersion || ''} · launcher will repair it before Core launch`
            : status.stagedExists
              ? `Core ${status.stagedVersion || ''} verified and ready to install on launch`
              : 'Core build is not staged in this launcher';

  return <div className="beta7-core-page beta8-core-page v1-core-page">
    <header className="beta7-core-head beta8-core-head">
      <div><span className="beta7-eyebrow">ETERNAL · IN-GAME CLIENT · {appVersion ? `v${appVersion}` : ''}</span><h1>Eternal Core</h1><p>Installation, saved configuration and standalone export.</p></div>
      <div className="beta7-core-actions">
        <select className="instance-select" value={id} onChange={e => setId(e.target.value)}>{!instances.length && <option value="">No Minecraft profiles</option>}{instances.map(i => <option key={i.id} value={i.id}>{i.name} · {i.minecraftVersion} · {i.loader}</option>)}</select>
        <Link className="beta7-export v11-studio-link" to={`/studio?instance=${encodeURIComponent(id)}`}><Palette/>Open Studio</Link>
        <button className="beta7-export" disabled={exporting} onClick={exportStandalone}><Download/>{exporting ? 'Exporting…' : 'Export standalone JAR'}</button>
        <button className="primary beta7-launch" onClick={launch} disabled={!selected || !status?.supported || launching}><Play fill="currentColor"/>{launching ? 'Verifying & starting…' : isRunning ? 'Launch another with Core' : 'Launch with Core'}</button>
      </div>
    </header>

    <motion.section className="beta7-core-hero beta8-core-hero" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }}>
      <div className="beta7-core-brand"><div className="beta7-logo-orbit"><img src={eternalLogo} alt="Eternal Core"/></div><div><div className="beta7-chip"><Gem/> ETERNAL CORE · MINECRAFT 1.21.11 · FABRIC · JAVA 21</div><h2>Core and launcher now feel like one client.</h2><p>Launcher Studio edits the selected instance's real Core config. Minecraft reloads safe settings live, while the standalone JAR continues to work without the launcher process.</p></div></div>
      <div className="beta7-core-status-card"><div className={status?.supported && status?.stagedExists ? 'beta7-status-dot ready' : 'beta7-status-dot'}/><div><small>SELECTED PROFILE</small><b>{selected?.name || 'None selected'}</b><span>{statusLabel}</span></div><ShieldCheck/></div>
    </motion.section>

    {(error || exportMessage) && <div className={error ? 'release-inline-error' : 'beta8-success'}>{error ? error : <><CheckCircle2/>{exportMessage}</>}</div>}

    <section className="beta7-core-grid beta8-core-grid">
      <article className="et-panel">
        <header>SAVED CONFIGURATION <SlidersHorizontal/></header>
        <h2>{selected?.name || 'No instance selected'}</h2>
        <p>{config ? `${Object.values(config.enabled || {}).filter(Boolean).length} modules enabled in this instance.` : 'Select an instance to read its settings.'}</p>
        <p>Module toggles, keybinds, crosshair and appearance are managed in Studio.</p>
        <Link className="secondary" to={`/studio?instance=${encodeURIComponent(id)}`}><Palette/>Configure modules</Link>
      </article>

      <article className="beta7-core-info beta8-core-info"><div className="beta7-info-title"><Boxes/><span><b>Standalone + Studio</b><small>Local config remains the source of truth</small></span></div><div className="beta7-fact"><span>ClickGUI key</span><b>{config ? keyName(config.openKey) : 'Loading...'}</b></div><div className="beta7-fact"><span>HUD Editor key</span><b>{config ? keyName(config.hudEditorKey) : 'Loading...'}</b></div><div className="beta7-fact"><span>Zoom key</span><b>{config ? keyName(config.zoomKey) : 'Loading...'}</b></div><div className="beta7-fact"><span>Perspective key</span><b>{config ? keyName(config.perspectiveKey) : 'Loading...'}</b></div><div className="beta7-fact"><span>Settings file</span><b>config/eternal-core.json</b></div><div className="beta7-fact"><span>Installed SHA</span><b title={status?.installedHash || ''}>{shortHash(status?.installedHash)}</b></div><div className="beta7-fact"><span>Staged SHA</span><b title={status?.stagedHash || ''}>{shortHash(status?.stagedHash)}</b></div><div className="beta7-info-note"><Palette/>Accent, HUD opacity, crosshair, zoom, behavior modules, layout presets and keybinds persist inside Core and can be changed from Studio.</div></article>
    </section>

    <section className="beta7-module-section beta8-module-section"><div className="beta7-section-head"><div><span>MODULE CATALOG</span><h2>Core modules</h2></div><div><SlidersHorizontal/> Live local settings</div></div><div className="beta7-module-grid">{modules.map(([name, Icon, description], index) => <motion.article key={name} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, delay: index * .012 }}><Icon/><div><b>{name}</b><span>{description}</span></div><i>{config ? config.enabled?.[name] ? 'Enabled' : 'Disabled' : 'Not loaded'}</i></motion.article>)}</div></section>

    <section className="et-panel"><header>HUD EDITOR <Keyboard/></header><p>Move and resize your HUD in Minecraft. {config ? `Your editor key is ${keyName(config.hudEditorKey)}.` : ''}</p><Link className="secondary" to={`/studio?instance=${encodeURIComponent(id)}`}>HUD settings <ChevronRight/></Link></section>
  </div>;
}
