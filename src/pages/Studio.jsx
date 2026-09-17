import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Aperture, Check, ChevronRight, Crosshair, Eye, FolderOpen, Gauge, Image, Keyboard,
  LayoutDashboard, MousePointer2, Palette, RefreshCw, Save, Search, Shield, Sparkles,
  Sun, Trash2, Zap
} from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { api, call } from '../lib/api.js';

const moduleCatalog = [
  ['Watermark', 'HUD', Sparkles, 'Eternal identity chip'],
  ['FPS', 'HUD', Gauge, 'Live frame rate'],
  ['CPS', 'HUD', MousePointer2, 'Left and right clicks per second'],
  ['Keystrokes', 'HUD', Keyboard, 'Live WASD and mouse input'],
  ['Coordinates', 'HUD', LayoutDashboard, 'Current player coordinates'],
  ['Ping', 'HUD', Zap, 'Server latency'],
  ['Speed', 'HUD', Gauge, 'Horizontal movement speed'],
  ['Direction', 'HUD', Eye, 'Current facing direction'],
  ['Health', 'HUD', Shield, 'Health status'],
  ['Armor', 'HUD', Shield, 'Armor points'],
  ['Food', 'HUD', Shield, 'Hunger level'],
  ['Server', 'HUD', LayoutDashboard, 'Current server or local world'],
  ['Memory', 'HUD', Gauge, 'JVM memory usage'],
  ['Session', 'HUD', Gauge, 'Session timer'],
  ['Clock', 'HUD', Gauge, 'Local time'],
  ['Zoom', 'UTILITY', Eye, 'Smooth configurable FOV zoom'],
  ['Crosshair', 'VISUAL', Crosshair, 'Custom crosshair renderer'],
  ['Fullbright', 'VISUAL', Sun, 'Maximum Minecraft brightness'],
  ['ToggleSprint', 'MOVEMENT', Zap, 'Use Minecraft toggle sprint'],
  ['ToggleSneak', 'MOVEMENT', Zap, 'Use Minecraft toggle sneak'],
  ['Perspective', 'VISUAL', Aperture, 'Cycle camera perspective']
];

const tabs = [
  ['MODULES', LayoutDashboard],
  ['APPEARANCE', Palette],
  ['CROSSHAIR', Crosshair],
  ['PROFILES', Save],
  ['MEDIA', Image]
];

function toHex(value) {
  const rgb = (Number(value) >>> 0) & 0xFFFFFF;
  return `#${rgb.toString(16).padStart(6, '0')}`;
}
function fromHex(value) {
  return (0xFF000000 | parseInt(String(value).replace('#', ''), 16)) | 0;
}
function sizeLabel(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
function dateLabel(value) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleString();
}

function Switch({ value, onChange, label }) {
  return <button type="button" className={value ? 'v11-switch on' : 'v11-switch'} aria-pressed={value} aria-label={label} onClick={() => onChange(!value)}>
    <span />
  </button>;
}

function RangeSetting({ title, description, min, max, step = 1, value, suffix = '', onChange }) {
  return <div className="v11-setting-row">
    <div><b>{title}</b><span>{description}</span></div>
    <div className="v11-range-wrap">
      <strong>{value}{suffix}</strong>
      <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
    </div>
  </div>;
}

