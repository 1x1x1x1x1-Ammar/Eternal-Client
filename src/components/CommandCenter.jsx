import { useEffect, useMemo, useState } from 'react';
import {
  Boxes, Download, Gem, Home, Play, Puzzle, RefreshCw, Search, Server,
  Settings, TerminalSquare, UserRound
} from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';

const pageActions = [
  ['/', 'Home', Home],
  ['/library', 'Instances', Boxes],
  ['/mods', 'Mod Hub', Puzzle],
  ['/servers', 'Servers', Server],
  ['/core', 'Eternal Core', Gem],
  ['/accounts', 'Accounts', UserRound],
  ['/settings', 'Settings', Settings],
  ['/downloads', 'Downloads', Download],
  ['/developer', 'Developer diagnostics', TerminalSquare]
];

export default function CommandCenter({ open, onClose, navigate }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');
  const instances = useEternalStore(s => s.instances);
  const refresh = useEternalStore(s => s.refreshInstances);

  useEffect(() => {
    if (!open) { setQ(''); setSelected(0); setError(''); }
  }, [open]);

  const items = useMemo(() => {
    const all = [
      ...pageActions.map(([route, label, icon]) => ({ label, icon, sub: 'Open page', run: () => navigate(route) })),
      ...instances.map(instance => ({
        label: `Launch ${instance.name}`,
        sub: `${instance.minecraftVersion} · ${instance.loader}`,
        icon: Play,
        run: () => call(api.instances.launch({ instanceId: instance.id }))
      })),
      { label: 'Refresh instances from disk', sub: 'Reload managed profile metadata', icon: RefreshCw, run: refresh }
    ];
    const needle = q.trim().toLowerCase();
    return all.filter(item => !needle || `${item.label} ${item.sub || ''}`.toLowerCase().includes(needle));
  }, [q, instances, navigate, refresh]);

  useEffect(() => setSelected(value => Math.max(0, Math.min(value, Math.max(0, items.length - 1)))), [items.length]);

  if (!open) return null;

  async function run(item) {
    if (!item) return;
    setError('');
    try {
      await item.run();
      onClose();
    } catch (e) {
      setError(e.message);
    }
  }

  return <div className="command-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="command-center beta8-command-center" role="dialog" aria-modal="true" aria-label="Eternal command center">
      <div className="command-input"><Search/><input
        autoFocus
        placeholder="Search pages, profiles and real actions…"
        value={q}
        onChange={event => { setQ(event.target.value); setSelected(0); }}
        onKeyDown={event => {
          if (event.key === 'Escape') onClose();
          if (event.key === 'ArrowDown') { event.preventDefault(); setSelected(value => Math.min(items.length - 1, value + 1)); }
          if (event.key === 'ArrowUp') { event.preventDefault(); setSelected(value => Math.max(0, value - 1)); }
          if (event.key === 'Enter') { event.preventDefault(); run(items[selected]); }
        }}
      /></div>
      <div className="command-results">
        {items.map((item, index) => {
          const Icon = item.icon;
          return <button key={`${item.label}-${index}`} className={index === selected ? 'selected' : ''} onMouseEnter={() => setSelected(index)} onClick={() => run(item)}>
            <Icon/><span><b>{item.label}</b>{item.sub && <small>{item.sub}</small>}</span><kbd>{index === selected ? 'ENTER' : '↵'}</kbd>
          </button>;
        })}
        {!items.length && <div className="empty-state">No real action matches that search.</div>}
      </div>
      {error && <div className="beta8-command-error">{error}</div>}
    </div>
  </div>;
}
