import React, { useState, useEffect } from 'react'
import Skin from './components/Skin/Skin'
import './assets/App.css'

type LoLSkinCatalog = {
  id: {
    name: string
    downloadUrl: string
  }
}

const ipcHandle = async (): Promise<LoLSkinCatalog[]> => {
  const skins = await window.electron.ipcRenderer.invoke('get-lol-catalog')
  return skins as LoLSkinCatalog[]
}

const App = (): JSX.Element => {
  const [skins, setSkins] = useState<LoLSkinCatalog[]>([])
  console.log(skins)
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
        <header></header>
        <main>
          <aside className="champions-list"></aside>
          <section className="skins-list"></section>
        </main>
        <footer></footer>
      </div>
    </>
  )
}

export default App
