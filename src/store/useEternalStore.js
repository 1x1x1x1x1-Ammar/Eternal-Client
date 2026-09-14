import { create } from 'zustand';
import { call, api } from '../lib/api.js';

const AUTO_CONSOLE_CHANNELS = new Set([
  'instances:create', 'instances:duplicate', 'instances:launch',
  'mods:install', 'servers:join', 'core:exportStandalone',
  'accounts:loginMicrosoft', 'updater:download', 'updater:install'
]);

function transferFromLaunch(event, receivedAt) {
  if (event?.state !== 'DOWNLOADING') return null;
  return {
    id: `minecraft-${event.instanceId || 'unknown'}-${event.progress?.type || 'download'}-${receivedAt}`,
    instanceId: event.instanceId,
    type: 'download',
    source: event.source || 'minecraft',
    state: 'DOWNLOADING',
    name: 'Minecraft',
    message: event.message || 'Downloading Minecraft files…',
    progress: event.progress || null,
    receivedAt
  };
}

export const useEternalStore = create((set, get) => ({
  accounts: [],
  activeAccountId: null,
  instances: [],
  servers: [],
  settings: null,
  appVersion: null,
  running: [],
  launchEvents: {},
  launchLogs: {},
  downloadEvents: [],
  operationEvents: [],
  operationConsoleOpen: false,
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
    const receivedAt = Date.now();
    const runtimeProblem = event?.warning || event?.level === 'error' || event?.level === 'warning' || event?.state === 'PROCESS_ERROR';
    if (event.state === 'LOG' || event.state === 'DEBUG') {
      const previous = state.launchLogs[event.instanceId] || [];
      return {
        launchLogs: {
          ...state.launchLogs,
          [event.instanceId]: [...previous, { ...event, receivedAt }].slice(-180)
        },
        operationConsoleOpen: runtimeProblem ? true : state.operationConsoleOpen
      };
    }

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

    const transfer = transferFromLaunch(event, receivedAt);
    return {
      launchEvents: { ...state.launchEvents, [event.instanceId]: { ...event, receivedAt } },
      running,
      downloadEvents: transfer ? [...state.downloadEvents, transfer].slice(-240) : state.downloadEvents,
      operationConsoleOpen: runtimeProblem ? true : state.operationConsoleOpen
    };
  }),

  pushDownloadEvent: event => set(state => ({
    downloadEvents: [...state.downloadEvents, { ...event, receivedAt: Date.now() }].slice(-240)
  })),

  pushOperationEvent: event => set(state => {
    const shouldOpen = event?.state === 'ERROR' || (event?.state === 'STARTED' && AUTO_CONSOLE_CHANNELS.has(event?.channel));
    return {
      operationEvents: [...state.operationEvents, { ...event, receivedAt: Date.now() }].slice(-220),
      operationConsoleOpen: shouldOpen ? true : state.operationConsoleOpen
    };
  }),
  setOperationConsoleOpen: open => set({ operationConsoleOpen: Boolean(open) }),
  clearOperationEvents: () => set({ operationEvents: [] }),

  patchSettings: async patch => {
    const value = await call(api.settings.patch(patch));
    set({ settings: value });
    return value;
  }
}));
