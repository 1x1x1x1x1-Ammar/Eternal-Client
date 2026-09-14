import { create } from 'zustand';
import { call, api } from '../lib/api.js';

export const useEternalStore = create((set, get) => ({
  accounts: [],
  activeAccountId: null,
  instances: [],
  servers: [],
  settings: null,
  appVersion: null,
  running: [],
  launchEvents: {},
  downloadEvents: [],
  loading: true,
  bootstrapError: '',

  bootstrap: async () => {
    set({ loading: true, bootstrapError: '' });
    try {
      const [accounts, instances, servers, settings, state] = await Promise.all([
        call(api.accounts.list()),
        call(api.instances.list()),
        call(api.servers.list()),
        call(api.settings.get()),
        call(api.app.state())
      ]);
      set({
        accounts: accounts.accounts,
        activeAccountId: accounts.activeId,
        instances,
        servers,
        settings,
        appVersion: state.version,
        running: state.running,
        loading: false,
        bootstrapError: ''
      });
    } catch (error) {
      set({ loading: false, bootstrapError: error?.message || String(error) });
      throw error;
    }
  },

  refreshInstances: async () => set({ instances: await call(api.instances.list()) }),
  refreshAccounts: async () => {
    const value = await call(api.accounts.list());
    set({ accounts: value.accounts, activeAccountId: value.activeId });
  },
  refreshServers: async () => set({ servers: await call(api.servers.list()) }),
  refreshRuntime: async () => {
    const state = await call(api.app.state());
    set({ appVersion: state.version, running: state.running });
    return state;
  },

  pushLaunchEvent: event => set(state => {
    let running = state.running;
    if (event.state === 'RUNNING' && event.pid) {
      const current = running.find(row => row.instanceId === event.instanceId);
      const pids = [...new Set([...(current?.pids || []), event.pid])];
      running = [...running.filter(row => row.instanceId !== event.instanceId), { instanceId: event.instanceId, pids, count: pids.length }];
    } else if (event.state === 'STOPPED') {
      const current = running.find(row => row.instanceId === event.instanceId);
      const pids = (current?.pids || []).filter(pid => pid !== event.pid);
      running = pids.length
        ? [...running.filter(row => row.instanceId !== event.instanceId), { instanceId: event.instanceId, pids, count: pids.length }]
        : running.filter(row => row.instanceId !== event.instanceId);
    }
    return { launchEvents: { ...state.launchEvents, [event.instanceId]: event }, running };
  }),

  pushDownloadEvent: event => set(state => ({
    downloadEvents: [...state.downloadEvents, { ...event, receivedAt: Date.now() }].slice(-100)
  })),

  patchSettings: async patch => {
    const value = await call(api.settings.patch(patch));
    set({ settings: value });
    return value;
  }
}));
