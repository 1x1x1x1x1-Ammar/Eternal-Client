import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Boxes, Clock3, Crosshair, Download, Gauge, Gem, Keyboard, MapPin,
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

export default function Core() {
  const instances = useEternalStore(s => s.instances);
  const running = useEternalStore(s => s.running);
  const supported = useMemo(() => instances.filter(i => i.loader === 'fabric' && i.minecraftVersion === '1.21.11'), [instances]);
  const [id, setId] = useState(supported[0]?.id || instances[0]?.id || '');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    if (!id) {
      setStatus(null);
      return;
    }
    setError('');
    call(api.core.status(id)).then(setStatus).catch(e => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!instances.length) return setId('');
    if (!instances.some(i => i.id === id)) setId(supported[0]?.id || instances[0].id);
  }, [instances, supported, id]);

  const selected = instances.find(i => i.id === id);
  const isRunning = selected ? running.some(row => row.instanceId === selected.id) : false;

  async function launch() {
    setError('');
    if (!selected) return;
    try {
      await call(api.instances.launch({ instanceId: selected.id }));
      const next = await call(api.core.status(selected.id));
      setStatus(next);
    } catch (e) {
      setError(e.message);
    }
  }

  async function exportStandalone() {
    setError('');
    setExportMessage('');
    try {
      const result = await call(api.core.exportStandalone());
      if (!result?.canceled) setExportMessage(`Standalone Core exported: ${result.path}`);
    } catch (e) {
      setError(e.message);
    }
  }

  const statusLabel = !selected
    ? 'Select a Minecraft profile'
    : !status?.supported
      ? `Unsupported profile · ${selected.minecraftVersion} ${selected.loader}`
      : status.installed
        ? `Core ${status.version || ''} installed in this profile`
        : status.stagedExists
          ? `Core ${status.version || ''} verified and ready for launch`
          : 'Core build is not staged in this launcher';

  return <div className="beta7-core-page">
    <header className="beta7-core-head">
      <div>
        <span className="beta7-eyebrow">ETERNAL · IN-GAME CLIENT · v0.7.0-beta.7</span>
        <h1>Eternal Core</h1>
        <p>The same real Core runs launcher-managed or as a standalone Fabric mod.</p>
      </div>
      <div className="beta7-core-actions">
        <select className="instance-select" value={id} onChange={e => setId(e.target.value)}>
          {!instances.length && <option value="">No Minecraft profiles</option>}
          {instances.map(i => <option key={i.id} value={i.id}>{i.name} · {i.minecraftVersion} · {i.loader}</option>)}
        </select>
        <button className="beta7-export" onClick={exportStandalone}><Download />Export standalone JAR</button>
        <button className="primary beta7-launch" onClick={launch} disabled={!selected || !status?.supported}>
          <Play fill="currentColor" />{isRunning ? 'Launch another' : 'Launch with Core'}
        </button>
      </div>
    </header>

    <motion.section className="beta7-core-hero" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }}>
      <div className="beta7-core-brand">
        <div className="beta7-logo-orbit"><img src={eternalLogo} alt="Eternal Core" /></div>
        <div>
          <div className="beta7-chip"><Gem /> MINECRAFT 1.21.11 · FABRIC · JAVA 21</div>
          <h2>Same client. Two ways to run it.</h2>
          <p>Use Eternal Client and Core is verified/copy-managed for your profile, or export the exact same JAR and put it into any compatible Fabric <code>mods</code> folder. The standalone JAR does not require the Eternal launcher process.</p>
        </div>
      </div>
      <div className="beta7-core-status-card">
        <div className={status?.supported ? 'beta7-status-dot ready' : 'beta7-status-dot'} />
        <div><small>SELECTED PROFILE</small><b>{selected?.name || 'None selected'}</b><span>{statusLabel}</span></div>
        <ShieldCheck />
      </div>
    </motion.section>

    {(error || exportMessage) && <div className={error ? 'release-inline-error' : 'beta7-success'}>{error || exportMessage}</div>}

    <section className="beta7-core-grid">
      <article className="beta7-ingame-card">
        <div className="beta7-windowbar">
          <div><img src={eternalLogo} alt="" /><b>ETERNAL</b><span>CORE</span></div>
          <small>RIGHT SHIFT</small>
        </div>
        <div className="beta7-clickgui-preview">
          <aside>
            <button className="active">HUD</button>
            <button>UTILITY</button>
            <button>STYLE</button>
            <button>ABOUT</button>
            <span>RIGHT SHIFT<br/><b>OPEN CORE</b></span>
          </aside>
          <main>
            <div className="beta7-preview-title"><span><b>HUD MODULES</b><small>Live modules rendered directly in Minecraft</small></span><i>CORE UI</i></div>
            <div className="beta7-preview-modules">
              {['WATERMARK', 'FPS', 'CPS', 'KEYSTROKES', 'COORDINATES', 'PING', 'SPEED', 'DIRECTION'].map((name, index) => <div key={name} className={index < 6 ? 'enabled' : ''}><span>{name}<small>{index < 6 ? 'Enabled' : 'Available'}</small></span><i>{index < 6 ? 'ON' : 'OFF'}</i></div>)}
            </div>
          </main>
        </div>
        <footer>Preview mirrors the Beta 7 Core layout. Module interaction itself happens inside Minecraft.</footer>
      </article>

      <article className="beta7-core-info">
        <div className="beta7-info-title"><Boxes /><span><b>Standalone-ready</b><small>No launcher dependency at runtime</small></span></div>
        <div className="beta7-fact"><span>Open ClickGUI</span><b>Right Shift</b></div>
        <div className="beta7-fact"><span>HUD Editor</span><b>H</b></div>
        <div className="beta7-fact"><span>Zoom</span><b>Hold C</b></div>
        <div className="beta7-fact"><span>Settings file</span><b>config/eternal-core.json</b></div>
        <div className="beta7-fact"><span>Launcher install mode</span><b>Verified per instance</b></div>
        <div className="beta7-fact"><span>Standalone install mode</span><b>Fabric mods folder</b></div>
        <div className="beta7-info-note"><Palette /> Accent, HUD opacity, zoom FOV, snap grid and layout presets are persistent inside Core.</div>
      </article>
    </section>

    <section className="beta7-module-section">
      <div className="beta7-section-head"><div><span>IMPLEMENTED NOW</span><h2>Real Core modules</h2></div><div><SlidersHorizontal /> Persistent settings</div></div>
      <div className="beta7-module-grid">
        {modules.map(([name, Icon, description], index) => <motion.article key={name} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, delay: index * .018 }}>
          <Icon /><div><b>{name}</b><span>{description}</span></div><i>REAL</i>
        </motion.article>)}
      </div>
    </section>

    <section className="beta7-hud-editor-preview">
      <div className="beta7-section-head"><div><span>IN MINECRAFT</span><h2>HUD Editor</h2></div><div><Keyboard /> Drag · snap · save</div></div>
      <div className="beta7-hud-canvas">
        <div className="beta7-grid-lines" />
        <span className="beta7-hud-node one">ETERNAL <b>BETA 7</b></span>
        <span className="beta7-hud-node two">FPS <b>LIVE</b></span>
        <span className="beta7-hud-node three">XYZ <b>LIVE</b></span>
        <span className="beta7-hud-node four">PING <b>LIVE</b></span>
        <div className="beta7-key-cluster"><i>W</i><i>A</i><i>S</i><i>D</i></div>
        <div className="beta7-canvas-crosshair">+</div>
        <small>Visual preview only · press H inside Minecraft to move the real HUD modules.</small>
      </div>
    </section>
  </div>;
}
