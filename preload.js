// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// Todas as APIs do Node.js estão disponíveis no processo de preload.
// Ele tem o mesmo sandbox que uma extensão do Chrome.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    ['chrome', 'node', 'electron'].forEach(dependency => {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    });
});

contextBridge.exposeInMainWorld(
    "api", {
        invoke: (channel, data) => {
            const validChannels = ["myfunc"]; // lista de canais ipcMain.handle que você quer acessar no frontend
            if (validChannels.includes(channel)) {
                // ipcRenderer.invoke acessa canais ipcMain.handle como 'myfunc'
                // certifique-se de incluir esta instrução return ou você não receberá sua Promise de volta
                return ipcRenderer.invoke(channel, data);
            }
        },
    }
);