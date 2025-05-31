const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let win = null;
let tray = null;
let isOverlayVisible = true;

// 오버레이 창 생성 함수
function createOverlayWindow() {
  win = new BrowserWindow({
    width: 360,
    height: 220,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    fullscreenable: false,
    webPreferences: {
    preload: path.join(__dirname, 'renderer.js'),
    contextIsolation: false,
    nodeIntegration: true
    }
  });

  win.loadFile('index.html').then(() => {
  updateOverlayUI(); // 처음 뜰 때도 버튼 상태 반영
  });

  // 전체화면 위에서도 항상 보이도록 설정
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // 포커스를 잃었을 때도 항상 위에 있도록 설정 유지
  win.on('blur', () => {
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true);
  });

  // 다시 포커스 얻어도 유지
  win.on('focus', () => {
    win.setAlwaysOnTop(true, 'screen-saver'); 
  });

  // 창을 닫을 때 종료하지 않고 숨기도록 유지
  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
      isOverlayVisible = false;
      updateTrayMenu();
    }
  });
}

// 트레이 아이콘 및 메뉴 생성 함수
function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));

  tray.setToolTip('Electron 오버레이');
  updateTrayMenu();

  tray.on('click', () => {
    toggleOverlay(); // 클릭해도 온오프 가능
  });
}

// 오버레이 창을 보이거나 숨기는 함수
function toggleOverlay() {
  if (win) {
    if (isOverlayVisible) {
      win.hide();
    } else {
      win.show();
    }
    isOverlayVisible = !isOverlayVisible;
    updateTrayMenu();
    updateOverlayUI();
  }
}

// 랜더러에 오버레이 함수 전달
function updateOverlayUI() {
  if (win && win.webContents) {
    win.webContents.send('overlay-state', isOverlayVisible);
  }
}


// 트레이 메뉴 상태 업데이트
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isOverlayVisible ? '오버레이 끄기' : '오버레이 켜기',
      click: toggleOverlay
    },
    {
      label: '종료',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}

// 투명도 조절
ipcMain.on('set-opacity', (event, opacity) => {
  if (win) {
    win.setOpacity(opacity);
  }
});

// 창 숨기기
ipcMain.on('hide-window', () => {
  if (win) {
    win.hide();
    isOverlayVisible = false;
    updateTrayMenu();
  }
});

// 오버레이 토글
ipcMain.on('toggle-overlay', () => {
  toggleOverlay();
});


app.whenReady().then(() => {
  createOverlayWindow(); // 오버레이 창 생성
  createTray(); // 트레이 아이콘 생성
});
