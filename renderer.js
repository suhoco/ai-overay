const {ipcRenderer} = require('electron');
const aiOutput = document.getElementById('aiOutput');
const slider = document.getElementById('opacitySlider');
const valueLabel = document.getElementById('opacityValue');
const toggleBtn = document.getElementById('toggleOverlayButton');
const loadingContainer = document.getElementById('loadingContainer');
const textContent = document.getElementById('textContent');
const gameName = document.getElementById('gameName');
const loadingText = document.querySelector('.loadingText');

let isOverlayActive = true; // 기능이 켜져 있는 상태
let screenStream = null;
let isScreenStreamSet = false;

slider.addEventListener('input', () => {
    const percent = parseInt(slider.value);
    const opacity = percent / 100;
    ipcRenderer.send('set-opacity', opacity);
    valueLabel.textContent = `${percent}%`;
    aiOutput.style.opacity = opacity;
});

toggleBtn.addEventListener('click', () => {
    isOverlayActive = !isOverlayActive;
    updateOverlayState();
});

function updateOverlayState() {
    if (isOverlayActive) {
        aiOutput.style.display = 'block';
        toggleBtn.textContent = '🔘 오버레이 끄기';
    } else {
        aiOutput.style.display = 'none';
        toggleBtn.textContent = '🔘 오버레이 켜기';
    }
}

const backButton = document.getElementById('backButton');
if (backButton) {
    backButton.addEventListener('click', () => {
        ipcRenderer.send('open-Main');
    });
}

//F5 업데이트
ipcRenderer.on('update-ai-text', () => {
    if (loadingContainer) loadingContainer.style.display = 'flex';
    if (textContent) textContent.style.display = 'none';
    if (loadingText) loadingText.textContent = '스크립트 분석 중...';

    sendCaptureToMain();
});

ipcRenderer.on('ai-result-ready', (event, aiText) => {
    document.getElementById("aiDescription").textContent = aiText;

    if (loadingContainer) loadingContainer.style.display = 'none';
    if (textContent) textContent.style.display = 'block';
    if (gameName) gameName.style.display = 'block';
});

// 실제 게임 이름이 감지되면 변경할 수 있는 함수
function setGameName(name) {
    gameName.textContent = name;
}

//로딩 후 최초 text 표시
if (loadingContainer) {
    loadingContainer.style.display = 'flex';
}
if (textContent) {
    textContent.style.display = 'none';
}

setTimeout(() => {
    updateAIText();
}, 2000);

const cropArea = {x: 100, y: 100, width: 400, height: 300};

ipcRenderer.on('set-screen-source', async (event, data) => {
    if (isScreenStreamSet) {
        return;
    }
    const { screenId, gameName } = data;
    setGameName(gameName);

    try {
        // getUserMedia로 해당 sourceId의 화면 스트림 요청
        screenStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId,
                    minWidth: 1280,
                    maxWidth: 1280,
                    minHeight: 720,
                    maxHeight: 720
                }
            }
        });

        // video 태그에 스트림 연결
        const video = document.getElementById('screenVideo');
        const canvas = document.getElementById('cropCanvas');
        const ctx = canvas.getContext('2d');


        if (video) {
            video.srcObject = screenStream;
            video.onloadedmetadata = () => {
                video.play();
                // 캔버스 크기를 crop 영역으로 설정
                canvas.width = cropArea.width;
                canvas.height = cropArea.height;

                // 실시간으로 crop해서 그리기
                function drawCrop() {
                    ctx.drawImage(
                        video,
                        cropArea.x, cropArea.y, cropArea.width, cropArea.height, // source 영역
                        0, 0, cropArea.width, cropArea.height // destination
                    );
                    requestAnimationFrame(drawCrop);
                }
                drawCrop();
            };
        }
        isScreenStreamSet = true;

    } catch (e) {
        console.error('화면 캡처 실패:', e);
    }

});

function sendCaptureToMain() {
    const canvas = document.getElementById('cropCanvas');
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    ipcRenderer.send('save-capture-image', dataURL);
}

function requestAIResponse(prompt, persona) {
    ipcRenderer.invoke('query-ai', { prompt, persona })
        .then(response => {
            document.getElementById('aiDescription').textContent = response;
        })
        .catch(err => {
            console.error('AI 호출 실패:', err);
        });
}