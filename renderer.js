const { ipcRenderer } = require('electron');

const aiOutput = document.getElementById('aiOutput');
const slider = document.getElementById('opacitySlider');
const valueLabel = document.getElementById('opacityValue');
const toggleBtn = document.getElementById('toggleOverlayButton');

let isOverlayActive = true; // 기능이 켜져 있는 상태

// 투명도 조절
slider.addEventListener('input', () => {
  const percent = parseInt(slider.value);
  const opacity = percent / 100;
  ipcRenderer.send('set-opacity', opacity);
  valueLabel.textContent = `${percent}%`;
});

// 오버레이 기능 켜기/끄기 토글
toggleBtn.addEventListener('click', () => {
  isOverlayActive = !isOverlayActive;
  updateOverlayState();
});

// UI 상태 변경
function updateOverlayState() {
  if (isOverlayActive) {
    aiOutput.style.display = 'block';
    toggleBtn.textContent = '🔘 오버레이 끄기';
  } else {
    aiOutput.style.display = 'none';
    toggleBtn.textContent = '🔘 오버레이 켜기';
  }
}