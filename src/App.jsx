import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import TitleBar from './components/TitleBar.jsx';
import CommandCenter from './components/CommandCenter.jsx';
import ActivityDock from './components/ActivityDock.jsx';
import Home from './pages/Home.jsx';
import Library from './pages/Library.jsx';
import Mods from './pages/Mods.jsx';
import Servers from './pages/Servers.jsx';
import Core from './pages/Core.jsx';
import Accounts from './pages/Accounts.jsx';
import Downloads from './pages/Downloads.jsx';
import Developer from './pages/Developer.jsx';
import Settings from './pages/Settings.jsx';
import { useEternalStore } from './store/useEternalStore.js';
import { api } from './lib/api.js';
import eternalLogo from '../assets/logo.svg';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const bootstrap = useEternalStore(s => s.bootstrap);
  const pushLaunch = useEternalStore(s => s.pushLaunchEvent);
  const pushDownload = useEternalStore(s => s.pushDownloadEvent);
  const loading = useEternalStore(s => s.loading);
  const bootstrapError = useEternalStore(s => s.bootstrapError);
  const reducedMotion = useEternalStore(s => s.settings?.reducedMotion);
  const [command, setCommand] = useState(false);
  const [appNotice, setAppNotice] = useState('');

  useEffect(() => {
    bootstrap().catch(() => {});
    const offLaunch = api.on.launch(pushLaunch);
    const offDownload = api.on.download(pushDownload);
    const offApp = api.on.app?.(event => setAppNotice(event?.message || 'Eternal reported an application event.'));
    return () => { offLaunch?.(); offDownload?.(); offApp?.(); };
  }, []);

  useEffect(() => {
    const handler = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommand(value => !value);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (loading) return <div className="splash beta8-splash"><img src={eternalLogo} alt="Eternal"/><div className="loader-ring"/><b>ETERNAL</b><span>Loading launcher state…</span></div>;
  if (bootstrapError) return <div className="beta8-fatal-state">
    <img src={eternalLogo} alt="Eternal"/>
    <AlertTriangle />
    <h1>Eternal could not load its launcher state</h1>
    <p>{bootstrapError}</p>
    <button className="primary" onClick={() => bootstrap().catch(() => {})}><RefreshCw/>Retry</button>
  </div>;

  return <div className="app-shell">
    <TitleBar onSearch={() => setCommand(true)} />
    <Sidebar />
    <main className="content">
      {appNotice && <button className="beta8-app-notice" onClick={() => setAppNotice('')}><AlertTriangle/><span>{appNotice}</span><b>Dismiss</b></button>}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={reducedMotion ? false : { opacity: 0, y: 8, scale: .995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -5, scale: .998 }}
          transition={{ duration: reducedMotion ? 0 : .18, ease: [0.2, 0.8, 0.2, 1] }}
          className="page-motion"
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/mods" element={<Mods />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/core" element={<Core />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </main>
    <ActivityDock />
    <CommandCenter open={command} onClose={() => setCommand(false)} navigate={navigate} />
  </div>;
}
