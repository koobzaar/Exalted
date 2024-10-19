import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): JSX.Element {
  // Defina o tipo LoLSkins
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

  const handleClick = (): void => {
    ipcHandle()
      .then((skins) => {
        console.log(skins)
      })
      .catch((error) => {
        console.error('Erro ao obter o catálogo de skins:', error)
      })
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={handleClick}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
