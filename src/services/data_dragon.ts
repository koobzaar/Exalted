import axios from 'axios'
import fs from 'fs'
import path from 'path'
/*
  TODO: THIS METHOD NEEDS TO BE REWORKED TO A MORE OPTIMIZED WAY.
*/
interface SkinInfo {
  name: string
  downloadUrl: string
}

interface ChampionSkins {
  [championId: string]: SkinInfo[]
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
  skins: DataDragonSkin[]
}

interface ProcessedSkin {
  skinName: string
  skinId: string
  downloadUrl: string
  chromas?: {
    chromaId: number
    chromaColors: string[]
    downloadUrl: string
  }[]
}

interface ProcessedChampionSkins {
  [championName: string]: ProcessedSkin[]
}

const resourcesDir = './resources/data_dragon'

// Função para garantir que o diretório existe
function ensureDirectoryExistence(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Diretório criado: ${dir}`)
  }
}

async function downloadJsonIfNotExists(url: string, filePath: string): Promise<void> {
  ensureDirectoryExistence(path.dirname(filePath)) // Garante que o diretório existe

  if (!fs.existsSync(filePath)) {
    console.log(`Arquivo não encontrado em ${filePath}. Baixando...`)
    const response = await axios.get(url)
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2))
    console.log(`Arquivo salvo em ${filePath}`)
  } else {
    console.log(`Arquivo já existe em ${filePath}. Pulando download.`)
  }
}

async function processChampionSkins(championSkins: ChampionSkins): Promise<ProcessedChampionSkins> {
  const processedSkins: ProcessedChampionSkins = {}
  console.log('Iniciando processamento de skins dos campeões')

  for (const [championId, skins] of Object.entries(championSkins)) {
    console.log(`Processando skins para o campeão com ID: ${championId}`)
    const championData = await getChampionData(championId)
    if (!championData) {
      console.log(`Dados do campeão não encontrados para o ID: ${championId}`)
      continue
    }

    const championName = championData.name
    processedSkins[championName] = []
    console.log(`Nome do campeão: ${championName}`)

    for (const skin of skins) {
      const skinId = skin.name.replace('.fantome', '')
      console.log(`Processando skin com ID: ${skinId}`)
      const dataDragonSkin = championData.skins.find((s: DataDragonSkin) =>
        s.id.toString().endsWith(skinId)
      )

      if (dataDragonSkin) {
        const processedSkin: ProcessedSkin = {
          skinName: dataDragonSkin.name,
          skinId: skinId,
          downloadUrl: skin.downloadUrl
        }
        console.log(`Skin encontrada: ${dataDragonSkin.name}`)

        if (dataDragonSkin.chromas && dataDragonSkin.chromas.length > 0) {
          processedSkin.chromas = dataDragonSkin.chromas.map((chroma) => {
            const parsedChromaID = parseInt(chroma.id.toString().slice(championId.length))
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

        processedSkins[championName].push(processedSkin)
      } else {
        console.log(`Skin com ID ${skinId} não encontrada para o campeão ${championName}`)
      }
    }
  }

  console.log('Processamento de skins dos campeões concluído')
  return processedSkins
}

async function getChampionData(championId: string): Promise<ChampionData | null> {
  try {
    console.log(`Buscando dados do campeão para o ID: ${championId}`)
    const championSummaryUrl =
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json'
    const championSummaryPath = path.join(resourcesDir, 'champion-summary.json')
    await downloadJsonIfNotExists(championSummaryUrl, championSummaryPath)
    const championSummary = JSON.parse(fs.readFileSync(championSummaryPath, 'utf-8')).find(
      (champion: ChampionData) => champion.id.toString() === championId
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
    return championData
  } catch (error) {
    console.error(`Erro ao buscar dados do campeão para o ID ${championId}:`, error)
    return null
  }
}

export default processChampionSkins
