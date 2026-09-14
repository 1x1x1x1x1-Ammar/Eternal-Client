import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Plus, Radio, Play, RefreshCw, Server as ServerIcon, Trash2 } from 'lucide-react';
import { useEternalStore } from '../store/useEternalStore.js';
import { call, api } from '../lib/api.js';

export default function Servers() {
  const servers = useEternalStore(s => s.servers);
  const instances = useEternalStore(s => s.instances);
  const refresh = useEternalStore(s => s.refreshServers);
  const [states, setStates] = useState({});
  const [form, setForm] = useState({ name: '', host: '', port: 25565, provider: 'custom' });
  const [instanceId, setInstanceId] = useState(instances[0]?.id || '');
  const [pinging, setPinging] = useState({});
  const [joining, setJoining] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!instances.length) return setInstanceId('');
    if (!instances.some(instance => instance.id === instanceId)) setInstanceId(instances[0].id);
  }, [instances, instanceId]);

  async function ping(server) {
    setPinging(value => ({ ...value, [server.id]: true }));
    setError('');
    try {
      const value = await call(api.servers.ping(server));
      setStates(current => ({ ...current, [server.id]: value }));
      return value;
    } catch (e) {
      setStates(current => ({ ...current, [server.id]: { online: false, error: e.message } }));
      return null;
    } finally {
      setPinging(value => ({ ...value, [server.id]: false }));
    }
  }

  async function pingAll() {
    await Promise.all(servers.map(server => ping(server)));
  }

  async function save() {
    setSaving(true); setError('');
    try {
      await call(api.servers.save(form));
      setForm({ name: '', host: '', port: 25565, provider: 'custom' });
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function join(server) {
    if (!instanceId) return setError('Create/select a Minecraft instance before joining a server.');
    setJoining(server.id); setError('');
    try { await call(api.servers.join({ instanceId, server })); }
    catch (e) { setError(e.message); }
    finally { setJoining(''); }
  }

  return <div className="beta8-page beta8-servers-page">
    <div className="page-head beta8-page-head"><div><small>SERVERS</small><h1>Real Minecraft server status.</h1><p>Eternal performs a Minecraft status handshake and launches Quick Play with the exact saved address.</p></div><div className="head-actions"><button className="secondary" disabled={!servers.length} onClick={pingAll}><RefreshCw/>Ping all</button><select className="instance-select" value={instanceId} onChange={e => setInstanceId(e.target.value)}>{!instances.length && <option value="">No profiles</option>}{instances.map(instance => <option key={instance.id} value={instance.id}>Join with {instance.name}</option>)}</select></div></div>

    <div className="server-add beta8-server-add"><input placeholder="Display name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/><input placeholder="play.example.net" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} onKeyDown={e => e.key === 'Enter' && save()}/><input className="port" type="number" min="1" max="65535" value={form.port} onChange={e => setForm({ ...form, port: Number(e.target.value) })}/><select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}><option value="custom">Custom</option><option value="aternos">Aternos</option></select><button className="primary" disabled={saving || !form.host.trim()} onClick={save}><Plus/>{saving ? 'Saving…' : 'Add server'}</button></div>

    {error && <div className="release-error beta8-inline-error"><AlertTriangle/>{error}</div>}

    <div className="server-grid beta8-server-grid">{servers.map(server => {
      const status = states[server.id];
      const isPinging = Boolean(pinging[server.id]);
      return <article className={`server-card beta8-server-card ${status?.online ? 'is-online' : status?.online === false ? 'is-offline' : ''}`} key={server.id}>
        <div className={`server-light ${status?.online ? 'online' : status?.online === false ? 'offline' : ''}`}/>
        <div className="server-info"><b>{server.name}</b><span>{server.host}:{server.port}</span>{status && <small>{status.online ? `${status.players?.online || 0}/${status.players?.max || 0} players · ${status.latency}ms · ${status.version || 'Minecraft'}` : status.error || 'Offline'}</small>}</div>
        <button className="secondary" disabled={isPinging} onClick={() => ping(server)}><Radio/>{isPinging ? 'Pinging…' : 'Ping'}</button>
        <button className="play-btn" disabled={!instanceId || joining === server.id} onClick={() => join(server)}><Play/>{joining === server.id ? 'Starting…' : 'Join'}</button>
        {server.provider === 'aternos' && <button className="icon-btn" title="Open Aternos dashboard" onClick={() => api.app.openExternal('https://aternos.org/servers/')}><ExternalLink/></button>}
        <button className="icon-btn" title="Remove server" onClick={async () => { if (!confirm(`Remove ${server.name}?`)) return; try { await call(api.servers.remove(server.id)); await refresh(); } catch (e) { setError(e.message); } }}><Trash2/></button>
      </article>;
    })}{!servers.length && <div className="empty-card big beta8-empty"><ServerIcon/><b>No saved servers</b><span>Add a real Minecraft address above, then ping or quick-join it.</span></div>}</div>

    <div className="notice beta8-notice"><b>Aternos:</b> Eternal can save, ping and quick-join your server and open the official dashboard. Start/stop/console are deliberately not shown as working controls without an authorized Aternos API.</div>
  </div>;
}
