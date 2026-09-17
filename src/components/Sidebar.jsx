import { NavLink } from 'react-router-dom';
import { Boxes, Download, Home, MessageCircle, Palette, Puzzle, Server, Settings, ShieldCheck, TerminalSquare, UserRound } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import MinecraftHead from './MinecraftHead.jsx';
import eternalLogo from '../../assets/logo.svg';

const primaryLinks = [
  ['/', Home, 'Home'],
  ['/library', Boxes, 'Instances'],
  ['/mods', Puzzle, 'Mods'],
  ['/servers', Server, 'Servers'],
  ['/core', ShieldCheck, 'Eternal Core'],
  ['/studio', Palette, 'Studio'],
  ['/accounts', UserRound, 'Accounts'],
  ['/settings', Settings, 'Settings']
];
const secondaryLinks = [
  ['/downloads', Download, 'Downloads'],
  ['/developer', TerminalSquare, 'Developer']
];

function validDiscordInvite(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'discord.gg' || url.hostname === 'discord.com');
  } catch {
    return false;
  }
}

function LinkRow({ to, Icon, label }) {
  return <NavLink to={to} end={to === '/'} data-tip={label} className={({ isActive }) => isActive ? 'nav-icon active' : 'nav-icon'}>
    <Icon size={17} /><span>{label}</span>
  </NavLink>;
}

export default function Sidebar() {
  const accounts = useEternalStore(s => s.accounts);
  const activeId = useEternalStore(s => s.activeAccountId);
  const settings = useEternalStore(s => s.settings) || {};
  const account = accounts.find(x => x.id === activeId);
  const discordReady = validDiscordInvite(settings.discordInvite);

  return <aside className="sidebar release-sidebar">
    <div className="sidebar-brand">
      <img src={eternalLogo} alt="Eternal" />
      <div><strong>ETERNAL</strong><small>CLIENT</small></div>
    </div>

    <div className="sidebar-group-label">PLAY</div>
    <nav className="sidebar-primary" aria-label="Main navigation">{primaryLinks.map(([to, Icon, label]) => <LinkRow key={to} to={to} Icon={Icon} label={label} />)}</nav>
    <div className="sidebar-divider" />
    <div className="sidebar-group-label">SYSTEM</div>
    <nav className="sidebar-secondary" aria-label="Utility navigation">{secondaryLinks.map(([to, Icon, label]) => <LinkRow key={to} to={to} Icon={Icon} label={label} />)}</nav>

    <div className="sidebar-spacer" />
    {discordReady && <button className="nav-icon sidebar-discord" data-tip="Discord" onClick={() => window.eternal.app.openExternal(settings.discordInvite)}><MessageCircle size={17} /><span>Discord</span></button>}

    <NavLink to="/accounts" className="sidebar-account" title={account ? `${account.username} · ${account.type}` : 'No account selected'}>
      <MinecraftHead skinUrl={account?.skinUrl || ''} username={account?.username || '?'} size={34} />
      <div><b>{account?.username || 'No account'}</b><span>{account ? (account.type === 'microsoft' ? 'Microsoft' : 'Offline') : 'Add account'}</span></div>
      <i className={account ? 'online' : ''} />
    </NavLink>
  </aside>;
}
