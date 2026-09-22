import { useEffect, useRef, useState } from 'react';
import { RotateCw, Upload, UserRound } from 'lucide-react';
import { api, call } from '../lib/api.js';
import SkinPreview from './SkinPreview.jsx';

export default function SkinStudio({ accounts, activeId, refreshAccounts }) {
  const [accountId, setAccountId] = useState(activeId || accounts[0]?.id || '');
  const [draft, setDraft] = useState('');
  const [filename, setFilename] = useState('');
  const [variant, setVariant] = useState('classic');
  const [back, setBack] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInput = useRef(null);
  const revision = useRef(0);
  const account = accounts.find(item => item.id === accountId);
  useEffect(() => {
    if (!accounts.some(item => item.id === accountId)) setAccountId(activeId || accounts[0]?.id || '');
  }, [accounts, accountId, activeId]);
  useEffect(() => {
    revision.current++;
    setDraft(''); setFilename(''); setVariant(account?.skinVariant || 'classic'); setError(''); setNotice('');
  }, [accountId]);

  async function choose(file) {
    if (!file) return;
    const request = ++revision.current;
    setError(''); setNotice(''); setDraft(''); setFilename('');
    try {
      if (file.size > 256 * 1024 || !file.name.toLowerCase().endsWith('.png')) throw new Error('Choose a PNG smaller than 256 KB.');
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read this skin.')); reader.readAsDataURL(file);
      });
      const image = new Image(); image.src = dataUrl; await image.decode();
      if (image.width !== 64 || ![32, 64].includes(image.height)) throw new Error('Use a 64 x 64 or 64 x 32 Minecraft skin.');
      if (revision.current !== request) return;
      if (image.height === 32) setVariant('classic');
      setDraft(dataUrl); setFilename(file.name);
    } catch (e) { if (revision.current === request) setError(e.message); }
  }

  async function apply(reset = false) {
    if (!account || busy) return;
    const request = revision.current;
    setBusy(true); setError(''); setNotice('');
    try {
      await call(api.accounts.skin({ accountId: account.id, dataUrl: draft, variant, reset }));
      await refreshAccounts();
      if (request !== revision.current) return;
      setDraft(''); setFilename('');
      setNotice(account.type === 'microsoft' ? (reset ? 'Minecraft skin reset.' : 'Skin applied to Minecraft. Rejoin your server to refresh it.') : (reset ? 'Local skin removed.' : 'Skin saved to this Eternal profile.'));
    } catch (e) { if (request === revision.current) setError(e.message); }
    finally { setBusy(false); }
  }

  return <section className="skin-studio" aria-label="Skin studio">
    <div className="skin-studio-heading"><UserRound/><div><h2>Skin studio</h2><p>{account?.type === 'microsoft' ? 'Apply your skin to Minecraft Java.' : 'Offline skins are saved on this device in Eternal.'}</p></div></div>
    <div className="skin-studio-body">
      <div><SkinPreview url={draft || account?.skinUrl || ''} variant={variant} back={back}/><button className="secondary" onClick={() => setBack(value => !value)}><RotateCw/>{back ? 'View front' : 'View back'}</button></div>
      <div className="skin-controls">
        <label>Account<select aria-label="Skin account" value={accountId} disabled={busy} onChange={event => setAccountId(event.target.value)}>{!accounts.length && <option value="">Add an account first</option>}{accounts.map(item => <option key={item.id} value={item.id}>{item.username} ({item.type})</option>)}</select></label>
        <label>Model<select aria-label="Skin model" value={variant} disabled={busy} onChange={event => setVariant(event.target.value)}><option value="classic">Classic (wide arms)</option><option value="slim">Slim</option></select></label>
        <input ref={fileInput} aria-label="Skin PNG" type="file" accept="image/png,.png" hidden onChange={event => { choose(event.target.files?.[0]); event.target.value = ''; }}/>
        <button className="secondary" disabled={!account || busy} onClick={() => fileInput.current.click()}><Upload/>Choose PNG</button>
        {filename && <span className="skin-filename">{filename}</span>}
        <div className="skin-actions"><button className="primary" disabled={!account || !draft || busy} onClick={() => apply()}>{busy ? 'Saving...' : account?.type === 'microsoft' ? 'Apply to Minecraft profile' : 'Save to Eternal'}</button><button className="secondary" disabled={!account?.skinUrl || busy} onClick={() => apply(true)}>Reset skin</button></div>
        {error && <p role="alert" className="skin-error">{error}</p>}{notice && <p role="status">{notice}</p>}
      </div>
    </div>
  </section>;
}
