import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Aperture, Boxes, CheckCircle2, Clock3, Crosshair, Download, Eye, Gauge, Gem, Heart, Keyboard, MapPin,
  MemoryStick, MousePointer2, Palette, Play, Server, Shield, ShieldCheck, SlidersHorizontal,
  Sparkles, Sun, Timer, Waypoints, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';
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

const previewSections = {
  HUD: ['WATERMARK', 'FPS', 'CPS', 'KEYSTROKES', 'COORDINATES', 'PING', 'SPEED', 'DIRECTION', 'HEALTH', 'ARMOR', 'FOOD', 'SERVER', 'MEMORY', 'SESSION', 'CLOCK'],
  CLIENT: ['ZOOM · SMOOTH FOV', 'FULLBRIGHT · RESTORES GAMMA', 'TOGGLE SPRINT', 'TOGGLE SNEAK', 'PERSPECTIVE · REBINDABLE'],
  VISUAL: ['CUSTOM CROSSHAIR', 'TARGET COLOR', 'GAP / LENGTH / THICKNESS', 'CENTER DOT + OUTLINE', 'SMOOTH ZOOM SPEED'],
  STYLE: ['ACCENT · 5 PRESETS + STUDIO COLOR', 'HUD OPACITY · 31–96%', 'SNAP GRID · 2/4/8 PX', 'TEXT SHADOW', 'LIVING ACCENT', 'HUD LAYOUT PRESETS'],
  ABOUT: ['STANDALONE FABRIC MOD', 'LIVE CONFIG RELOAD', 'ATOMIC CONFIG SAVE', 'MINECRAFT · 1.21.11', 'JAVA · 21+', 'NO LAUNCHER PROCESS REQUIRED']
};

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
    : !status?.supported
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
      <div><span className="beta7-eyebrow">ETERNAL · IN-GAME CLIENT · v{appVersion || '1.0.1'}</span><h1>Eternal Core</h1><p>The verified Core plus the new v1.1 customization layer.</p></div>
      <div className="beta7-core-actions">
        <select className="instance-select" value={id} onChange={e => setId(e.target.value)}>{!instances.length && <option value="">No Minecraft profiles</option>}{instances.map(i => <option key={i.id} value={i.id}>{i.name} · {i.minecraftVersion} · {i.loader}</option>)}</select>
        <Link className="beta7-export v11-studio-link" to="/studio"><Palette/>Open Studio</Link>
        <button className="beta7-export" disabled={exporting} onClick={exportStandalone}><Download/>{exporting ? 'Exporting…' : 'Export standalone JAR'}</button>
        <button className="primary beta7-launch" onClick={launch} disabled={!selected || !status?.supported || launching}><Play fill="currentColor"/>{launching ? 'Verifying & starting…' : isRunning ? 'Launch another with Core' : 'Launch with Core'}</button>
      </div>
    </header>

    <motion.section className="beta7-core-hero beta8-core-hero" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }}>
      <div className="beta7-core-brand"><div className="beta7-logo-orbit"><img src={eternalLogo} alt="Eternal Core"/></div><div><div className="beta7-chip"><Gem/> V1.1 CUSTOMIZATION · MINECRAFT 1.21.11 · FABRIC · JAVA 21</div><h2>Core and launcher now feel like one client.</h2><p>Launcher Studio edits the selected instance's real Core config. Minecraft reloads safe settings live, while the standalone JAR continues to work without the launcher process.</p></div></div>
      <div className="beta7-core-status-card"><div className={status?.supported && status?.stagedExists ? 'beta7-status-dot ready' : 'beta7-status-dot'}/><div><small>SELECTED PROFILE</small><b>{selected?.name || 'None selected'}</b><span>{statusLabel}</span></div><ShieldCheck/></div>
    </motion.section>

    {(error || exportMessage) && <div className={error ? 'release-inline-error' : 'beta8-success'}>{error ? error : <><CheckCircle2/>{exportMessage}</>}</div>}

    <section className="beta7-core-grid beta8-core-grid">
      <article className="beta7-ingame-card beta8-ingame-card">
        <div className="beta7-windowbar"><div><img src={eternalLogo} alt=""/><b>ETERNAL</b><span>CORE · CLICKGUI 2.0</span></div><small>DEFAULT: RIGHT SHIFT · REBINDABLE</small></div>
        <div className="beta7-clickgui-preview beta8-clickgui-preview">
          <aside>{Object.keys(previewSections).map(section => <button key={section} className={preview === section ? 'active' : ''} onClick={() => setPreview(section)}>{section}</button>)}<span>LIVE CONFIG<br/><b>ETERNAL STUDIO</b></span></aside>
          <main>
            <div className="beta7-preview-title"><span><b>{preview === 'HUD' ? 'HUD MODULES' : preview}</b><small>{preview === 'HUD' ? 'Live modules rendered directly in Minecraft' : preview === 'CLIENT' ? 'Real local gameplay helpers' : preview === 'VISUAL' ? 'Crosshair and smooth zoom controls' : preview === 'STYLE' ? 'Persistent visual customization' : 'Runtime and standalone information'}</small></span><i>V1.1 CORE MAP</i></div>
            <div className="beta7-preview-modules beta8-preview-modules">{previewSections[preview].map(name => <div key={name} className="enabled"><span>{name}<small>{preview === 'HUD' ? modules.find(item => item[0].toUpperCase() === name)?.[2] || 'Implemented in Core' : 'Implemented in Eternal Core v1.1'}</small></span><i>REAL</i></div>)}</div>
          </main>
        </div>
        <footer>ClickGUI 2.0 and launcher Studio both write the same local configuration. You can tune modules in Minecraft or from the launcher without inventing a second state system.</footer>
      </article>

      <article className="beta7-core-info beta8-core-info"><div className="beta7-info-title"><Boxes/><span><b>Standalone + Studio</b><small>Local config remains the source of truth</small></span></div><div className="beta7-fact"><span>ClickGUI default</span><b>Right Shift · rebindable</b></div><div className="beta7-fact"><span>HUD Editor default</span><b>H · rebindable</b></div><div className="beta7-fact"><span>Zoom default</span><b>C · rebindable</b></div><div className="beta7-fact"><span>Perspective default</span><b>V · rebindable</b></div><div className="beta7-fact"><span>Settings file</span><b>config/eternal-core.json</b></div><div className="beta7-fact"><span>Installed SHA</span><b title={status?.installedHash || ''}>{shortHash(status?.installedHash)}</b></div><div className="beta7-fact"><span>Staged SHA</span><b title={status?.stagedHash || ''}>{shortHash(status?.stagedHash)}</b></div><div className="beta7-info-note"><Palette/>Accent, HUD opacity, crosshair, zoom, behavior modules, layout presets and keybinds persist inside Core and can be changed from Studio.</div></article>
    </section>

    <section className="beta7-module-section beta8-module-section"><div className="beta7-section-head"><div><span>V1.1 IMPLEMENTED</span><h2>Real Core modules</h2></div><div><SlidersHorizontal/> Live local settings</div></div><div className="beta7-module-grid">{modules.map(([name, Icon, description], index) => <motion.article key={name} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, delay: index * .012 }}><Icon/><div><b>{name}</b><span>{description}</span></div><i>REAL</i></motion.article>)}</div></section>

    <section className="beta7-hud-editor-preview beta8-hud-editor-preview"><div className="beta7-section-head"><div><span>IN MINECRAFT</span><h2>HUD Editor</h2></div><div><Keyboard/> Drag · snap · save · nudge · disable</div></div><div className="beta7-hud-canvas"><div className="beta7-grid-lines"/><span className="beta7-hud-node one">ETERNAL <b>V1.1</b></span><span className="beta7-hud-node two">FPS <b>LIVE</b></span><span className="beta7-hud-node three">HP <b>LIVE</b></span><span className="beta7-hud-node four">PING <b>LIVE</b></span><div className="beta7-key-cluster"><i>W</i><i>A</i><i>S</i><i>D</i></div><div className="beta7-canvas-crosshair">+</div><small>Open the real HUD editor in Minecraft to move modules. Launcher Studio controls the same style/config layer and supports local profile snapshots.</small></div></section>
  </div>;
}
