"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const axios = require("axios");
const fs = require("fs");
const child_process = require("child_process");
const fs$1 = require("fs/promises");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs$1);
const icon = "data:image/png;base64,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";
async function getLoLSkins(owner = "koobzaar", repo = "lol-skins-developer") {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    const response = await axios.get(url);
    const tree = response.data.tree;
    const championSkins = {};
    tree.forEach((item) => {
      if (item.type === "blob" && item.path.endsWith(".fantome")) {
        const [championId, skinName] = item.path.split("/");
        if (!championSkins[championId]) {
          championSkins[championId] = [];
        }
        const downloadUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${championId}/${skinName}`;
        championSkins[championId].push({
          name: skinName,
          downloadUrl
        });
      }
    });
    return championSkins;
  } catch (error) {
    console.error("Error fetching LoL skins:", error);
    throw error;
  }
}
const resourcesDir = "./resources/data_dragon";
function ensureDirectoryExistence(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Diretório criado: ${dir}`);
  }
}
async function downloadJsonIfNotExists(url, filePath) {
  ensureDirectoryExistence(path.dirname(filePath));
  if (!fs.existsSync(filePath)) {
    console.log(`Arquivo não encontrado em ${filePath}. Baixando...`);
    const response = await axios.get(url);
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
    console.log(`Arquivo salvo em ${filePath}`);
  } else {
    console.log(`Arquivo já existe em ${filePath}. Pulando download.`);
  }
}
function getLoadingScreenUrl(championAlias, skinId) {
  const formattedSkinId = skinId.toString();
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championAlias}_${formattedSkinId}.jpg`;
}
async function processChampionSkins(championSkins) {
  const processedSkinsArray = [];
  console.log("Iniciando processamento de skins dos campeões");
  for (const [championIdStr, skins] of Object.entries(championSkins)) {
    const championId = parseInt(championIdStr);
    console.log(`Processando skins para o campeão com ID: ${championId}`);
    const championData = await getChampionData(championId);
    if (!championData) {
      console.log(`Dados do campeão não encontrados para o ID: ${championId}`);
      continue;
    }
    const championName = championData.name;
    const championAlias = championData.alias;
    const processedSkins = [];
    console.log(`Nome do campeão: ${championName}, Alias: ${championAlias}`);
    for (const skin of skins) {
      const skinId = parseInt(skin.name.replace(".fantome", ""));
      console.log(`Processando skin com ID: ${skinId}`);
      const dataDragonSkin = championData.skins.find((s) => {
        const dataDragonSkinIdStr = s.id.toString();
        const championIdLength = championId.toString().length;
        const skinIdFromDataDragon = parseInt(dataDragonSkinIdStr.slice(championIdLength));
        return skinIdFromDataDragon === skinId;
      });
      if (dataDragonSkin) {
        const processedSkin = {
          skinName: dataDragonSkin.name,
          skinId,
          downloadUrl: skin.downloadUrl,
          loadingScreenUrl: getLoadingScreenUrl(championAlias, skinId)
        };
        console.log(`Skin encontrada: ${dataDragonSkin.name}`);
        if (dataDragonSkin.chromas && dataDragonSkin.chromas.length > 0) {
          processedSkin.chromas = dataDragonSkin.chromas.map((chroma) => {
            const championIdLength = championId.toString().length;
            const parsedChromaID = parseInt(chroma.id.toString().slice(championIdLength));
            return {
              chromaId: parsedChromaID,
              chromaColors: chroma.colors,
              downloadUrl: `https://raw.githubusercontent.com/koobzaar/lol-skins-developer/main/${championId}/${parsedChromaID}.fantome`
            };
          });
          console.log(
            `${processedSkin.chromas.length} chromas encontrados para a skin: ${dataDragonSkin.name}`
          );
        }
        processedSkins.push(processedSkin);
      } else {
        console.log(`Skin com ID ${skinId} não encontrada para o campeão ${championName}`);
      }
    }
    const championSquare = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
    processedSkinsArray.push({
      championName,
      championKey: championId,
      championSquare,
      championAlias,
      skins: processedSkins
    });
  }
  processedSkinsArray.sort((a, b) => a.championName.localeCompare(b.championName));
  console.log("Processamento de skins dos campeões concluído");
  return processedSkinsArray;
}
async function getChampionData(championId) {
  try {
    console.log(`Buscando dados do campeão para o ID: ${championId}`);
    const championSummaryUrl = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json";
    const championSummaryPath = path.join(resourcesDir, "champion-summary.json");
    await downloadJsonIfNotExists(championSummaryUrl, championSummaryPath);
    const championSummary = JSON.parse(fs.readFileSync(championSummaryPath, "utf-8")).find(
      (champion) => champion.id === championId
    );
    if (!championSummary) {
      console.error(`Campeão com ID ${championId} não encontrado no resumo`);
      return null;
    }
    const championDataUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/${championId}.json`;
    const championDataPath = path.join(resourcesDir, `champion-${championId}.json`);
    await downloadJsonIfNotExists(championDataUrl, championDataPath);
    const championData = JSON.parse(fs.readFileSync(championDataPath, "utf-8"));
    console.log(`Dados do campeão obtidos para o ID: ${championId}`);
    return { ...championData, alias: championSummary.alias };
  } catch (error) {
    console.error(`Erro ao buscar dados do campeão para o ID ${championId}:`, error);
    return null;
  }
}
async function downloadFile(url) {
  const fileName = path.basename(url);
  const outputFolder = "./resources/fantome_files/";
  const filePath = path.join(outputFolder, fileName);
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
    console.log(`Diretório criado: ${outputFolder}`);
  }
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(filePath));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Erro ao baixar o arquivo da URL ${url}:`, error);
    throw error;
  }
}
async function patchClientWithMod(options) {
  const {
    fantomeFilePath,
    leagueOfLegendsPath,
    cslolPath,
    skipConflict = false,
    debugPatcher = false
  } = options;
  const modToolsPath = path__namespace.join(cslolPath, "mod-tools.exe");
  const installedPath = path__namespace.join(cslolPath, "installed");
  const profilesPath = path__namespace.join(cslolPath, "profiles");
  try {
    await fs__namespace.rm(installedPath, { recursive: true, force: true });
    await fs__namespace.rm(profilesPath, { recursive: true, force: true });
    console.log(`Deleted contents of ${installedPath} and ${profilesPath}`);
  } catch (deleteError) {
    console.error(`Error deleting contents of ${installedPath} or ${profilesPath}: ${deleteError}`);
  }
  await fs__namespace.mkdir(installedPath, { recursive: true });
  await fs__namespace.mkdir(profilesPath, { recursive: true });
  const modName = path__namespace.basename(fantomeFilePath, path__namespace.extname(fantomeFilePath));
  const modInstallPath = path__namespace.join(installedPath, modName);
  await execPromise(modToolsPath, [
    "import",
    fantomeFilePath,
    modInstallPath,
    `--game:${leagueOfLegendsPath}`
  ]);
  const profileName = "Default Profile";
  const profilePath = path__namespace.join(profilesPath, profileName);
  const profileConfigPath = `${profilePath}.config`;
  await fs__namespace.writeFile(path__namespace.join(cslolPath, "current.profile"), profileName);
  await execPromise(modToolsPath, [
    "mkoverlay",
    installedPath,
    profilePath,
    `--game:${leagueOfLegendsPath}`,
    `--mods:${modName}`,
    skipConflict ? "--ignoreConflict" : ""
  ]);
  await execPromise(modToolsPath, [
    "runoverlay",
    profilePath,
    profileConfigPath,
    `--game:${leagueOfLegendsPath}`,
    `--opts:${debugPatcher ? "debugpatcher" : "none"}`
  ]);
  console.log("Patcher executed successfully");
  return Promise.resolve();
}
function execPromise(command, args) {
  return new Promise((resolve, reject) => {
    child_process.execFile(command, args, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
let SKINS_CATALOG = null;
async function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 723,
    height: 522,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  electron.Menu.setApplicationMenu(null);
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(async () => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  const skins = await getLoLSkins();
  SKINS_CATALOG = await processChampionSkins(skins);
  electron.ipcMain.handle("get-lol-catalog", async () => {
    return SKINS_CATALOG;
  });
  electron.ipcMain.on("close-app", () => {
    electron.app.quit();
  });
  electron.ipcMain.on("minimize-app", () => {
    electron.BrowserWindow.getFocusedWindow()?.minimize();
  });
  electron.ipcMain.handle("inject-skin", async (event, downloadURL) => {
    const fantomeFilePath = await downloadFile(downloadURL);
    const patchOptions = {
      fantomeFilePath,
      leagueOfLegendsPath: "C:\\Riot Games\\League of Legends\\Game",
      cslolPath: "./resources/cslol/",
      skipConflict: true,
      debugPatcher: false
    };
    await patchClientWithMod(patchOptions);
    console.log("Skin injected");
  });
  await createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
