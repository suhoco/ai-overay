const { ipcRenderer } = require('electron');
const aiOutput = document.getElementById('aiOutput');
const slider = document.getElementById('opacitySlider');
const valueLabel = document.getElementById('opacityValue');
const toggleBtn = document.getElementById('toggleOverlayButton');

let isOverlayActive = true;

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

// 초기 상태 설정
updateOverlayState();
