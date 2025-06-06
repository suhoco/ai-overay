﻿const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, desktopCapturer} = require('electron');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const { queryHuggingFaceAPI } = require('./huggingface-api');

let mainWindow = null;
let overlayWindow = null;
let tray = null;
let isOverlayVisible = false;
let screenSourceId = null;
let isScreenSourceSet = false;
let cachedPersona = null;
let modelReady = false;
let selectedGameName = null;

let ocrWorker = null;
async function getWorker() {
    if (!ocrWorker) {
        ocrWorker = await Tesseract.createWorker("eng");
    }
    return ocrWorker;
}

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
        height: 400,
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
ipcMain.handle('query-ai', async (event, { prompt, persona }) => {
    try {
        if (!cachedPersona && persona) {
            cachedPersona = persona; // 최초 1회만 저장
        }

        const response = await queryHuggingFaceAPI(prompt, cachedPersona);

        if (!modelReady) modelReady = true;

        return {
            success: true,
            response,
            ready: modelReady
        };

    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
});

ipcMain.on('set-game-name', (event, gameName) => {
    selectedGameName = gameName;
});

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

ipcMain.on('open-Main', () => {
    if (!mainWindow) {
        createMainWindow();
    } else {
        mainWindow.show();
    }

    if (mainWindow) {
        overlayWindow.hide();
    }
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

    globalShortcut.register('F5', () => {
        if (overlayWindow && overlayWindow.webContents) {
            overlayWindow.webContents.send('update-ai-text');
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
    globalShortcut.unregisterAll(); //앱 종료 시 전역 단축 키 해제
});

// 스크린 캡쳐용
ipcMain.on('start-screen-capture', async () => {
    if (isScreenSourceSet) return;
    // 화면 소스 목록에서 첫 번째 screen을 선택
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    if (sources.length > 0 && overlayWindow && overlayWindow.webContents) {
        screenSourceId = sources[0].id;
        isScreenSourceSet = true;
        overlayWindow.webContents.send('set-screen-source', {
            screenId: screenSourceId,
            gameName: selectedGameName || 'Unknown'
        });
    }
});

// 로그 확인용
ipcMain.on('log-to-main', (event, message) => {
    console.log('[Renderer]', message);
});

const projectRoot = app.getAppPath();

ipcMain.on('save-capture-image', (event, dataURL) => {
    const filename = 'capture.png';
    const filePath = path.join(projectRoot, filename);

    // base64 헤더 제거
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
    fs.writeFile(filePath, base64Data, 'base64', async (err) => {
        if (err) {
            console.error('이미지 저장 실패:', err);
        } else {
            console.log('이미지 저장 완료:', filePath);
        }
        try {
            const worker = await getWorker();
            const { data: { text } } = await worker.recognize(filePath);
            console.log('OCR 결과:', text);

            const aiResult = await queryHuggingFaceAPI(text, cachedPersona);

            if (overlayWindow && overlayWindow.webContents) {
                overlayWindow.webContents.send('ai-result-ready', aiResult);
            }
        } catch (ocrErr) {
            console.error('OCR 실패:', ocrErr);
        }
    });
});