export default function Studio() {
  const instances = useEternalStore(state => state.instances);
  const running = useEternalStore(state => state.running);
  const compatible = useMemo(() => instances.filter(item => item.loader === 'fabric' && item.minecraftVersion === '1.21.11'), [instances]);
  const [instanceId, setInstanceId] = useState(compatible[0]?.id || instances[0]?.id || '');
  const [tab, setTab] = useState('MODULES');
  const [config, setConfig] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [status, setStatus] = useState(null);
  const [query, setQuery] = useState('');
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = instances.find(item => item.id === instanceId);
  const isRunning = Boolean(selected && running.some(row => row.instanceId === selected.id));

  useEffect(() => {
    if (!instances.length) return setInstanceId('');
    if (!instances.some(item => item.id === instanceId)) setInstanceId(compatible[0]?.id || instances[0].id);
  }, [instances, compatible, instanceId]);

  async function loadStudio(id = instanceId) {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [nextConfig, nextProfiles, nextScreenshots, nextStatus] = await Promise.all([
        call(api.core.config(id)),
        call(api.core.profiles(id)),
        call(api.core.screenshots(id)),
        call(api.core.status(id))
      ]);
      setConfig(nextConfig);
      setProfiles(nextProfiles);
      setScreenshots(nextScreenshots);
      setStatus(nextStatus);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudio(instanceId); }, [instanceId]);

  async function patch(patchValue, successMessage = '') {
    if (!instanceId || !config) return;
    setSaving(true);
    setError('');
    try {
      const next = await call(api.core.patchConfig({ instanceId, patch: patchValue }));
      setConfig(next);
      if (successMessage) setNotice(successMessage);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function createProfile() {
    if (!profileName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await call(api.core.saveProfile({ instanceId, name: profileName }));
      setProfiles(await call(api.core.profiles(instanceId)));
      setProfileName('');
      setNotice('Profile saved from the current live Core configuration.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function applyProfile(profileId, name) {
    setSaving(true);
    setError('');
    try {
      setConfig(await call(api.core.applyProfile({ instanceId, profileId })));
      setNotice(`${name} applied${isRunning ? ' · Minecraft will pick it up live' : ''}.`);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function removeProfile(profileId) {
    setSaving(true);
    setError('');
    try {
      await call(api.core.deleteProfile({ instanceId, profileId }));
      setProfiles(await call(api.core.profiles(instanceId)));
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function removeScreenshot(filename) {
    setError('');
    try {
      await call(api.core.deleteScreenshot({ instanceId, filename }));
      setScreenshots(await call(api.core.screenshots(instanceId)));
    } catch (e) { setError(e.message); }
  }

  const filteredModules = moduleCatalog.filter(([name, category, , description]) => {
    const needle = query.trim().toLowerCase();
    return !needle || `${name} ${category} ${description}`.toLowerCase().includes(needle);
  });

  const activeCount = config ? Object.values(config.enabled || {}).filter(Boolean).length : 0;
  const crosshair = config?.crosshair || {};
  const accent = config ? toHex(config.accentColor) : '#ff3038';

  return <div className="v11-studio">
    <motion.header className="v11-studio-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="v11-hero-copy">
        <span className="v11-kicker"><Sparkles /> ETERNAL STUDIO</span>
        <h1>Make the client <em>yours.</em></h1>
        <p>One control surface for real Core modules, HUD styling, crosshair settings, profiles and Minecraft media.</p>
        <div className="v11-live-row">
          <span className={isRunning ? 'v11-live-pill live' : 'v11-live-pill'}><i />{isRunning ? 'MINECRAFT LIVE' : 'MINECRAFT OFFLINE'}</span>
          <span className="v11-live-pill"><Shield />LOCAL CONFIG</span>
          <span className="v11-live-pill"><Zap />{activeCount} ENABLED</span>
        </div>
      </div>
      <div className="v11-instance-panel">
        <span>EDITING PROFILE</span>
        <select value={instanceId} onChange={event => setInstanceId(event.target.value)}>
          {!instances.length && <option value="">No Minecraft instances</option>}
          {instances.map(item => <option key={item.id} value={item.id}>{item.name} · {item.minecraftVersion} · {item.loader}</option>)}
        </select>
        <div className="v11-instance-state">
          <div><b>{selected?.name || 'No instance selected'}</b><span>{selected ? `${selected.minecraftVersion} · ${selected.loader}` : 'Create an instance first'}</span></div>
          <i className={status?.supported ? 'ok' : ''}>{status?.supported ? <Check /> : '!'}</i>
        </div>
        <button className="v11-refresh" disabled={!instanceId || loading} onClick={() => loadStudio()}><RefreshCw className={loading ? 'spin' : ''}/>{loading ? 'Reading Core…' : 'Refresh from disk'}</button>
      </div>
      <div className="v11-hero-glow" />
    </motion.header>

    {(error || notice) && <button className={error ? 'v11-banner error' : 'v11-banner'} onClick={() => { setError(''); setNotice(''); }}>
      <span>{error || notice}</span><b>Dismiss</b>
    </button>}

    <nav className="v11-tabs" aria-label="Eternal Studio sections">
      {tabs.map(([name, Icon]) => <button key={name} className={tab === name ? 'active' : ''} onClick={() => setTab(name)}><Icon />{name}</button>)}
      {saving && <span className="v11-saving"><i />SYNCING</span>}
    </nav>

    {!config && !loading ? <section className="v11-empty"><Sparkles/><h2>Select an instance</h2><p>Eternal Studio writes only to the selected instance's local Core config.</p></section> : null}

    {config && tab === 'MODULES' && <motion.section className="v11-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="v11-panel-head">
        <div><span>CORE MODULES</span><h2>Everything you actually use.</h2><p>Clean installs stay off. Enable only the parts you want.</p></div>
        <label className="v11-search"><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search modules…"/></label>
      </div>
      <div className="v11-module-grid">
        {filteredModules.map(([name, category, Icon, description], index) => {
          const enabled = Boolean(config.enabled?.[name]);
          return <motion.article className={enabled ? 'v11-module-card active' : 'v11-module-card'} key={name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .018, .2) }}>
            <div className="v11-module-icon"><Icon/></div>
            <div className="v11-module-copy"><span>{category}</span><b>{name}</b><p>{description}</p></div>
            <Switch label={`${name} module`} value={enabled} onChange={value => patch({ enabled: { [name]: value } })}/>
          </motion.article>;
        })}
      </div>
    </motion.section>}

    {config && tab === 'APPEARANCE' && <motion.section className="v11-panel v11-appearance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="v11-panel-head"><div><span>HUD 2.0</span><h2>Visual system.</h2><p>Persistent Core settings shared by launcher-managed and standalone play.</p></div></div>
      <div className="v11-appearance-grid">
        <article className="v11-preview-card" style={{ '--studio-accent': accent }}>
          <div className="v11-preview-top"><span>LIVE PREVIEW</span><i>{Math.round(config.hudAlpha / 255 * 100)}% OPACITY</i></div>
          <div className="v11-hud-preview">
            <span className="v11-preview-chip brand"><i/>ETERNAL <b>CORE</b></span>
            <span className="v11-preview-chip one"><i/>FPS <b>240</b></span>
            <span className="v11-preview-chip two"><i/>PING <b>32ms</b></span>
            <div className="v11-preview-keys"><i>W</i><i>A</i><i>S</i><i>D</i></div>
            <div className="v11-preview-gridlines" />
          </div>
        </article>
        <article className="v11-settings-card">
          <div className="v11-color-setting"><div><b>Accent color</b><span>Applied to Core panels, highlights and HUD accents</span></div><label><input type="color" value={accent} onChange={event => patch({ accentColor: fromHex(event.target.value) })}/><strong>{accent.toUpperCase()}</strong></label></div>
          <RangeSetting title="HUD opacity" description="Background opacity for telemetry cards" min={80} max={245} value={config.hudAlpha} suffix="" onChange={value => patch({ hudAlpha: value })}/>
          <RangeSetting title="Snap grid" description="HUD editor placement grid" min={2} max={8} step={2} value={config.snap} suffix="px" onChange={value => patch({ snap: value <= 2 ? 2 : value <= 4 ? 4 : 8 })}/>
          <div className="v11-toggle-setting"><div><b>Text shadow</b><span>Sharper HUD labels over bright worlds</span></div><Switch label="Text shadow" value={config.textShadow} onChange={value => patch({ textShadow: value })}/></div>
          <div className="v11-toggle-setting"><div><b>Living accent</b><span>Subtle animated tonal shift across HUD elements</span></div><Switch label="Living accent" value={config.gradientHud} onChange={value => patch({ gradientHud: value })}/></div>
          <div className="v11-toggle-setting"><div><b>Notifications</b><span>Core state and keybind feedback in Minecraft</span></div><Switch label="Notifications" value={config.notifications} onChange={value => patch({ notifications: value })}/></div>
        </article>
      </div>
      <article className="v11-settings-card v11-zoom-card">
        <div className="v11-section-mini"><Eye/><div><b>Smooth Zoom</b><span>Real FOV interpolation handled by Eternal Core</span></div><Switch label="Zoom module" value={Boolean(config.enabled?.Zoom)} onChange={value => patch({ enabled: { Zoom: value } })}/></div>
        <RangeSetting title="Target FOV" description="Lower values zoom further" min={10} max={60} value={config.zoomFov} onChange={value => patch({ zoomFov: value })}/>
        <RangeSetting title="Zoom speed" description="Interpolation speed when smooth zoom is enabled" min={1} max={10} value={config.zoomSpeed} onChange={value => patch({ zoomSpeed: value })}/>
        <div className="v11-toggle-setting"><div><b>Smooth transition</b><span>Animate into and out of zoom instead of snapping</span></div><Switch label="Smooth zoom" value={config.smoothZoom} onChange={value => patch({ smoothZoom: value })}/></div>
      </article>
    </motion.section>}

    {config && tab === 'CROSSHAIR' && <motion.section className="v11-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="v11-panel-head"><div><span>CROSSHAIR LAB</span><h2>Pixel-perfect aim.</h2><p>Eternal replaces the vanilla crosshair only while this module is enabled.</p></div><Switch label="Custom crosshair" value={Boolean(config.enabled?.Crosshair)} onChange={value => patch({ enabled: { Crosshair: value } })}/></div>
      <div className="v11-crosshair-layout">
        <article className="v11-crosshair-stage">
          <div className="v11-stage-grid" />
          <div className="v11-crosshair-render" style={{ '--crosshair-color': toHex(crosshair.color), '--gap': `${crosshair.gap}px`, '--length': `${crosshair.length * 2}px`, '--thickness': `${Math.max(1, crosshair.thickness)}px` }}>
            <i className="left"/><i className="right"/><i className="top"/><i className="bottom"/>{crosshair.dot && <i className="dot"/>}
          </div>
          <span>PREVIEW · Minecraft uses the same gap, length and thickness values</span>
        </article>
        <article className="v11-settings-card">
          <div className="v11-color-setting"><div><b>Crosshair color</b><span>Default crosshair tone</span></div><label><input type="color" value={toHex(crosshair.color)} onChange={event => patch({ crosshair: { color: fromHex(event.target.value) } })}/><strong>{toHex(crosshair.color).toUpperCase()}</strong></label></div>
          <div className="v11-color-setting"><div><b>Target color</b><span>Used when Minecraft has an entity under the crosshair</span></div><label><input type="color" value={toHex(crosshair.hitColor)} onChange={event => patch({ crosshair: { hitColor: fromHex(event.target.value) } })}/><strong>{toHex(crosshair.hitColor).toUpperCase()}</strong></label></div>
          <RangeSetting title="Gap" description="Space between center and arms" min={0} max={12} value={crosshair.gap} suffix="px" onChange={value => patch({ crosshair: { gap: value } })}/>
          <RangeSetting title="Length" description="Length of each crosshair arm" min={2} max={14} value={crosshair.length} suffix="px" onChange={value => patch({ crosshair: { length: value } })}/>
          <RangeSetting title="Thickness" description="Crosshair arm thickness" min={1} max={4} value={crosshair.thickness} suffix="px" onChange={value => patch({ crosshair: { thickness: value } })}/>
          <div className="v11-toggle-setting"><div><b>Center dot</b><span>Draw a pixel at dead center</span></div><Switch label="Crosshair center dot" value={crosshair.dot} onChange={value => patch({ crosshair: { dot: value } })}/></div>
          <div className="v11-toggle-setting"><div><b>Outline</b><span>Dark edge for visibility over bright scenes</span></div><Switch label="Crosshair outline" value={crosshair.outline} onChange={value => patch({ crosshair: { outline: value } })}/></div>
        </article>
      </div>
    </motion.section>}

    {config && tab === 'PROFILES' && <motion.section className="v11-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="v11-panel-head"><div><span>CORE PROFILES</span><h2>Switch setups instantly.</h2><p>Profiles snapshot the selected instance's real local Core config.</p></div></div>
      <div className="v11-profile-create">
        <Save/><div><b>Save current setup</b><span>Modules, style, zoom, crosshair and HUD positions</span></div>
        <input value={profileName} maxLength={40} onChange={event => setProfileName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') createProfile(); }} placeholder="e.g. Bedwars, SMP, Minimal"/>
        <button disabled={saving || profileName.trim().length < 2} onClick={createProfile}>SAVE PROFILE</button>
      </div>
      <div className="v11-profile-grid">
        {profiles.map(profile => <article className="v11-profile-card" key={profile.id}>
          <div className="v11-profile-glyph"><Sparkles/></div>
          <div><span>LOCAL PRESET</span><b>{profile.name}</b><p>Saved {dateLabel(profile.createdAt)}</p></div>
          <button className="v11-apply" onClick={() => applyProfile(profile.id, profile.name)}>APPLY <ChevronRight/></button>
          <button className="v11-icon-danger" aria-label={`Delete ${profile.name}`} onClick={() => removeProfile(profile.id)}><Trash2/></button>
        </article>)}
        {!profiles.length && <div className="v11-list-empty"><Save/><b>No profiles yet</b><span>Save the current Core setup above.</span></div>}
      </div>
    </motion.section>}

    {config && tab === 'MEDIA' && <motion.section className="v11-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="v11-panel-head"><div><span>MINECRAFT MEDIA</span><h2>Your actual screenshots.</h2><p>Read directly from this instance's <code>.minecraft/screenshots</code> folder.</p></div><button className="v11-folder-button" onClick={() => call(api.core.openScreenshots(instanceId)).catch(e => setError(e.message))}><FolderOpen/>OPEN FOLDER</button></div>
      <div className="v11-media-list">
        {screenshots.map(row => <article key={row.name} className="v11-media-row">
          <div className="v11-media-icon"><Image/></div><div><b>{row.name}</b><span>{dateLabel(row.modifiedAt)} · {sizeLabel(row.size)}</span></div><button aria-label={`Delete ${row.name}`} onClick={() => removeScreenshot(row.name)}><Trash2/></button>
        </article>)}
        {!screenshots.length && <div className="v11-list-empty"><Image/><b>No screenshots found</b><span>Take a Minecraft screenshot in this instance and refresh Studio.</span></div>}
      </div>
    </motion.section>}
  </div>;
}
