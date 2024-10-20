import axios from 'axios'

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

function getLoadingScreenUrl(championAlias: string, skinId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championAlias}_${skinId}.jpg`
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await axios.get<T>(url)
  return response.data
}

async function processChampionSkins(championSkins: ChampionSkins): Promise<ProcessedChampion[]> {
  const startTime = Date.now()
  console.log('Starting champion skins processing...')

  const championSummaryUrl =
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json'
  const championSummaryData = await fetchJson<ChampionData[]>(championSummaryUrl)

  const totalChampions = Object.keys(championSkins).length
  console.log(`Processing ${totalChampions} champions`)

  const processedSkinsArray = await Promise.all(
    Object.entries(championSkins).map(async ([championIdStr, skins]) => {
      const championId = parseInt(championIdStr)

      const championSummary = championSummaryData.find((champion) => champion.id === championId)
      if (!championSummary) {
        console.warn(`Champion data not found for ID: ${championId}`)
        return null
      }

      const championDataUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/${championId}.json`
      const championData = await fetchJson<ChampionData>(championDataUrl)

      const processedSkins = skins
        .map((skin: SkinInfo) => {
          const skinId = parseInt(skin.name.replace('.fantome', ''))
          const dataDragonSkin = championData.skins.find((s: DataDragonSkin) => {
            const dataDragonSkinIdStr = s.id.toString()
            const championIdLength = championId.toString().length
            const skinIdFromDataDragon = parseInt(dataDragonSkinIdStr.slice(championIdLength))
            return skinIdFromDataDragon === skinId
          })

          if (!dataDragonSkin) return null

          const processedSkin: ProcessedSkin = {
            skinName: dataDragonSkin.name,
            skinId: skinId,
            downloadUrl: skin.downloadUrl,
            loadingScreenUrl: getLoadingScreenUrl(championSummary.alias, skinId)
          }

          if (dataDragonSkin.chromas?.length) {
            processedSkin.chromas = dataDragonSkin.chromas.map((chroma) => {
              const championIdLength = championId.toString().length
              const parsedChromaID = parseInt(chroma.id.toString().slice(championIdLength))
              return {
                chromaId: parsedChromaID,
                chromaColors: chroma.colors,
                downloadUrl: `https://raw.githubusercontent.com/koobzaar/lol-skins-developer/main/${championId}/${parsedChromaID}.fantome`
              }
            })
          }

          return processedSkin
        })
        .filter((skin: ProcessedSkin): skin is ProcessedSkin => skin !== null)

      return {
        championName: championData.name,
        championKey: championId,
        championSquare: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`,
        championAlias: championSummary.alias,
        skins: processedSkins
      }
    })
  )

  const validProcessedSkins = processedSkinsArray.filter(
    (item): item is ProcessedChampion => item !== null
  )
  validProcessedSkins.sort((a, b) => a.championName.localeCompare(b.championName))

  const totalSkins = validProcessedSkins.reduce((acc, champion) => acc + champion.skins.length, 0)
  const totalChromas = validProcessedSkins.reduce(
    (acc, champion) =>
      acc + champion.skins.reduce((chromaAcc, skin) => chromaAcc + (skin.chromas?.length || 0), 0),
    0
  )

  const processingTime = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`Processing completed in ${processingTime}s`)
  console.log(`Summary:
Champions processed: ${validProcessedSkins.length}/${totalChampions}
Total skins: ${totalSkins}
Total chromas: ${totalChromas}`)

  return validProcessedSkins
}

export default processChampionSkins
