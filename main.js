// Modules to control application life and create native browser window
const {app, BrowserWindow,  Tray, nativeImage, Menu,   ipcMain} = require('electron')
const path = require('path')
const fs = require('fs');
const https = require('https');

var handleGetPics = ()=> {
  return new Promise((resolve, reject) => {

    const options = {
      hostname: 'picsum.photos',
      port: 443,
      path: '/v2/list',
      method: 'GET',
    };

    const req =  https.request(options, res => {

      console.log(`statusCode: ${res.statusCode}`);

      var data = [];
      res.on('data', d => {
        data.push(d);
      });
      res.on('end', () => {
        try {
          let buff = Buffer.concat(data).toString();
          // process.stdout.write(buff);
          buff = JSON.parse(buff);
          resolve(buff);
        } catch(e) {
          reject(e);
        }
      });
    });

    req.on('error', error => {
      console.error(error);
      reject(error);
    });

    req.end();
  });
};

async function handleGetDir(dirPath = __dirname) {
  let dir = [];
  try {
    for (let file of  await fs.promises.readdir(path.join(dirPath),  { withFileTypes: true})) {
      dir.push({name: file.name, isDirectory: file.isDirectory()})
    }
  } catch (e) {
    dir = [];
    console.log("Error in 'directory:getDirectory", e);
  } finally {
  }
  return {dir, dirPath};
}

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  handleGetPics(mainWindow);
  // handleGetPics(mainWindow);
  return mainWindow;
}

const iconName = path.join(__dirname, 'iconForDragAndDrop.png');
const icon = fs.createWriteStream(iconName);

fs.writeFileSync(path.join(__dirname, 'drag-and-drop.md'), '#  File to test drag and drop');

https.get('https://img.icons8.com/ios/452/drag-and-drop.png', (response) => {
  response.pipe(icon);
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  let win = createWindow();

  ipcMain.handle('get-pics', handleGetPics)
  ipcMain.handle('get-directory', (event, dirPath) => handleGetDir(dirPath));
  ipcMain.on('dragstart', (event, filePath) => {
    event.sender.startDrag({
      file: filePath, // path.join(__dirname, filePath),
      icon: iconName,
    })
  });


  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
