const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);
const on = (channel, cb) => {
  const fn = (_event, payload) => cb(payload);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};

contextBridge.exposeInMainWorld('eternal', {
  app: {
    state: () => invoke('app:state'),
    diagnostics: () => invoke('app:diagnostics'),
    openExternal: (url) => invoke('app:openExternal', url),
    openDataFolder: () => invoke('app:openDataFolder')
  },
  window: {
    minimize: () => invoke('window:minimize'),
    maximize: () => invoke('window:maximize'),
    close: () => invoke('window:close')
  },
  settings: {
    get: () => invoke('settings:get'),
    patch: (value) => invoke('settings:patch', value)
  },
  dialog: {
    folder: () => invoke('dialog:folder'),
    java: () => invoke('dialog:java'),
    jars: () => invoke('dialog:jars'),
    skin: () => invoke('dialog:skin')
  },
  accounts: {
    list: () => invoke('accounts:list'),
    addOffline: (username) => invoke('accounts:addOffline', username),
    loginMicrosoft: () => invoke('accounts:loginMicrosoft'),
    remove: (id) => invoke('accounts:remove', id),
    activate: (id) => invoke('accounts:activate', id),
    refreshProfile: (id) => invoke('accounts:refreshProfile', id),
    skinPreview: (id) => invoke('accounts:skinPreview', id),
    setSkin: (data) => invoke('accounts:setSkin', data),
    resetSkin: (id) => invoke('accounts:resetSkin', id)
  },
  instances: {
    list: () => invoke('instances:list'),
    versions: (options) => invoke('instances:versions', options),
    create: (data) => invoke('instances:create', data),
    patch: (data) => invoke('instances:patch', data),
    duplicate: (data) => invoke('instances:duplicate', data),
    remove: (id) => invoke('instances:remove', id),
    launch: (data) => invoke('instances:launch', data),
    stop: (id) => invoke('instances:stop', id),
    openFolder: (id) => invoke('instances:openFolder', id)
  },
  java: {
    detect: () => invoke('java:detect'),
    validate: (path) => invoke('java:validate', path)
  },
  mods: {
    list: (id) => invoke('mods:list', id),
    add: (data) => invoke('mods:add', data),
    remove: (data) => invoke('mods:remove', data),
    toggle: (data) => invoke('mods:toggle', data),
    search: (data) => invoke('mods:search', data),
    install: (data) => invoke('mods:install', data)
  },
  servers: {
    list: () => invoke('servers:list'),
    save: (server) => invoke('servers:save', server),
    remove: (id) => invoke('servers:remove', id),
    ping: (server) => invoke('servers:ping', server),
    join: (data) => invoke('servers:join', data)
  },
  core: {
    status: (id) => invoke('core:status', id),
    exportStandalone: () => invoke('core:exportStandalone')
  },
  updater: {
    check: () => invoke('updater:check'),
    download: () => invoke('updater:download'),
    install: () => invoke('updater:install')
  },
  on: {
    launch: (cb) => on('launch:event', cb),
    download: (cb) => on('download:event', cb),
    operation: (cb) => on('operation:event', cb),
    account: (cb) => on('account:event', cb),
    update: (cb) => on('update:event', cb),
    app: (cb) => on('app:event', cb)
  }
});
