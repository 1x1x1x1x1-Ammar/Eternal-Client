export function keyName(key) {
  const names = { 0: 'Unbound', 32: 'Space', 256: 'Esc', 257: 'Enter', 258: 'Tab', 259: 'Backspace', 261: 'Delete', 262: 'Right', 263: 'Left', 264: 'Down', 265: 'Up', 340: 'Left Shift', 341: 'Left Ctrl', 342: 'Left Alt', 344: 'Right Shift', 345: 'Right Ctrl', 346: 'Right Alt' };
  if (key == null) return 'Unbound';
  if (names[key]) return names[key];
  if (key >= 290 && key <= 314) return `F${key - 289}`;
  if (key >= 65 && key <= 90 || key >= 48 && key <= 57) return String.fromCharCode(key);
  return `Key ${key}`;
}

export function launchStatus({ selected, account, running, event }) {
  if (!selected) return 'Create an instance to play';
  if (running) return 'Minecraft is running';
  if (event && !['RUNNING', 'STOPPED', 'LOG', 'DEBUG'].includes(event.state)) return event.message || event.state;
  if (!account) return 'Select an account to play';
  if (event?.state === 'STOPPED') return event.message || 'Minecraft stopped';
  return selected.lastPlayedAt ? 'Not running' : 'Not launched yet';
}

export function recentTransfers(events, limit = 4) {
  const seen = new Set();
  return [...events].reverse().filter(event => {
    const key = event.id || `${event.type}:${event.instanceId || ''}:${event.name || ''}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, limit);
}
