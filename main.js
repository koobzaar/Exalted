// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const ipcMain = require('electron').ipcMain
const createWindow = () => {
  // Create the browser window.
  const sulfurWindow = new BrowserWindow({
    width: 723,
    height: 522,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  sulfurWindow.loadFile('src/index/index.html')

  // Open the DevTools.
  sulfurWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('myfunc', async (event, arg) => {
    return new Promise(function(resolve, reject) {
      // do stuff
      if (true) {
          resolve("this worked!");
      } else {
          reject("this didn't work!");
      }
    });  
  });