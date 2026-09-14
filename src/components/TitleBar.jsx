import { Minus, Search, Square, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useEternalStore } from '../store/useEternalStore.js';
import eternalLogo from '../../assets/logo.svg';

const pageNames = {
  '/': 'HOME',
  '/library': 'INSTANCES',
  '/mods': 'MOD HUB',
  '/servers': 'SERVERS',
  '/core': 'ETERNAL CORE',
  '/accounts': 'ACCOUNTS',
  '/settings': 'SETTINGS',
  '/downloads': 'DOWNLOADS',
  '/developer': 'DEVELOPER'
};

export default function TitleBar({ onSearch }) {
  const appVersion = useEternalStore(s => s.appVersion);
  const location = useLocation();
  const pageName = pageNames[location.pathname] || 'ETERNAL';

  return <header className="titlebar">
    <div className="brand-mini"><img src={eternalLogo} alt="Eternal"/><strong>ETERNAL</strong><span>{appVersion ? `v${appVersion}` : 'CLIENT'}</span></div>
    <div className="titlebar-context" aria-label={`Current page: ${pageName}`}><i/><span>{pageName}</span></div>
    <button className="command-pill" onClick={onSearch}><Search size={14}/><span>Search pages, profiles and real actions</span><kbd>Ctrl K</kbd></button>
    <div className="window-actions">
      <button aria-label="Minimize" title="Minimize" onClick={() => api.window.minimize()}><Minus/></button>
      <button aria-label="Maximize" title="Maximize / restore" onClick={() => api.window.maximize()}><Square/></button>
      <button aria-label="Close" title="Close Eternal" className="close" onClick={() => api.window.close()}><X/></button>
    </div>
  </header>;
}
