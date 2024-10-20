import React, { useState, useEffect } from 'react'
import Skin from './components/Skin/Skin'
import './assets/App.css'

interface ProcessedSkin {
  skinName: string
  skinId: number
  downloadUrl: string
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
  skins: ProcessedSkin[]
}

const ipcHandle = async (): Promise<ProcessedChampion[]> => {
  const skins = await window.electron.ipcRenderer.invoke('get-lol-catalog')
  return skins as ProcessedChampion[]
}

const App = (): JSX.Element => {
  const [skins, setSkins] = useState<ProcessedChampion[]>([])

  useEffect(() => {
    ipcHandle()
      .then((skins) => {
        setSkins(skins)
      })
      .catch((error) => {
        console.error('Erro ao obter o catálogo de skins:', error)
      })
  }, [])
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
                <li key={champion.championName} className="champion-option">
                  <img
                    className="champion-square"
                    src={champion.championSquare}
                    alt={champion.championName}
                  />
                  <p>{champion.championName}</p>
                </li>
              ))}
            </ul>
          </aside>
          <section className="skins-list"></section>
        </main>
        <footer></footer>
      </div>
    </>
  )
}

export default App
