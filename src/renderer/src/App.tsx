import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Skin from './components/Skin/Skin'
import './assets/App.css'

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

const ipcHandle = async (): Promise<ProcessedChampion[]> => {
  const skins = await window.electron.ipcRenderer.invoke('get-lol-catalog')
  return skins as ProcessedChampion[]
}

const App = (): JSX.Element => {
  const [skins, setSkins] = useState<ProcessedChampion[]>([])
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null)

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
    setSelectedChampion(championName)
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
            <button
              className="close"
              onClick={() => {
                console.log('close')
              }}
            ></button>
          </div>
        </header>
        <main>
          <aside className="champions-list">
            <ul className="champions">
              {skins.map((champion) => (
                <motion.li
                  key={champion.championName}
                  className={`champion-option ${selectedChampion === champion.championName ? 'selected' : ''}`}
                  onClick={() => handleChampionClick(champion.championName)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="champion-square-holder">
                    <img
                      className="champion-square"
                      src={champion.championSquare}
                      alt={champion.championName}
                    />
                  </div>
                  <p>{champion.championName}</p>
                </motion.li>
              ))}
            </ul>
          </aside>
          <AnimatePresence mode="wait">
            {selectedChampion && (
              <motion.section
                className="skins-list"
                key={selectedChampion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {skins
                  .find((champion) => champion.championName === selectedChampion)
                  ?.skins.map((skin) => (
                    <motion.div
                      key={skin.skinId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'contents' }}
                    >
                      <Skin backgroundImage={skin.loadingScreenUrl} chromas={skin.chromas || []} />
                    </motion.div>
                  ))}
              </motion.section>
            )}
          </AnimatePresence>
        </main>
        <footer></footer>
      </div>
    </>
  )
}

export default App
