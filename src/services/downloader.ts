import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'

async function downloadFile(url: string): Promise<string> {
  const fileName = path.basename(url)
  const outputFolder = './resources/fantome_files/'
  const filePath = path.join(outputFolder, fileName)

  try {
    // Clean up the fantome_files directory if it exists
    if (fs.existsSync(outputFolder)) {
      const files = await fsPromises.readdir(outputFolder)
      for (const file of files) {
        await fsPromises.unlink(path.join(outputFolder, file))
      }
      console.log(`Cleaned up directory: ${outputFolder}`)
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputFolder)) {
      await fsPromises.mkdir(outputFolder, { recursive: true })
      console.log(`Directory created: ${outputFolder}`)
    }

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
    console.error(`Error downloading file from URL ${url}:`, error)
    throw error
  }
}

export default downloadFile
