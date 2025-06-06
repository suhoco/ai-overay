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
let aiTextIndex = 0;
let gameNameIndex = 0;
let screenStream = null;
let isScreenStreamSet = false;

const gameNames = ['MapleStory', 'LostArk', 'EldenRing'];

const cropX = 100;
const cropY = 100;
const cropWidth = 400;
const cropHeight = 300;

//오버레이 출력 텍스트
const aiTexts = [
    {
        title: "대화를 시작해주세요",
        description: "대화를 시작하면 자동으로 인식하여 변환합니다"
    },
    {
        title: "스켈레톤 지휘관 처치",
        description: "유적발굴지 3에서 스켈레톤 지휘관 70마리를 처치하세요."
    },
    {
        title: "고대 문서 수집",
        description: "고대 유물 5개를 모아 연구소에 제출하세요."
    },
    {
        title: "검은마법사 추적",
        description: "엘린 숲에서 검은마법사의 흔적을 탐색하세요."
    }
];

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

function updateAIText() {
    const {title, description} = aiTexts[aiTextIndex];
    document.getElementById("aiTitle").textContent = title;
    document.getElementById("aiDescription").textContent = description;
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    }
    if (textContent) {
        textContent.style.display = 'block';
    }
    if (gameName) {
        gameName.style.display = 'block';
    }
}

//F9 다음 텍스트 F8이전 텍스트
ipcRenderer.on('next-ai-text', () => {
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
    if (textContent) {
        textContent.style.display = 'none';
    }
    if (loadingText) {
        loadingText.textContent = '스크립트 분석 중...';
    }
    setTimeout(() => {
        aiTextIndex = (aiTextIndex + 1) % aiTexts.length;
        updateAIText();
    }, 300);
});

ipcRenderer.on('prev-ai-text', () => {
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
    if (textContent) {
        textContent.style.display = 'none';
    }
    if (loadingText) {
        loadingText.textContent = '스크립트 분석 중...';
    }
    setTimeout(() => {
        aiTextIndex = (aiTextIndex + 1) % aiTexts.length;
        updateAIText();
    }, 300);
});


ipcRenderer.on('show-loading', () => {
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
    if (textContent) {
        textContent.style.display = 'none';
    }
    if (gameName) {
        gameName.style.display = 'none';
    }
    if (loadingText) {
        loadingText.textContent = '게임 탐색 중...';
    }
    setTimeout(() => {
        gameNameIndex = (gameNameIndex + 1) % gameNames.length;
        setGameName(gameNames[gameNameIndex]);
        updateAIText();
    }, 2000);
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
    setGameName(gameNames[gameNameIndex]);
    updateAIText();
    setInterval(sendCaptureToMain, 2000);
}, 2000);

const cropArea = {x: 100, y: 100, width: 400, height: 300};

ipcRenderer.on('set-screen-source', async (event, sourceId) => {
    if (isScreenStreamSet) {
        return;
    }

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