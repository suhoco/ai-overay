const { ipcRenderer } = require('electron');
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

const gameNames = ['MapleStory', 'LostArk', 'EldenRing'];

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
    const { title, description } = aiTexts[aiTextIndex];
    document.getElementById("aiTitle").textContent = title;
    document.getElementById("aiDescription").textContent = description;
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (textContent) textContent.style.display = 'block';
    if (gameName) gameName.style.display = 'block';
}

//F9 다음 텍스트 F8이전 텍스트
ipcRenderer.on('next-ai-text', () => {
    if (loadingContainer) loadingContainer.style.display = 'flex';
    if (textContent) textContent.style.display = 'none';
    if (loadingText) loadingText.textContent = '스크립트 분석 중...';
    setTimeout(() => {
        aiTextIndex = (aiTextIndex + 1) % aiTexts.length;
        updateAIText();
    }, 300);
});

ipcRenderer.on('prev-ai-text', () => {
    if (loadingContainer) loadingContainer.style.display = 'flex';
    if (textContent) textContent.style.display = 'none';
    if (loadingText) loadingText.textContent = '스크립트 분석 중...';
    setTimeout(() => {
        aiTextIndex = (aiTextIndex + 1) % aiTexts.length;
        updateAIText();
    }, 300);
});


ipcRenderer.on('show-loading', () => {
    if (loadingContainer) loadingContainer.style.display = 'flex';
    if (textContent) textContent.style.display = 'none';
    if (gameName) gameName.style.display = 'none';
    if (loadingText) loadingText.textContent = '게임 탐색 중...';
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
if (loadingContainer) loadingContainer.style.display = 'flex';
if (textContent) textContent.style.display = 'none';
setTimeout(() => {
    setGameName(gameNames[gameNameIndex]);
    updateAIText();
}, 2000);