import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Boxes, CheckCircle2, Clock3, Crosshair, Download, Gauge, Gem, Keyboard, MapPin,
  MemoryStick, MousePointer2, Palette, Play, ShieldCheck, SlidersHorizontal,
  Sparkles, Timer, Waypoints
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
import eternalLogo from '../../assets/logo.svg';

const modules = [
  ['Watermark', Sparkles, 'Eternal identity chip rendered in-game'],
  ['FPS', Gauge, 'Live Minecraft client FPS'],
  ['CPS', MousePointer2, 'Actual left/right click activity'],
  ['Keystrokes', Keyboard, 'Current WASD input state'],
  ['Coordinates', MapPin, 'Live player XYZ'],
  ['Ping', Activity, 'Current server latency'],
  ['Speed', Gauge, 'Horizontal movement speed'],
  ['Direction', Waypoints, 'Live player direction'],
  ['Memory', MemoryStick, 'Current JVM heap usage'],
  ['Session', Timer, 'Elapsed Core session time'],
  ['Clock', Clock3, 'Local 24-hour clock'],
  ['Zoom', Crosshair, 'Configurable hold-C FOV zoom']
];

const previewSections = {
  HUD: ['WATERMARK', 'FPS', 'CPS', 'KEYSTROKES', 'COORDINATES', 'PING', 'SPEED', 'DIRECTION', 'MEMORY', 'SESSION', 'CLOCK'],
  UTILITY: ['ZOOM · HOLD C', 'ZOOM FOV · 10–60', 'NOTIFICATIONS · ON/OFF', 'RIGHT SHIFT · CLICKGUI', 'H · HUD EDITOR'],
  STYLE: ['ACCENT · 5 PRESETS', 'HUD OPACITY · 31–96%', 'SNAP GRID · 2/4/8 PX', 'DEFAULT LAYOUT', 'COMPACT LAYOUT', 'CORNERS LAYOUT'],
  ABOUT: ['STANDALONE FABRIC MOD', 'CONFIG · eternal-core.json', 'MINECRAFT · 1.21.11', 'JAVA · 21+', 'NO LAUNCHER PROCESS REQUIRED']
};

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
  const [preview, setPreview] = useState('HUD');

  async function refreshStatus(target = id) {
    if (!target) return setStatus(null);
    try { setStatus(await call(api.core.status(target))); }
    catch (e) { setError(e.message); }
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
    try { await call(api.instances.launch({ instanceId: selected.id })); await refreshStatus(selected.id); }
    catch (e) { setError(e.message); }
    finally { setLaunching(false); }
  }

  async function exportStandalone() {
    setError(''); setExportMessage(''); setExporting(true);
    try {
      const result = await call(api.core.exportStandalone());
      if (!result?.canceled) setExportMessage(`Standalone Core ${result.version} exported to ${result.path}`);
    } catch (e) { setError(e.message); }
    finally { setExporting(false); }
  }

  const statusLabel = !selected
    ? 'Select a Minecraft profile'
    : !status?.supported
      ? `Unsupported profile · ${selected.minecraftVersion} ${selected.loader}`
      : status.installed && !status.installedValid
        ? 'An invalid eternal-core.jar exists in this profile and will be replaced on launch'
        : status.needsUpdate
          ? `Core ${status.installedVersion} installed · ${status.stagedVersion} ready to update on launch`
          : status.installedValid
            ? `Core ${status.installedVersion || ''} verified in this profile`
            : status.stagedExists
              ? `Core ${status.stagedVersion || ''} verified and ready for launch`
              : 'Core build is not staged in this launcher';

  return <div className="beta7-core-page beta8-core-page">
    <header className="beta7-core-head beta8-core-head">
      <div><span className="beta7-eyebrow">ETERNAL · IN-GAME CLIENT · v{appVersion || '0.8.0-beta.8'}</span><h1>Eternal Core</h1><p>The same real Core runs launcher-managed or as a standalone Fabric mod.</p></div>
      <div className="beta7-core-actions"><select className="instance-select" value={id} onChange={e => setId(e.target.value)}>{!instances.length && <option value="">No Minecraft profiles</option>}{instances.map(i => <option key={i.id} value={i.id}>{i.name} · {i.minecraftVersion} · {i.loader}</option>)}</select><button className="beta7-export" disabled={exporting} onClick={exportStandalone}><Download/>{exporting ? 'Exporting…' : 'Export standalone JAR'}</button><button className="primary beta7-launch" onClick={launch} disabled={!selected || !status?.supported || launching}><Play fill="currentColor"/>{launching ? 'Starting…' : isRunning ? 'Launch another' : 'Launch with Core'}</button></div>
    </header>

    <motion.section className="beta7-core-hero beta8-core-hero" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }}>
      <div className="beta7-core-brand"><div className="beta7-logo-orbit"><img src={eternalLogo} alt="Eternal Core"/></div><div><div className="beta7-chip"><Gem/> MINECRAFT 1.21.11 · FABRIC · JAVA 21</div><h2>Same client. Two ways to run it.</h2><p>Use Eternal Client and Core is verified/copy-managed for your profile, or export the exact same JAR into any compatible Fabric <code>mods</code> folder. Standalone Core does not require the launcher process.</p></div></div>
      <div className="beta7-core-status-card"><div className={status?.supported && status?.stagedExists ? 'beta7-status-dot ready' : 'beta7-status-dot'}/><div><small>SELECTED PROFILE</small><b>{selected?.name || 'None selected'}</b><span>{statusLabel}</span></div><ShieldCheck/></div>
    </motion.section>

    {(error || exportMessage) && <div className={error ? 'release-inline-error' : 'beta8-success'}>{error ? error : <><CheckCircle2/>{exportMessage}</>}</div>}

    <section className="beta7-core-grid beta8-core-grid">
      <article className="beta7-ingame-card beta8-ingame-card">
        <div className="beta7-windowbar"><div><img src={eternalLogo} alt=""/><b>ETERNAL</b><span>CORE</span></div><small>RIGHT SHIFT</small></div>
        <div className="beta7-clickgui-preview beta8-clickgui-preview">
          <aside>{Object.keys(previewSections).map(section => <button key={section} className={preview === section ? 'active' : ''} onClick={() => setPreview(section)}>{section}</button>)}<span>RIGHT SHIFT<br/><b>OPEN CORE</b></span></aside>
          <main>
            <div className="beta7-preview-title"><span><b>{preview === 'HUD' ? 'HUD MODULES' : preview}</b><small>{preview === 'HUD' ? 'Live modules rendered directly in Minecraft' : preview === 'UTILITY' ? 'Real client-side helpers and keybinds' : preview === 'STYLE' ? 'Persistent visual customization' : 'Runtime and standalone information'}</small></span><i>LIVE MAP</i></div>
            <div className="beta7-preview-modules beta8-preview-modules">{previewSections[preview].map((name, index) => <div key={name} className="enabled"><span>{name}<small>{preview === 'HUD' ? modules.find(item => item[0].toUpperCase() === name)?.[2] || 'Implemented in Core' : 'Implemented in Beta 8 Core'}</small></span><i>{preview === 'HUD' ? 'ON' : 'REAL'}</i></div>)}</div>
          </main>
        </div>
        <footer>These tabs now describe the exact implemented Core sections. Actual module toggles and settings are changed inside Minecraft.</footer>
      </article>

      <article className="beta7-core-info beta8-core-info"><div className="beta7-info-title"><Boxes/><span><b>Standalone-ready</b><small>No launcher dependency at runtime</small></span></div><div className="beta7-fact"><span>Open ClickGUI</span><b>Right Shift</b></div><div className="beta7-fact"><span>HUD Editor</span><b>H</b></div><div className="beta7-fact"><span>Zoom</span><b>Hold C</b></div><div className="beta7-fact"><span>Settings file</span><b>config/eternal-core.json</b></div><div className="beta7-fact"><span>Installed version</span><b>{status?.installedVersion || 'Not installed'}</b></div><div className="beta7-fact"><span>Staged version</span><b>{status?.stagedVersion || 'Not staged'}</b></div><div className="beta7-info-note"><Palette/>Accent, HUD opacity, zoom FOV, snap grid and layout presets persist inside Core.</div></article>
    </section>

    <section className="beta7-module-section beta8-module-section"><div className="beta7-section-head"><div><span>IMPLEMENTED NOW</span><h2>Real Core modules</h2></div><div><SlidersHorizontal/> Persistent settings</div></div><div className="beta7-module-grid">{modules.map(([name, Icon, description], index) => <motion.article key={name} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, delay: index * .018 }}><Icon/><div><b>{name}</b><span>{description}</span></div><i>REAL</i></motion.article>)}</div></section>

    <section className="beta7-hud-editor-preview beta8-hud-editor-preview"><div className="beta7-section-head"><div><span>IN MINECRAFT</span><h2>HUD Editor</h2></div><div><Keyboard/> Drag · snap · save · nudge</div></div><div className="beta7-hud-canvas"><div className="beta7-grid-lines"/><span className="beta7-hud-node one">ETERNAL <b>BETA 8</b></span><span className="beta7-hud-node two">FPS <b>LIVE</b></span><span className="beta7-hud-node three">XYZ <b>LIVE</b></span><span className="beta7-hud-node four">PING <b>LIVE</b></span><div className="beta7-key-cluster"><i>W</i><i>A</i><i>S</i><i>D</i></div><div className="beta7-canvas-crosshair">+</div><small>Visual preview only · press H inside Minecraft to edit the real persistent HUD.</small></div></section>
  </div>;
}
