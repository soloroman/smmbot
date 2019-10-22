const electron = require("electron");
const url = require("url");
const path = require("path");
const fs = require('fs');
var execPhp = require('exec-php');
var shell = require('shelljs');

process.env.NODE_ENV = 'development';
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let loginWindow;
let schemeWindow;
let instagramPath = __dirname+"/cache/instagram.json";
let cachePath = __dirname+"/cache/";

function createInstagramWindow(){
    loginWindow = new BrowserWindow({ width: 400, height:513, resizable: false, maximizable: false, fullscreen: false});

    loginWindow.loadURL(url.format({
        pathname: path.join(__dirname, "login_win.html"),
        protocol: "file:",
        slashes: true
    }));
    loginWindow.on('close', function(){
        loginWindow = null;
    });
}

function createMainWindow(){
    mainWindow = new BrowserWindow({ width: 800, height:600, minWidth: 420, minHeight: 500, maximizable: false, fullscreen: false});

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "main_win.html"),
        protocol: "file:",
        slashes: true
    }));
    mainWindow.on('close', function(){
        mainWindow = null;
    });
}

function createSchemeWindow(){
  schemeWindow = new BrowserWindow({ width: 800, height:600, minWidth: 400, minHeight: 500, maximizable: false, fullscreen: false});

  schemeWindow.loadURL(url.format({
      pathname: path.join(__dirname, "scheme_win.html"),
      protocol: "file:",
      slashes: true
  }));
  schemeWindow.on('close', function(){
    schemeWindow = null;
  });
}

function writeCache(path, account){                         //account format: {username: "username", password: "password"}
  let data;
  var acc_exists;
  if (fs.existsSync(path) == false) {                       //check if exists path, else 
    fs.mkdirSync(cachePath);
    fs.closeSync(fs.openSync(path, 'w'));                   //path created
    writeCache(path, account);
  }else if (account !== "donot_execute"){
    data = fs.readFileSync(path,'utf8');                     //put contents of path in data
    if(data == "" || typeof data == "undefined"){            //check for empty
      fs.writeFileSync(path, JSON.stringify({instagram:[]}));//write pattern to path
      writeCache(path, account);
    }else{
      data = JSON.parse(fs.readFileSync(path,'utf8'));
      if (fs.readFileSync(path,'utf8') == '{"instagram":[]}') {
        fs.writeFileSync(path, JSON.stringify({instagram:[account]}))
        writeCache(path, "donot_execute");
      }else if (account !== "donot_execute"){
        for(var i = 0; i < data.instagram.length; i++){
          if(data.instagram[i].username == account.username){
            acc_exists = true;
            break;
          }
        }
        if (acc_exists !== true) {
          data.instagram.push(account);
          fs.writeFileSync(path, JSON.stringify(data));
        }
      }
    }
  }
}

function readCache(path, index){
  if (fs.existsSync(path) == true) {
    var data = fs.readFileSync(path,'utf8');
    if (data !== "" || typeof data !== "undefined") {
      if (JSON.parse(fs.readFileSync(path,'utf8'))){
        data = JSON.parse(fs.readFileSync(path,'utf8'));
        if (typeof data.instagram !== "undefined") {
          var count = 0;
          data.instagram.forEach(element => {
            count++;
          });
          if(typeof index == "undefined"){
            return{
              count: count,
              array: data.instagram
            }
          }else{
            var i = 0;
            var byindex;
            for(var key in data.instagram){
              i++;
              if (index == i) {
                byindex = data.instagram[key];
              }
            }
            return{
              count: count,
              array: data.instagram,
              byindex: byindex
            }
          }
        }else{
          console.log("data.instagram IS UNDEFINED!")
        }
      }else{
        console.log("JSON COULD NOT BE PARSED!");
      }
    }else{
      console.log("data IS UNDEFINED OR EMPTY!");
    }
  }else{
    console.log("NO CACHE FOUND! at " + path);
  }
}

function clearCache(){
  shell.rm('-fr', cachePath);
} 


function removeFromCache(username){
  var arr = readCache(instagramPath ,username).array;
  var arr2 = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].username !== username) {
      arr2.push(arr[i]);
    }
  }
  if(arr2.length == 0){
    for (let j = 0; j < (arr2.length + 1); j++) {
      clearCache();
      writeCache(instagramPath, "donot_execute");
    }
  }else{
    for (let j = 0; j < arr2.length; j++) {
      clearCache();
      writeCache(instagramPath, arr2[j]);
    }
  }
}

app.on("ready", function(){
    if (fs.existsSync(instagramPath)) {
        createMainWindow();
      }else{
        createInstagramWindow();
      }
      
    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);
});


ipcMain.on('account:add', function(e, username, password){
    // mainWindow.webContents.send('account:add', username, password);
    // Still have a reference to addWindow in memory. Need to reclaim memory (Grabage collection)
    writeCache(instagramPath, {username: username, password: password});
    execPhp('instagram.php', function(error, php, outprint){
      // outprint is now `One'.
      php.instagram(username, password, function(err, result, output, printed){
        createMainWindow();
        loginWindow.close();
        loginWindow = null;
        console.log(printed);
      });
    });
});

  ipcMain.on("callAddWindow", function (e) {
    createInstagramWindow();
    mainWindow.close();
    mainWindow = null;
  });

  ipcMain.on("deleteAcc", function(e, username){
    removeFromCache(username);
  });

  ipcMain.on("callSchemeWindow", function (e) {
    createSchemeWindow();
    //schemeWindow.webContents.send(username,cachePath + username + ".json");
  });
  
  // Create menu template
const mainMenuTemplate =  [
    // Each object is a dropdown
    {
      label: 'Программа',
      submenu:[
        {
          label: 'Закрыть',
          accelerator:process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
          click(){
            app.quit();
          }
        }
      ]
    }
  ];
  
  // If OSX, add empty object to menu
  if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({});
  }
  
  // Add developer tools option if in dev
  if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
      label: 'Developer Tools',
      submenu:[
        {
          role: 'reload'
        },
        {
          label: 'Toggle DevTools',
          accelerator:process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
          click(item, focusedWindow){
            focusedWindow.toggleDevTools();
          }
        }
      ]
    });
  }