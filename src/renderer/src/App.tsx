import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Skin from './components/Skin/Skin'
import './assets/App.css'
import playButton from './assets/play-button-arrowhead.png'
import birds from './assets/birds.png'
import loading from './assets/loading.png'
import stop from './assets/stop.png'
import CustomAlert from './components/Alert/Alert'

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
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [injectionStatus, setInjectionStatus] = useState<'idle' | 'loading' | 'injected'>('idle')
  const [selection, setSelection] = useState<Selection>({
    championName: null,
    skinId: null,
    chromaId: null
  })
  const [selectedSkinUrl, setSelectedSkinUrl] = useState<string | null>(null)

  useEffect(() => {
    ipcHandle()
      .then((skins) => {
        setSkins(skins)
        if (skins.length > 0) {
          const firstChampion = skins[0]
          const firstSkin = firstChampion.skins[0]
          setSelection({
            championName: firstChampion.championName,
            skinId: firstSkin.skinId,
            chromaId: null
          })
          setSelectedSkinUrl(firstSkin.downloadUrl)
        }
      })
      .catch((error) => {
        console.error('Erro ao obter o catálogo de skins:', error)
      })
  }, [])

  const handleChampionClick = (championName: string): void => {
    setSelection((prev) => ({
      ...prev,
      championName,
      skinId: null,
      chromaId: null
    }))
  }

  const handleSkinClick = (skinId: number): void => {
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
      setSelectedSkinUrl(skin.downloadUrl)
    }
  }

  const handleChromaClick = (skinId: number, chromaId: number): void => {
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
      setSelectedSkinUrl(chroma.downloadUrl)
    }
  }
  const handleInjectClick = (): void => {
    if (selectedSkinUrl) {
      setInjectionStatus('loading')
      window.electron.ipcRenderer
        .invoke('inject-skin', selectedSkinUrl)
        .then((success) => {
          if (success) {
            setAlert({ type: 'success', message: 'Skin injected successfully!' })
            setInjectionStatus('injected')
          } else {
            setAlert({ type: 'error', message: 'Failed to inject skin. Please try again.' })
            setInjectionStatus('idle')
          }
          setTimeout(() => setAlert(null), 5000) // Hide alert after 5 seconds
        })
        .catch((error) => {
          console.error('Error injecting skin:', error)
          setAlert({ type: 'error', message: 'An error occurred while injecting the skin.' })
          setInjectionStatus('idle')
          setTimeout(() => setAlert(null), 5000)
        })
    } else {
      console.error('No skin URL selected')
      setAlert({ type: 'error', message: 'Please select a skin before injecting.' })
      setTimeout(() => setAlert(null), 5000)
    }
  }
  const handleStopClick = (): void => {
    window.electron.ipcRenderer
      .invoke('stop-injection')
      .then(() => {
        setInjectionStatus('idle')
        setAlert({ type: 'success', message: 'Injection stopped successfully.' })
      })
      .catch((error) => {
        console.error('Error stopping injection:', error)
        setAlert({ type: 'error', message: 'Failed to stop injection. Please try again.' })
      })
      .finally(() => {
        setTimeout(() => setAlert(null), 5000)
      })
  }
  const closeApp = (): void => {
    window.electron.ipcRenderer.send('close-app')
  }
  const minimizeApp = (): void => {
    window.electron.ipcRenderer.send('minimize-app')
  }
  return (
    <>
      <div id="exalted">
        <header>
          <div className="title">
            <div className="logo-title-wrapper">
              <img id="birds-logo" src={birds} alt="Birds" />
              <div>
                <h1>Exalted</h1>
                <p>A League of Legends skin changer</p>
              </div>
            </div>
          </div>
          <div className="close-minimize">
            <button className="minimize" onClick={minimizeApp}>
              <p>-</p>
            </button>
            <button className="close" onClick={closeApp}>
              <p>x</p>
            </button>
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
                <div className="blank_top"></div>
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
                <div className="blank_bottom"></div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
        <footer>
          <div className="info"></div>
          <div className="inject-button">
            {injectionStatus === 'idle' && (
              <button id="inject" onClick={handleInjectClick}>
                <img id="play-button" src={playButton} alt="Play button" />
              </button>
            )}
            {injectionStatus === 'loading' && (
              <button id="loading" disabled>
                <img id="loading-icon" src={loading} alt="Loading" />
              </button>
            )}
            {injectionStatus === 'injected' && (
              <button id="stop" onClick={handleStopClick}>
                <img id="stop-button" src={stop} alt="Stop button" />
              </button>
            )}
          </div>
        </footer>
        <AnimatePresence>
          {alert && (
            <CustomAlert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
export default App
