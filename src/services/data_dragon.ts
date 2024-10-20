import axios from 'axios'
import fs from 'fs'
import path from 'path'

interface SkinInfo {
  name: string
  downloadUrl: string
}

interface ChampionSkins {
  [championId: number]: SkinInfo[]
}

interface Chroma {
  id: number
  colors: string[]
  downloadUrl: string
}

interface DataDragonSkin {
  id: number
  name: string
  chromas?: Chroma[]
}

interface ChampionData {
  id: number
  name: string
  alias: string
  skins: DataDragonSkin[]
}

interface ProcessedSkin {
  skinName: string
  skinId: number
  downloadUrl: string
  loadingScreenUrl: string
  chromas?: {
    chromaId: number
    chromaColors: string[]
    downloadUrl: string
  }[]
}

interface ProcessedChampion {
  championName: string
  championKey: number
  championSquare: string
  championAlias: string
  skins: ProcessedSkin[]
}

const resourcesDir = './resources/data_dragon'

function ensureDirectoryExistence(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Diretório criado: ${dir}`)
  }
}

async function downloadJsonIfNotExists(url: string, filePath: string): Promise<void> {
  ensureDirectoryExistence(path.dirname(filePath))

  if (!fs.existsSync(filePath)) {
    console.log(`Arquivo não encontrado em ${filePath}. Baixando...`)
    const response = await axios.get(url)
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2))
    console.log(`Arquivo salvo em ${filePath}`)
  } else {
    console.log(`Arquivo já existe em ${filePath}. Pulando download.`)
  }
}

function getLoadingScreenUrl(championAlias: string, skinId: number): string {
  // Convert skinId to remove leading zero if less than 10
  const formattedSkinId = skinId.toString()
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championAlias}_${formattedSkinId}.jpg`
}

async function processChampionSkins(championSkins: ChampionSkins): Promise<ProcessedChampion[]> {
  const processedSkinsArray: ProcessedChampion[] = []
  console.log('Iniciando processamento de skins dos campeões')

  for (const [championIdStr, skins] of Object.entries(championSkins)) {
    const championId = parseInt(championIdStr)
    console.log(`Processando skins para o campeão com ID: ${championId}`)
    const championData = await getChampionData(championId)
    if (!championData) {
      console.log(`Dados do campeão não encontrados para o ID: ${championId}`)
      continue
    }

    const championName = championData.name
    const championAlias = championData.alias
    const processedSkins: ProcessedSkin[] = []
    console.log(`Nome do campeão: ${championName}, Alias: ${championAlias}`)

    for (const skin of skins) {
      const skinId = parseInt(skin.name.replace('.fantome', ''))
      console.log(`Processando skin com ID: ${skinId}`)

      const dataDragonSkin = championData.skins.find((s: DataDragonSkin) => {
        const dataDragonSkinIdStr = s.id.toString()
        const championIdLength = championId.toString().length
        const skinIdFromDataDragon = parseInt(dataDragonSkinIdStr.slice(championIdLength))

        return skinIdFromDataDragon === skinId
      })

      if (dataDragonSkin) {
        const processedSkin: ProcessedSkin = {
          skinName: dataDragonSkin.name,
          skinId: skinId,
          downloadUrl: skin.downloadUrl,
          loadingScreenUrl: getLoadingScreenUrl(championAlias, skinId)
        }
        console.log(`Skin encontrada: ${dataDragonSkin.name}`)

        if (dataDragonSkin.chromas && dataDragonSkin.chromas.length > 0) {
          processedSkin.chromas = dataDragonSkin.chromas.map((chroma) => {
            const championIdLength = championId.toString().length
            const parsedChromaID = parseInt(chroma.id.toString().slice(championIdLength))
            return {
              chromaId: parsedChromaID,
              chromaColors: chroma.colors,
              downloadUrl: `https://raw.githubusercontent.com/koobzaar/lol-skins-developer/main/${championId}/${parsedChromaID}.fantome`
            }
          })
          console.log(
            `${processedSkin.chromas.length} chromas encontrados para a skin: ${dataDragonSkin.name}`
          )
        }

        processedSkins.push(processedSkin)
      } else {
        console.log(`Skin com ID ${skinId} não encontrada para o campeão ${championName}`)
      }
    }

    const championSquare = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`
    processedSkinsArray.push({
      championName,
      championKey: championId,
      championSquare,
      championAlias,
      skins: processedSkins
    })
  }

  processedSkinsArray.sort((a, b) => a.championName.localeCompare(b.championName))

  console.log('Processamento de skins dos campeões concluído')
  return processedSkinsArray
}

async function getChampionData(championId: number): Promise<ChampionData | null> {
  try {
    console.log(`Buscando dados do campeão para o ID: ${championId}`)
    const championSummaryUrl =
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json'
    const championSummaryPath = path.join(resourcesDir, 'champion-summary.json')
    await downloadJsonIfNotExists(championSummaryUrl, championSummaryPath)
    const championSummary = JSON.parse(fs.readFileSync(championSummaryPath, 'utf-8')).find(
      (champion: ChampionData) => champion.id === championId
    )

    if (!championSummary) {
      console.error(`Campeão com ID ${championId} não encontrado no resumo`)
      return null
    }

    const championDataUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/${championId}.json`
    const championDataPath = path.join(resourcesDir, `champion-${championId}.json`)
    await downloadJsonIfNotExists(championDataUrl, championDataPath)
    const championData = JSON.parse(fs.readFileSync(championDataPath, 'utf-8'))
    console.log(`Dados do campeão obtidos para o ID: ${championId}`)
    return { ...championData, alias: championSummary.alias }
  } catch (error) {
    console.error(`Erro ao buscar dados do campeão para o ID ${championId}:`, error)
    return null
  }
}

export default processChampionSkins
