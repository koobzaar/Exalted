import { execFile, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs/promises'
import { app } from 'electron'

interface PatcherOptions {
  fantomeFilePath: string
  leagueOfLegendsPath: string
  cslolPath: string
  skipConflict?: boolean
  debugPatcher?: boolean
}

function getResourcePath(...args: string[]): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', ...args)
    : path.join(__dirname, '..', '..', 'resources', ...args)
}

async function patchClientWithMod(
  options: PatcherOptions
): Promise<{ success: boolean; process: ChildProcess | null }> {
  const {
    fantomeFilePath,
    leagueOfLegendsPath,
    skipConflict = false,
    debugPatcher = false
  } = options

  const cslolPath = getResourcePath('cslol')
  const modToolsPath = path.join(cslolPath, 'mod-tools.exe')
  const installedPath = path.join(cslolPath, 'installed')
  const profilesPath = path.join(cslolPath, 'profiles')

  // Remove contents of installed and profiles folders
  try {
    await fs.rm(installedPath, { recursive: true, force: true })
    await fs.rm(profilesPath, { recursive: true, force: true })
    console.log(`Deleted contents of ${installedPath} and ${profilesPath}`)
  } catch (deleteError) {
    console.error(`Error deleting contents of ${installedPath} or ${profilesPath}: ${deleteError}`)
  }

  // Recreate the directories
  await fs.mkdir(installedPath, { recursive: true })
  await fs.mkdir(profilesPath, { recursive: true })

  // 1. Import the mod
  const modName = path.basename(fantomeFilePath, path.extname(fantomeFilePath))
  const modInstallPath = path.join(installedPath, modName)

  await execPromise(modToolsPath, [
    'import',
    fantomeFilePath,
    modInstallPath,
    `--game:${leagueOfLegendsPath}`
  ])

  // 2. Create and save the profile
  const profileName = 'Default Profile'
  const profilePath = path.join(profilesPath, profileName)
  const profileConfigPath = `${profilePath}.config`

  await fs.writeFile(path.join(cslolPath, 'current.profile'), profileName)

  // 3. Create the overlay
  await execPromise(modToolsPath, [
    'mkoverlay',
    installedPath,
    profilePath,
    `--game:${leagueOfLegendsPath}`,
    `--mods:${modName}`,
    skipConflict ? '--ignoreConflict' : ''
  ])

  // 4. Run the patcher
  return new Promise<{ success: boolean; process: ChildProcess | null }>((resolve) => {
    const runOverlayProcess: ChildProcess = execFile(
      modToolsPath,
      [
        'runoverlay',
        profilePath,
        profileConfigPath,
        `--game:${leagueOfLegendsPath}`,
        `--opts:${debugPatcher ? 'debugpatcher' : 'none'}`
      ],
      (error) => {
        if (error) {
          console.error('Patcher execution failed:', error)
          resolve({ success: false, process: null })
        }
      }
    )

    // If the process is still running after a short delay, consider it successful
    setTimeout(() => {
      if (!runOverlayProcess.killed) {
        console.log('Patcher executed successfully')
        resolve({ success: true, process: runOverlayProcess })
      }
    }, 2000) // 2 seconds delay
  })
}

function execPromise(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

export default patchClientWithMod
