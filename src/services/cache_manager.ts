import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const CACHE_FILE = path.resolve(__dirname, '../../resources/cache/cache.json')
const GITHUB_API_URL = 'https://api.github.com/repos/koobzaar/lol-skins-developer/commits/main'

interface Cache {
  lastCommitSha: string
  catalog: any
}

export async function getCachedCatalog(): Promise<any> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache: Cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      const latestCommit = await getLatestCommitSha()

      if (cache.lastCommitSha === latestCommit) {
        console.log('Using cached catalog')
        return cache.catalog
      }
    }
  } catch (error) {
    console.error('Error reading cache file:', error)
  }

  return null
}

export async function updateCache(catalog: any): Promise<void> {
  try {
    const latestCommit = await getLatestCommitSha()
    const cache: Cache = {
      lastCommitSha: latestCommit,
      catalog: catalog
    }

    const cacheDir = path.dirname(CACHE_FILE)
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
    console.log('Cache updated at:', CACHE_FILE)
    console.log('Full path of cache file:', CACHE_FILE) // Adicione esta linha para imprimir o caminho completo
  } catch (error) {
    console.error('Error updating cache:', error)
  }
}

async function getLatestCommitSha(): Promise<string> {
  try {
    const response = await axios.get(GITHUB_API_URL)
    return response.data.sha
  } catch (error) {
    console.error('Error fetching latest commit:', error)
    throw error
  }
}
