const { contextBridge, ipcMain } = require("electron");

// Expose flag that we're running in Electron
contextBridge.exposeInMainWorld("__ELECTRON__", true);

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = ["toMain"];
      if (validChannels.includes(channel)) {
        ipcMain.send(channel, data);
      }
    },
    receive: (channel, func) => {
      const validChannels = ["fromMain"];
      if (validChannels.includes(channel)) {
        ipcMain.on(channel, (event, ...args) => func(...args));
      }
    },
  },
});
