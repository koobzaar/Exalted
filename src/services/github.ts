import axios from 'axios'

interface SkinInfo {
  name: string
  downloadUrl: string
}

interface ChampionSkins {
  [championId: string]: SkinInfo[]
}

async function getLoLSkins(
  owner: string = 'koobzaar',
  repo: string = 'lol-skins-developer'
): Promise<ChampionSkins> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`
    const response = await axios.get(url)
    const tree = response.data.tree

    const championSkins: ChampionSkins = {}

    tree.forEach((item: { path: string; type: string }) => {
      if (item.type === 'blob' && item.path.endsWith('.fantome')) {
        const [championId, skinName] = item.path.split('/')
        if (!championSkins[championId]) {
          championSkins[championId] = []
        }
        const downloadUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${championId}/${skinName}`
        championSkins[championId].push({
          name: skinName,
          downloadUrl: downloadUrl
        })
      }
    })

    return championSkins
  } catch (error) {
    console.error('Error fetching LoL skins:', error)
    throw error
  }
}

export default getLoLSkins
