import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Skin from './components/Skin/Skin'
import './assets/App.css'
import playButton from './assets/play-button-arrowhead.png'

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

interface Selection {
  championName: string | null
  skinId: number | null
  chromaId: number | null
}

const ipcHandle = async (): Promise<ProcessedChampion[]> => {
  const skins = await window.electron.ipcRenderer.invoke('get-lol-catalog')
  return skins as ProcessedChampion[]
}

const App = (): JSX.Element => {
  const [skins, setSkins] = useState<ProcessedChampion[]>([])
  const [selection, setSelection] = useState<Selection>({
    championName: null,
    skinId: null,
    chromaId: null
  })

  useEffect(() => {
    ipcHandle()
      .then((skins) => {
        setSkins(skins)
      })
      .catch((error) => {
        console.error('Erro ao obter o catálogo de skins:', error)
      })
  }, [])

  const handleChampionClick = (championName: string) => {
    setSelection((prev) => ({
      ...prev,
      championName,
      skinId: null,
      chromaId: null
    }))
  }

  const handleSkinClick = (skinId: number) => {
    setSelection((prev) => ({
      ...prev,
      skinId,
      chromaId: null
    }))

    // Find and log the download URL
    const champion = skins.find((c) => c.championName === selection.championName)
    const skin = champion?.skins.find((s) => s.skinId === skinId)
    if (skin) {
      console.log('Skin download URL:', skin.downloadUrl)
    }
  }

  const handleChromaClick = (skinId: number, chromaId: number) => {
    setSelection((prev) => ({
      ...prev,
      skinId,
      chromaId
    }))

    // Find and log the download URL
    const champion = skins.find((c) => c.championName === selection.championName)
    const skin = champion?.skins.find((s) => s.skinId === skinId)
    const chroma = skin?.chromas?.find((c) => c.chromaId === chromaId)
    if (chroma) {
      console.log('Chroma download URL:', chroma.downloadUrl)
    }
  }

  return (
    <>
      <div id="exalted">
        <header>
          <div className="title">
            <h1>Exalted</h1>
            <p>A League of Legends skin changer</p>
          </div>
          <div className="close-minimize">
            <button className="minimize"></button>
            <button className="close" onClick={() => console.log('close')}></button>
          </div>
        </header>
        <main>
          <aside className="champions-list">
            <ul className="champions">
              {skins.map((champion) => (
                <motion.li
                  key={champion.championName}
                  className={`champion-option ${selection.championName === champion.championName ? 'selected' : ''}`}
                  onClick={() => handleChampionClick(champion.championName)}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="champion-square-holder">
                    <img
                      className="champion-square"
                      src={champion.championSquare}
                      alt={champion.championName}
                    />
                  </div>
                  <p id="champion-name">{champion.championName}</p>
                </motion.li>
              ))}
            </ul>
          </aside>
          <AnimatePresence mode="wait">
            {selection.championName && (
              <motion.section
                className="skins-list"
                key={selection.championName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {skins
                  .find((champion) => champion.championName === selection.championName)
                  ?.skins.map((skin) => (
                    <motion.div
                      key={skin.skinId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'contents' }}
                    >
                      <Skin
                        backgroundImage={skin.loadingScreenUrl}
                        chromas={skin.chromas || []}
                        skinId={skin.skinId}
                        isSelected={selection.skinId === skin.skinId}
                        selectedChromaId={selection.chromaId}
                        onSkinClick={handleSkinClick}
                        onChromaClick={handleChromaClick}
                      />
                    </motion.div>
                  ))}
              </motion.section>
            )}
          </AnimatePresence>
        </main>
        <footer>
          <div className="info"></div>
          <div className="inject-button">
            <button id="inject" onClick={() => console.log('inject')}>
              <img id="play-button" src={playButton} alt="Play button" />
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}

export default App
