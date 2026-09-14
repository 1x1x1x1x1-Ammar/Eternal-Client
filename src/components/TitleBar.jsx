import { Minus, Search, Square, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useEternalStore } from '../store/useEternalStore.js';
import eternalLogo from '../../assets/logo.svg';

export default function TitleBar({ onSearch }) {
  const appVersion = useEternalStore(s => s.appVersion);
  return <header className="titlebar">
    <div className="brand-mini"><img src={eternalLogo} alt="Eternal"/><strong>ETERNAL</strong><span>{appVersion ? `v${appVersion}` : 'CLIENT'}</span></div>
    <button className="command-pill" onClick={onSearch}><Search size={14}/>Search pages, profiles and real actions <kbd>Ctrl K</kbd></button>
    <div className="window-actions">
      <button aria-label="Minimize" title="Minimize" onClick={() => api.window.minimize()}><Minus/></button>
      <button aria-label="Maximize" title="Maximize / restore" onClick={() => api.window.maximize()}><Square/></button>
      <button aria-label="Close" title="Close Eternal" className="close" onClick={() => api.window.close()}><X/></button>
    </div>
  </header>;
}
