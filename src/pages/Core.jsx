import { useEffect, useMemo, useState } from 'react';
import { Activity, Crosshair, Gauge, Gem, Keyboard, MapPin, MemoryStick, MousePointer2, Play, Timer, Waypoints } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';

const modules = [
  ['FPS', Gauge, 'Live Minecraft client FPS'],
  ['CPS', MousePointer2, 'Actual left/right click activity'],
  ['Keystrokes', Keyboard, 'Current movement input'],
  ['Coordinates', MapPin, 'Live player XYZ'],
  ['Ping', Activity, 'Current player-list latency'],
  ['Zoom', Crosshair, 'Hold C; restores previous FOV'],
  ['Direction', Waypoints, 'Live player direction'],
  ['Memory', MemoryStick, 'Current JVM heap usage'],
  ['Session', Timer, 'Elapsed Eternal Core runtime']
];

export default function Core() {
  const instances = useEternalStore(s => s.instances);
  const running = useEternalStore(s => s.running);
  const supported = useMemo(() => instances.filter(i => i.loader === 'fabric' && i.minecraftVersion === '1.21.11'), [instances]);
  const [id, setId] = useState(supported[0]?.id || instances[0]?.id || '');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return setStatus(null);
    call(api.core.status(id)).then(setStatus).catch(e => setError(e.message));
  }, [id]);

  const selected = instances.find(i => i.id === id);
  const isRunning = selected ? running.some(row => row.instanceId === selected.id) : false;

  async function launch() {
    setError('');
    if (!selected) return;
    try { await call(api.instances.launch({ instanceId: selected.id })); }
    catch (e) { setError(e.message); }
  }

  return <div className="beta6-core-page">
    <div className="page-head beta6-core-head">
      <div><small>IN-GAME CLIENT</small><h1>Eternal Core</h1><p>Same Eternal visual language, actually rendered inside Minecraft.</p></div>
      <div className="head-actions">
        <select className="instance-select" value={id} onChange={e => setId(e.target.value)}>
          {!instances.length && <option value="">No profiles</option>}
          {instances.map(i => <option key={i.id} value={i.id}>{i.name} · {i.minecraftVersion} · {i.loader}</option>)}
        </select>
        <button className="primary" onClick={launch} disabled={!selected || !status?.supported}><Play />{isRunning ? 'Launch another' : 'Launch Core'}</button>
      </div>
    </div>

    <section className="core-hero beta6-core-hero">
      <img src="/assets/logo.svg" alt="Eternal Core"/>
      <div>
        <div className="eyebrow"><Gem/>ETERNAL CORE · MINECRAFT 1.21.11 · FABRIC</div>
        <h2>Customize your game.</h2>
        <p>Right Shift opens ClickGUI. H opens the draggable HUD editor. Hold C for zoom. Eternal verifies the actual Core JAR before copying it into the selected isolated instance.</p>
        <div className="core-status">
          {status?.supported
            ? <span className={status.installed ? 'ok' : 'warn'}>{status.installed ? 'Core installed in this instance' : status.stagedExists ? 'Verified Core ready for next launch' : 'Core JAR has not been staged yet'}</span>
            : <span className="warn">{status?.target || 'Select a supported Fabric 1.21.11 profile'}</span>}
        </div>
        {error && <div className="release-inline-error">{error}</div>}
      </div>
    </section>

    <section className="beta6-core-layout">
      <div className="beta6-ingame-window">
        <header><div><img src="/assets/logo.svg" alt=""/><b>ETERNAL</b><span>IN-GAME</span></div><small>RIGHT SHIFT</small></header>
        <div className="beta6-ingame-body">
          <aside>
            <button className="active">HUD</button>
            <button>PLAYER</button>
            <button>RENDER</button>
            <button>WORLD</button>
            <button>MISC</button>
          </aside>
          <main>
            <div className="beta6-ingame-row"><span>FPS HUD</span><i>ON</i></div>
            <div className="beta6-ingame-row"><span>CPS HUD</span><i>ON</i></div>
            <div className="beta6-ingame-row"><span>Keystrokes</span><i>ON</i></div>
            <div className="beta6-ingame-row"><span>Coordinates</span><i>ON</i></div>
            <div className="beta6-ingame-row"><span>Ping</span><i>ON</i></div>
            <div className="beta6-ingame-row"><span>Zoom</span><i>HOLD C</i></div>
          </main>
        </div>
        <footer>UI preview of implemented Eternal Core modules — actual interaction happens inside Minecraft.</footer>
      </div>

      <div className="module-grid beta6-module-grid">
        {modules.map(([name, Icon, description]) => <article key={name}><Icon/><div><b>{name}</b><span>{description}</span></div><i>REAL</i></article>)}
      </div>
    </section>

    <div className="hud-preview beta6-hud-preview">
      <div className="hud-title"><span>HUD EDITOR PREVIEW</span><b>Press H in-game · persistent positions</b></div>
      <div className="mc-world">
        <div className="fake-crosshair">+</div>
        <div className="hud-chip fps">FPS <b>LIVE</b></div>
        <div className="hud-chip coords">XYZ <b>LIVE</b></div>
        <div className="keys"><i>W</i><i>A</i><i>S</i><i>D</i></div>
        <div className="preview-label">PREVIEW ONLY — Eternal Core renders real values in Minecraft</div>
      </div>
    </div>
  </div>;
}
