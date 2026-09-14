import net from 'node:net';
import crypto from 'node:crypto';
import { store } from './store.js';

function varInt(value) {
  let n = value | 0;
  const out = [];
  do {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n !== 0) byte |= 0x80;
    out.push(byte);
  } while (n !== 0);
  return Buffer.from(out);
}
function str(value) { const body = Buffer.from(value, 'utf8'); return Buffer.concat([varInt(body.length), body]); }
function readVar(buffer, offset = 0) {
  let num = 0, shift = 0, index = offset, byte;
  do {
    if (index >= buffer.length) return null;
    byte = buffer[index++];
    num |= (byte & 0x7f) << shift;
    shift += 7;
    if (shift > 35) throw new Error('Invalid Minecraft VarInt.');
  } while (byte & 0x80);
  return { value: num, bytes: index - offset };
}
function cleanHost(value) {
  const host = String(value || '').trim();
  if (!host || /[\s/\\]/.test(host)) throw new Error('Enter a valid Minecraft server host or IP address.');
  return host;
}
function cleanPort(value) {
  const port = Number(value || 25565);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Server port must be between 1 and 65535.');
  return port;
}

export async function pingServer({ host, port = 25565 }) {
  host = cleanHost(host);
  port = cleanPort(port);
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const socket = net.createConnection({ host, port });
    let data = Buffer.alloc(0);
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      error ? reject(error) : resolve(value);
    };
    const timer = setTimeout(() => finish(new Error('Server ping timed out after 6.5 seconds.')), 6500);
    socket.on('error', error => finish(new Error(`Could not reach ${host}:${port} — ${error.message}`)));
    socket.on('connect', () => {
      // -1 intentionally asks for status without pretending to be one fixed Minecraft client protocol.
      const handshake = Buffer.concat([varInt(0), varInt(-1), str(host), Buffer.from([(port >> 8) & 255, port & 255]), varInt(1)]);
      socket.write(Buffer.concat([varInt(handshake.length), handshake, Buffer.from([1, 0])]));
    });
    socket.on('data', chunk => {
      data = Buffer.concat([data, chunk]);
      try {
        const packetLength = readVar(data);
        if (!packetLength) return;
        const id = readVar(data, packetLength.bytes);
        if (!id || id.value !== 0) return;
        const length = readVar(data, packetLength.bytes + id.bytes);
        if (!length) return;
        const start = packetLength.bytes + id.bytes + length.bytes;
        if (data.length < start + length.value) return;
        const json = JSON.parse(data.subarray(start, start + length.value).toString('utf8'));
        finish(null, {
          online: true,
          latency: Date.now() - started,
          version: json.version?.name || '',
          protocol: json.version?.protocol,
          players: json.players || { online: 0, max: 0 },
          description: json.description,
          favicon: json.favicon || ''
        });
      } catch (error) {
        finish(new Error(`Server returned an invalid status packet: ${error.message}`));
      }
    });
  });
}

export function listServers() { return store.get('servers'); }
export function saveServer(input) {
  const host = cleanHost(input.host);
  const port = cleanPort(input.port);
  const server = {
    id: input.id || crypto.randomUUID(),
    name: String(input.name || host || 'Server').trim().slice(0, 60) || host,
    host,
    port,
    provider: input.provider === 'aternos' ? 'aternos' : 'custom'
  };
  const all = store.get('servers').filter(item => item.id !== server.id);
  all.push(server);
  store.set('servers', all);
  return server;
}
export function removeServer(id) {
  store.set('servers', store.get('servers').filter(item => item.id !== id));
  return true;
}
