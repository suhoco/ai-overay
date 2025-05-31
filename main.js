const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let overlayWindow = null;
let tray = null;
let isOverlayVisible = false;

// 메인 창 생성
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    mainWindow.loadFile('main-menu.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 오버레이 창 생성
function createOverlayWindow() {
    overlayWindow = new BrowserWindow({
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
        show: false, // 초기에는 숨김
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            contextIsolation: false,
            nodeIntegration: true
        }
    });

    overlayWindow.loadFile('index.html').then(() => {
        updateOverlayUI();
    });

    // 전체화면 위에서도 항상 보이도록 설정
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // 포커스를 잃었을 때도 항상 위에 있도록 설정 유지
    overlayWindow.on('blur', () => {
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
        overlayWindow.setVisibleOnAllWorkspaces(true);
    });

    // 창을 닫을 때 종료하지 않고 숨기도록 처리
    overlayWindow.on('close', (e) => {
        if (!app.isQuiting) {
            e.preventDefault();
            overlayWindow.hide();
            isOverlayVisible = false;
            updateTrayMenu();
        }
    });
}

// 트레이 아이콘 및 메뉴 생성
function createTray() {
    // 아이콘 파일 경로 수정 (icon.jpg로 변경)
    const iconPath = path.join(__dirname, 'icon.jpg');

    try {
        tray = new Tray(iconPath);
        tray.setToolTip('AI 오버레이');
        updateTrayMenu();

        tray.on('click', () => {
            toggleOverlay();
        });
    } catch (error) {
        console.error('트레이 생성 실패:', error);
        // 트레이 생성 실패 시 기본 아이콘으로 재시도
        try {
            // 기본 아이콘 생성 (16x16 투명 PNG)
            const { nativeImage } = require('electron');
            const defaultIcon = nativeImage.createEmpty();
            tray = new Tray(defaultIcon);
            tray.setToolTip('AI 오버레이');
            updateTrayMenu();
        } catch (fallbackError) {
            console.error('기본 트레이 생성도 실패:', fallbackError);
        }
    }
}

// 트레이 메뉴 업데이트
function updateTrayMenu() {
    if (!tray) return; // 트레이가 없으면 종료

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '메인 화면 열기',
            click: () => {
                if (!mainWindow) createMainWindow();
                else mainWindow.show();
            }
        },
        {
            label: isOverlayVisible ? '오버레이 끄기' : '오버레이 켜기',
            click: toggleOverlay
        },
        { type: 'separator' },
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

// 오버레이 토글
function toggleOverlay() {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
        createOverlayWindow();
    }

    if (isOverlayVisible) {
        overlayWindow.hide();
    } else {
        overlayWindow.show();
    }

    isOverlayVisible = !isOverlayVisible;
    updateTrayMenu();
    updateOverlayUI();
}

// 오버레이 UI 업데이트
function updateOverlayUI() {
    if (overlayWindow && overlayWindow.webContents) {
        overlayWindow.webContents.send('overlay-state', isOverlayVisible);
    }
}

// IPC 이벤트 핸들러들
ipcMain.on('start-game-mode', () => {
    console.log('게임 모드 시작');

    // 메인 창 숨기기
    if (mainWindow) mainWindow.hide();

    // 오버레이 창이 없거나 파괴된 경우 재생성
    if (!overlayWindow || overlayWindow.isDestroyed()) {
        createOverlayWindow();
    }

    // 오버레이 표시
    overlayWindow.show();
    isOverlayVisible = true;
    updateTrayMenu();
    updateOverlayUI();
});

// 투명도 조절
ipcMain.on('set-opacity', (event, opacity) => {
    if (overlayWindow) {
        overlayWindow.setOpacity(opacity);
    }
});

// 창 숨기기
ipcMain.on('hide-window', () => {
    if (overlayWindow) {
        overlayWindow.hide();
        isOverlayVisible = false;
        updateTrayMenu();
    }
});

// 오버레이 토글
ipcMain.on('toggle-overlay', () => {
    toggleOverlay();
});

// 앱 준비 완료 시 실행
app.whenReady().then(() => {
    createMainWindow();   // 메인 창 생성
    createOverlayWindow(); // 오버레이 창 생성 (초기 숨김)
    createTray();         // 트레이 생성

    overlayWindow.hide(); // 초기에는 오버레이 숨김
    isOverlayVisible = false;
    updateTrayMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuiting = true;
});
