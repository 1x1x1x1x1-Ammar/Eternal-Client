import { NavLink } from 'react-router-dom';
import { Home, Boxes, Puzzle, Server, Gem, Settings, MessageCircle } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import MinecraftHead from './MinecraftHead.jsx';

const links = [
  ['/', Home, 'Home'],
  ['/library', Boxes, 'Instances'],
  ['/mods', Puzzle, 'Mod Hub'],
  ['/servers', Server, 'Servers'],
  ['/core', Gem, 'Eternal Core']
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

export default function Sidebar() {
  const accounts = useEternalStore(s => s.accounts);
  const activeId = useEternalStore(s => s.activeAccountId);
  const settings = useEternalStore(s => s.settings) || {};
  const account = accounts.find(x => x.id === activeId);
  const discordReady = validDiscordInvite(settings.discordInvite);

  return <aside className="sidebar">
    <div className="logo-orb"><img src="/assets/logo.svg" alt="Eternal" /></div>
    <nav>
      {links.map(([to, Icon, label]) => <NavLink
        key={to}
        to={to}
        end={to === '/'}
        data-tip={label}
        className={({ isActive }) => isActive ? 'nav-icon active' : 'nav-icon'}
      ><Icon size={20} /></NavLink>)}
    </nav>

    <div className="sidebar-spacer" />

    {discordReady && <button
      className="nav-icon"
      data-tip="Discord"
      onClick={() => window.eternal.app.openExternal(settings.discordInvite)}
    ><MessageCircle size={20} /></button>}

    <NavLink to="/settings" data-tip="Settings" className={({ isActive }) => isActive ? 'nav-icon active' : 'nav-icon'}>
      <Settings size={20} />
    </NavLink>

    <div className="account-dot" title={account ? `${account.username} · ${account.type}` : 'No account selected'}>
      <MinecraftHead skinUrl={account?.skinUrl || ''} username={account?.username || '?'} size={38} />
      <i className={account ? 'online' : ''} />
    </div>
  </aside>;
}
