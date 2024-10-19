import axios from 'axios'
import fs from 'fs'
import path from 'path'

async function downloadFile(url: string): Promise<string> {
  const fileName = path.basename(url)
  const outputFolder = './resources/fantome_files/'
  const filePath = path.join(outputFolder, fileName)

  // Garante que o diretório existe
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true })
    console.log(`Diretório criado: ${outputFolder}`)
  }

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    })

    const writer = fs.createWriteStream(filePath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath))
      writer.on('error', reject)
    })
  } catch (error) {
    console.error(`Erro ao baixar o arquivo da URL ${url}:`, error)
    throw error
  }
}

export default downloadFile
