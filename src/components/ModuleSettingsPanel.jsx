import { useState } from 'react';
import { ArrowLeft, RotateCcw, Settings2, Check } from 'lucide-react';
import schema from '../../shared/module-settings.json';

const hex = color => '#' + ((Number(color) >>> 0) & 0xffffff).toString(16).padStart(6,'0');
export default function ModuleSettingsPanel({ name, config, patch, onBack, saving, error }) {
  const [binding,setBinding] = useState(false);
  const hud = !schema.utilities.includes(name);
  const rules = { ...(hud ? schema.hud : {}), ...schema.modules[name] };
  const values = config.moduleSettings?.[name] || {};
  function get(key,rule) { return (name === 'Crosshair' ? config.crosshair?.[key] : name === 'Zoom' ? config[key] : values[key]) ?? rule.default; }
  function change(key,value) {
    patch(name === 'Crosshair' && key !== 'keybind' ? { crosshair:{[key]:value} }
      : name === 'Zoom' && key !== 'keybind' ? {[key]:value}
      : { moduleSettings:{[name]:{[key]:value}} });
  }
  function reset() {
    const defaults = Object.fromEntries(Object.entries(rules).map(([key,rule]) => [key,rule.default]));
    patch(name === 'Crosshair' ? {crosshair:defaults,moduleSettings:{[name]:{keybind:0}}}
      : name === 'Zoom' ? {...defaults,moduleSettings:{[name]:{keybind:0}}}
      : {moduleSettings:{[name]:{...defaults,keybind:0}}});
  }
  function bind(event) {
    if (!binding) return;
    event.preventDefault();
    if(event.key === 'Escape') { setBinding(false); return; }
    const special = {Space:32,ShiftLeft:340,ShiftRight:344,ControlLeft:341,ControlRight:345,AltLeft:342,AltRight:346};
    const key = event.key === 'Backspace' || event.key === 'Delete' ? 0 : /^F\d+$/.test(event.key) ? 289+Number(event.key.slice(1)) : special[event.code] ?? (event.key.length === 1 ? event.key.toUpperCase().charCodeAt(0) : -1);
    if(key >= 0 && key <= 348) { change('keybind',key); setBinding(false); }
  }
  return <section className="et-module-settings">
    <header><button className="secondary" onClick={onBack}><ArrowLeft/>All modules</button><div><h2>{name.replace(/([a-z])([A-Z])/g,'$1 $2')}</h2><p>Settings for this module</p></div><button className={config.enabled?.[name] ? 'v11-switch on' : 'v11-switch'} aria-label={`${name} module`} aria-pressed={Boolean(config.enabled?.[name])} onClick={() => patch({enabled:{[name]:!config.enabled?.[name]}})}><span/></button></header>
    <div className="et-settings-layout"><div className="et-settings-controls">
      {Object.entries(rules).map(([key,rule]) => <label className="et-setting" key={key} htmlFor={`module-${name}-${key}`}><span>{rule.label}</span>
        {rule.type === 'boolean' ? <input id={`module-${name}-${key}`} type="checkbox" checked={get(key,rule)} onChange={event => change(key,event.target.checked)}/>
          : rule.type === 'color' ? <input id={`module-${name}-${key}`} type="color" value={hex(get(key,rule))} onChange={event => change(key,(0xff000000 | parseInt(event.target.value.slice(1),16)) | 0)}/>
          : <div><output>{get(key,rule)}</output><input id={`module-${name}-${key}`} type="range" min={rule.min} max={rule.max} step={rule.step} value={get(key,rule)} onChange={event => change(key,Number(event.target.value))}/></div>}
      </label>)}
      <div className="et-setting"><span>Toggle keybind</span><button className="secondary" onClick={() => setBinding(!binding)} onKeyDown={bind}>{binding ? 'Press a key · Backspace clears' : values.keybind ? `Key ${values.keybind} · Edit` : 'Unbound · Edit'}</button></div>
      <button className="secondary" onClick={reset}><RotateCcw/>Reset this module</button>
    </div><aside className="et-settings-preview"><small>{hud ? 'APPEARANCE PREVIEW' : 'MODULE BEHAVIOR'}</small>
      {hud ? <div className="et-hud-preview"><div style={{ transform:`scale(${(values.scale ?? 100)/100})`, background:values.background === false ? 'transparent' : `rgba(12,14,18,${(values.opacity ?? 80)/100})`, borderLeft:`3px solid ${hex(values.color ?? -53192)}`, textShadow:values.textShadow !== false ? '1px 1px 2px black' : 'none' }}><b>{name.replace(/([a-z])([A-Z])/g,'$1 $2')}</b><span>{name === 'ArmorDurability' ? 'Helmet 98% · Chest 87% · Legs 94% · Boots 92%' : name === 'CombatSupplies' ? 'Crystal 32 · Totem 4 · Wind 16' : 'Sample HUD value'}</span></div></div>
        : <div className="et-utility-preview"><Settings2/><h3>{name}</h3><p>{name === 'FPSOptimizer' ? 'Applies your render distance, entity distance, particle and shadow preferences while enabled. Limits FPS when the game window is unfocused. Previous values are restored when disabled.' : 'Enable the module above. Changes are saved to this profile and picked up by Eternal Core while it is running.'}</p></div>}
      <p>Preview values are examples. In-game widgets use your current world and inventory.</p><div className="et-saved" role="status" aria-live="polite"><Check/>{error ? 'Could not save — see error above' : saving ? 'Saving…' : 'Saved automatically'}</div><small>Changes apply without closing the menu.</small>
    </aside></div>
  </section>;
}
