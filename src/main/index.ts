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
import { ChildProcess } from 'child_process'
import https from 'https'

let SKINS_CATALOG: unknown = null
let leagueOfLegendsPath: string | null = null

// Helper function to get the correct path for resources
function getResourcePath(...args: string[]): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', ...args)
    : path.join(__dirname, '..', '..', 'resources', ...args)
}

const LOL_PATH_FILE = getResourcePath('cache', 'lolpath.txt')
const CSLOL_FOLDER = getResourcePath('cslol')
const CACHE_FOLDER = getResourcePath('cache')

let modToolsProcess: ChildProcess | null = null

const REQUIRED_FILES = {
  'mod-tools.exe':
    'https://raw.githubusercontent.com/koobzaar/exalted/main/resources/cslol/mod-tools.exe',
  'cslol-dll.dll':
    'https://raw.githubusercontent.com/koobzaar/exalted/main/resources/cslol/cslol-dll.dll'
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`Created directory: ${dirPath}`)
  } else if (!fs.statSync(dirPath).isDirectory()) {
    throw new Error(`${dirPath} exists but is not a directory`)
  }
}

async function downloadRequiredFile(filename: string, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = path.join(CSLOL_FOLDER, filename)
    const fileStream = fs.createWriteStream(filePath)

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${filename}: ${response.statusCode}`))
          return
        }

        response.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          resolve()
        })
      })
      .on('error', (err) => {
        fs.unlink(filePath, () => {}) // Clean up failed download
        reject(err)
      })
  })
}
async function verifyAndDownloadRequiredFiles(): Promise<void> {
  // Ensure all necessary directories exist
  ensureDirectoryExists(CACHE_FOLDER)
  ensureDirectoryExists(CSLOL_FOLDER)

  for (const [filename, url] of Object.entries(REQUIRED_FILES)) {
    const filePath = path.join(CSLOL_FOLDER, filename)
    if (!fs.existsSync(filePath)) {
      console.log(`Downloading missing file: ${filename}`)
      try {
        await downloadRequiredFile(filename, url)
        console.log(`Successfully downloaded ${filename}`)
      } catch (error) {
        console.error(`Failed to download ${filename}:`, error)
        throw error
      }
    }
  }
}

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
    title: 'Select League of Legends.exe at League of Legends installation folder'
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await verifyAndDownloadRequiredFiles()
    await ensureLoLPath()
  } catch (error) {
    console.error('Initialization failed:', error)
    dialog.showErrorBox('Initialization Failed', `Error: ${error}`)
    app.quit()
    return
  }

  SKINS_CATALOG = await getCachedCatalog()

  if (!SKINS_CATALOG) {
    console.log('Cache not found or outdated. Fetching new data...')
    const skins = await getLoLSkins()
    SKINS_CATALOG = await processChampionSkins(skins)
    await updateCache(SKINS_CATALOG)
  }

  ipcMain.handle('get-lol-catalog', async () => {
    return SKINS_CATALOG
  })

  ipcMain.on('close-app', () => {
    app.quit()
  })

  ipcMain.on('minimize-app', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.handle('inject-skin', async (_, downloadURL: string) => {
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
    const { success, process } = await patchClientWithMod(patchOptions)
    if (success) {
      modToolsProcess = process
    }
    return success
  })

  ipcMain.handle('stop-injection', async () => {
    if (modToolsProcess) {
      modToolsProcess.kill()
      modToolsProcess = null
      return true
    }
    return false
  })

  await createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
