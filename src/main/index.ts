import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join, dirname, basename } from 'path'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png'
import getLoLSkins from '../services/github'
import processChampionSkins from '../services/data_dragon'
import downloadFile from '../services/downloader'
import patchClientWithMod from '../services/mod_injector'
import { getCachedCatalog, updateCache } from '../services/cache_manager'
import fs from 'fs'

let SKINS_CATALOG: unknown = null
let leagueOfLegendsPath: string | null = null
const LOL_PATH_FILE = path.resolve(__dirname, '../../resources/cache/lolpath.txt')

function getStoredLoLPath(): string | null {
  try {
    if (fs.existsSync(LOL_PATH_FILE)) {
      return fs.readFileSync(LOL_PATH_FILE, 'utf-8')
    }
  } catch (error) {
    console.error('Error reading LoL path file:', error)
  }
  return null
}

function storeLoLPath(path: string): void {
  try {
    fs.writeFileSync(LOL_PATH_FILE, path, 'utf-8')
  } catch (error) {
    console.error('Error writing LoL path file:', error)
  }
}

async function promptForLoLPath(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Executable', extensions: ['exe'] }],
    title: 'Select League of Legends.exe'
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    const parentDir = dirname(selectedPath)
    const grandParentDir = dirname(parentDir)

    if (
      basename(selectedPath).toLowerCase() === 'league of legends.exe' &&
      basename(parentDir).toUpperCase() === 'GAME' &&
      fs.existsSync(join(parentDir, 'DATA'))
    ) {
      return grandParentDir
    }
  }
  return null
}

async function ensureLoLPath(): Promise<void> {
  leagueOfLegendsPath = getStoredLoLPath()
  if (!leagueOfLegendsPath) {
    leagueOfLegendsPath = await promptForLoLPath()
    if (leagueOfLegendsPath) {
      storeLoLPath(leagueOfLegendsPath)
    } else {
      throw new Error('Valid League of Legends path not provided')
    }
  }
}
async function createWindow(): Promise<void> {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 723,
    height: 522,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  Menu.setApplicationMenu(null)
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await ensureLoLPath()
  } catch (error) {
    console.error('Failed to get League of Legends path:', error)
    app.quit()
    return
  }

  // Initialize SKINS_CATALOG
  SKINS_CATALOG = await getCachedCatalog()

  if (!SKINS_CATALOG) {
    console.log('Cache not found or outdated. Fetching new data...')
    const skins = await getLoLSkins()
    SKINS_CATALOG = await processChampionSkins(skins)
    await updateCache(SKINS_CATALOG)
  }

  // IPC handler to return SKINS_CATALOG
  ipcMain.handle('get-lol-catalog', async () => {
    return SKINS_CATALOG
  })

  ipcMain.on('close-app', () => {
    app.quit()
  })

  ipcMain.on('minimize-app', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.handle('inject-skin', async (event, downloadURL: string) => {
    if (!leagueOfLegendsPath) {
      throw new Error('League of Legends path not set')
    }

    const fantomeFilePath = await downloadFile(downloadURL)
    const patchOptions = {
      fantomeFilePath: fantomeFilePath,
      leagueOfLegendsPath: join(leagueOfLegendsPath, 'Game'),
      cslolPath: './resources/cslol/',
      skipConflict: true,
      debugPatcher: false
    }
    await patchClientWithMod(patchOptions)
    console.log('Skin injected')
  })

  await createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
