import { Minus, Search, Square, X } from 'lucide-react';
import { api } from '../lib/api.js';

export default function TitleBar({ onSearch }) {
  return <header className="titlebar">
    <div className="brand-mini"><img src="/assets/logo.svg" alt="Eternal"/><strong>ETERNAL</strong><span>BETA 6</span></div>
    <button className="command-pill" onClick={onSearch}><Search size={14}/>Search instances, mods, servers or run command <kbd>Ctrl K</kbd></button>
    <div className="window-actions">
      <button aria-label="Minimize" onClick={() => api.window.minimize()}><Minus/></button>
      <button aria-label="Maximize" onClick={() => api.window.maximize()}><Square/></button>
      <button aria-label="Close" className="close" onClick={() => api.window.close()}><X/></button>
    </div>
  </header>;
}
