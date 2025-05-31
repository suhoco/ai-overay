const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let main_win = null;
let overlay_win = null;
let tray = null;
let isOverlayVisible = true;

// 메인 창 생성 함수
function createMainWindow() {
  main_win = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    frame: true, // 이후 커스텀 버튼으로 변경 예정
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  main_win.loadFile('main.html');
}


// 오버레이 창 생성 함수
function createOverlayWindow() {
  overlay_win = new BrowserWindow({
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

  overlay_win.loadFile('index.html').then(() => {
  updateOverlayUI(); // 처음 뜰 때도 버튼 상태 반영
  });

  // 전체화면 위에서도 항상 보이도록 설정
  overlay_win.setAlwaysOnTop(true, 'screen-saver');
  overlay_win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // 포커스를 잃었을 때도 항상 위에 있도록 설정 유지
  overlay_win.on('blur', () => {
    overlay_win.setAlwaysOnTop(true, 'screen-saver');
    overlay_win.setVisibleOnAllWorkspaces(true);
  });

  // 다시 포커스 얻어도 유지
  overlay_win.on('focus', () => {
    overlay_win.setAlwaysOnTop(true, 'screen-saver');
  });

  // 창을 닫을 때 종료하지 않고 숨기도록 유지
  overlay_win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      overlay_win.hide();
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
  if (overlay_win) {
    if (isOverlayVisible) {
      overlay_win.hide();
    } else {
      overlay_win.show();
    }
    isOverlayVisible = !isOverlayVisible;
    updateTrayMenu();
    updateOverlayUI();
  }
}

// 랜더러에 오버레이 함수 전달
function updateOverlayUI() {
  if (overlay_win && overlay_win.webContents) {
    overlay_win.webContents.send('overlay-state', isOverlayVisible);
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

// 메인에서 오버레이 화면으로 이동(임시)
ipcMain.on('open-overlay', () => {
  if (!overlay_win) {
    createOverlayWindow();
  } else {
    overlay_win.show();
  }

  if (main_win) {
    main_win.hide();
  }
});


// 투명도 조절
ipcMain.on('set-opacity', (event, opacity) => {
  if (overlay_win) {
    overlay_win.setOpacity(opacity);
  }
});

// 창 숨기기
ipcMain.on('hide-window', () => {
  if (overlay_win) {
    overlay_win.hide();
    isOverlayVisible = false;
    updateTrayMenu();
  }
});

// 오버레이 토글
ipcMain.on('toggle-overlay', () => {
  toggleOverlay();
});

// 오버레이에서 메인으로 이동(임시)
ipcMain.on('open-Main', () => {
  if (!main_win) {
    createMainWindow();
  } else {
    main_win.show();
  }

  if (main_win) {
    overlay_win.hide();
  }
});


app.whenReady().then(() => {
  createMainWindow(); // 오버레이 창 생성
  createTray(); // 트레이 아이콘 생성
});
