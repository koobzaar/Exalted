import { execFile } from 'child_process'
import * as path from 'path'
import * as fs from 'fs/promises'

interface PatcherOptions {
  fantomeFilePath: string
  leagueOfLegendsPath: string
  cslolPath: string
  skipConflict?: boolean
  debugPatcher?: boolean
}

async function patchClientWithMod(options: PatcherOptions): Promise<void> {
  const {
    fantomeFilePath,
    leagueOfLegendsPath,
    cslolPath,
    skipConflict = false,
    debugPatcher = false
  } = options

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
  await execPromise(modToolsPath, [
    'runoverlay',
    profilePath,
    profileConfigPath,
    `--game:${leagueOfLegendsPath}`,
    `--opts:${debugPatcher ? 'debugpatcher' : 'none'}`
  ])
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
