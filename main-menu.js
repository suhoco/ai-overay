// Application state
const appState = {
    currentStep: 1,
    totalSteps: 7,
    answers: {},
    isCompleted: false
};

// Question data
const questions = [
    {
        id: 1,
        type: "welcome",
        title: "환영합니다!",
        description: "AI 오버레이 시스템에 오신 것을 환영합니다.",
        options: ["예", "아니오"]
    },
    {
        id: 2,
        type: "consent",
        title: "사용자의 정보를 수집합니다.",
        description: "더 나은 서비스를 위해 정보 수집에 동의해주세요.",
        options: ["예", "아니오"]
    },
    {
        id: 3,
        type: "gender",
        title: "성별을 선택해주세요",
        description: "성별 정보를 선택해주세요.",
        options: ["남자", "여자"]
    },
    {
        id: 4,
        type: "age",
        title: "나이를 입력해주세요",
        description: "나이를 숫자로 입력해주세요.",
        placeholder: "예: 25",
        validation: "숫자만 입력 가능합니다"
    },
    {
        id: 5,
        type: "mbti",
        title: "MBTI를 선택해주세요",
        description: "성격 유형을 선택해주세요.",
        options: ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"]
    },
    {
        id: 6,
        type: "playstyle",
        title: "플레이 스타일을 선택해주세요",
        description: "선호하는 플레이 스타일을 선택해주세요.",
        options: ["자유 중시", "가이드 라인 중시"]
    },
    {
        id: 7,
        type: "aistyle",
        title: "AI 대화 스타일을 선택해주세요",
        description: "선호하는 AI 대화 스타일을 선택해주세요.",
        options: ["진지", "유머", "친절"]
    }
];

// DOM elements
const elements = {
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    questionContainer: document.getElementById('questionContainer'),
    loadingContainer: document.getElementById('loadingContainer'),
    finalContainer: document.getElementById('finalContainer'),
    progressContainer: document.getElementById('progressContainer'),
    questionTitle: document.getElementById('questionTitle'),
    questionDescription: document.getElementById('questionDescription'),
    optionsContainer: document.getElementById('optionsContainer'),
    radioContainer: document.getElementById('radioContainer'),
    inputContainer: document.getElementById('inputContainer'),
    selectContainer: document.getElementById('selectContainer'),
    ageInput: document.getElementById('ageInput'),
    mbtiSelect: document.getElementById('mbtiSelect'),
    validationMessage: document.getElementById('validationMessage'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    messageHistory: document.getElementById('messageHistory'),
    editBtn: document.getElementById('editBtn')
};

// Initialize application
function initApp() {
    renderCurrentQuestion();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    elements.prevBtn.addEventListener('click', goToPreviousStep);
    elements.nextBtn.addEventListener('click', goToNextStep);
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.editBtn.addEventListener('click', editSettings);
    elements.messageInput.addEventListener('keypress', handleMessageKeyPress);
    elements.ageInput.addEventListener('input', validateAge);
    elements.ageInput.addEventListener('keypress', handleAgeKeyPress);
}

// Handle age input key press to prevent invalid characters
function handleAgeKeyPress(event) {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true)) {
        return;
    }
    // Ensure that it is a number and stop the keypress
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
        event.preventDefault();
    }
}

// Render current question
function renderCurrentQuestion() {
    const question = questions[appState.currentStep - 1];
    
    // Update progress
    updateProgress();
    
    // Update question content
    elements.questionTitle.textContent = question.title;
    elements.questionDescription.textContent = question.description;
    
    // Hide all input containers
    hideAllInputContainers();
    
    // Show appropriate input type
    switch (question.type) {
        case 'welcome':
        case 'consent':
            renderYesNoOptions(question.options);
            break;
        case 'gender':
        case 'playstyle':
        case 'aistyle':
            renderRadioOptions(question.options);
            break;
        case 'age':
            renderAgeInput(question);
            break;
        case 'mbti':
            renderMBTISelect();
            break;
    }
    
    // Update navigation buttons
    updateNavigationButtons();
}

// Hide all input containers
function hideAllInputContainers() {
    elements.optionsContainer.style.display = 'none';
    elements.radioContainer.style.display = 'none';
    elements.inputContainer.style.display = 'none';
    elements.selectContainer.style.display = 'none';
}

// Render Yes/No options
function renderYesNoOptions(options) {
    elements.optionsContainer.style.display = 'flex';
    const buttons = elements.optionsContainer.querySelectorAll('.option-btn');
    
    buttons.forEach((btn, index) => {
        btn.textContent = options[index];
        btn.classList.remove('selected');
        
        // Restore previous selection
        if (appState.answers[appState.currentStep] === options[index]) {
            btn.classList.add('selected');
        }
        
        btn.onclick = () => selectOption(btn, options[index]);
    });
}

// Render radio options
function renderRadioOptions(options) {
    elements.radioContainer.style.display = 'flex';
    elements.radioContainer.innerHTML = '';
    
    options.forEach(option => {
        const radioOption = document.createElement('div');
        radioOption.className = 'radio-option';
        radioOption.innerHTML = `
            <input type="radio" name="question${appState.currentStep}" value="${option}" id="${option}${appState.currentStep}">
            <label for="${option}${appState.currentStep}">${option}</label>
        `;
        
        // Restore previous selection
        if (appState.answers[appState.currentStep] === option) {
            radioOption.classList.add('selected');
            radioOption.querySelector('input').checked = true;
        }
        
        radioOption.onclick = () => selectRadioOption(radioOption, option);
        elements.radioContainer.appendChild(radioOption);
    });
}

// Render age input
function renderAgeInput(question) {
    elements.inputContainer.style.display = 'flex';
    elements.ageInput.placeholder = question.placeholder;
    elements.validationMessage.textContent = question.validation;
    elements.validationMessage.classList.remove('error');
    
    // Restore previous value
    if (appState.answers[appState.currentStep]) {
        elements.ageInput.value = appState.answers[appState.currentStep];
    } else {
        elements.ageInput.value = '';
    }
}

// Render MBTI select
function renderMBTISelect() {
    elements.selectContainer.style.display = 'flex';
    
    // Restore previous selection
    if (appState.answers[appState.currentStep]) {
        elements.mbtiSelect.value = appState.answers[appState.currentStep];
    } else {
        elements.mbtiSelect.value = '';
    }
    
    elements.mbtiSelect.onchange = () => {
        appState.answers[appState.currentStep] = elements.mbtiSelect.value;
        updateNavigationButtons();
    };
}

// Select option (Yes/No)
function selectOption(button, value) {
    // Remove selection from all buttons
    elements.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selection to clicked button
    button.classList.add('selected');
    
    // Save answer
    appState.answers[appState.currentStep] = value;
    updateNavigationButtons();
    
    // Handle "아니오" responses for critical questions
    if (value === "아니오" && (appState.currentStep === 1 || appState.currentStep === 2)) {
        // For welcome or consent "아니오", show a message but still allow continuation
        setTimeout(() => {
            if (appState.currentStep === 1) {
                alert("서비스 이용을 위해 계속 진행해주세요.");
            } else if (appState.currentStep === 2) {
                alert("정보 수집 없이는 서비스 이용이 제한될 수 있습니다.");
            }
        }, 100);
    }
}

// Select radio option
function selectRadioOption(element, value) {
    // Remove selection from all radio options
    elements.radioContainer.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
        option.querySelector('input').checked = false;
    });
    
    // Add selection to clicked option
    element.classList.add('selected');
    element.querySelector('input').checked = true;
    
    // Save answer
    appState.answers[appState.currentStep] = value;
    updateNavigationButtons();
}

// Validate age input
function validateAge() {
    const value = elements.ageInput.value.trim();
    
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue !== value) {
        elements.ageInput.value = numericValue;
    }
    
    const age = parseInt(numericValue);
    const isValid = numericValue && !isNaN(age) && age > 0 && age <= 120;
    
    if (numericValue && !isValid) {
        elements.validationMessage.classList.add('error');
        elements.validationMessage.textContent = "1~120 사이의 숫자를 입력해주세요.";
    } else {
        elements.validationMessage.classList.remove('error');
        elements.validationMessage.textContent = "숫자만 입력 가능합니다";
    }
    
    if (isValid) {
        appState.answers[appState.currentStep] = age;
    } else {
        delete appState.answers[appState.currentStep];
    }
    
    updateNavigationButtons();
}

// Update progress bar
function updateProgress() {
    const progressPercentage = (appState.currentStep / appState.totalSteps) * 100;
    elements.progressFill.style.width = `${progressPercentage}%`;
    elements.progressText.textContent = `${appState.currentStep}/${appState.totalSteps}`;
}

// Update navigation buttons
function updateNavigationButtons() {
    // Previous button
    elements.prevBtn.disabled = appState.currentStep === 1;
    
    // Next button
    const hasAnswer = appState.answers.hasOwnProperty(appState.currentStep);
    elements.nextBtn.disabled = !hasAnswer;
    
    // Update next button text
    if (appState.currentStep === appState.totalSteps) {
        elements.nextBtn.textContent = '완료';
    } else {
        elements.nextBtn.textContent = '다음';
    }
}

// Go to previous step
function goToPreviousStep() {
    if (appState.currentStep > 1) {
        appState.currentStep--;
        renderCurrentQuestion();
    }
}

// Go to next step
function goToNextStep() {
    if (appState.currentStep < appState.totalSteps) {
        appState.currentStep++;
        renderCurrentQuestion();
    } else {
        completeQuestionnaire();
    }
}

// Complete questionnaire
function completeQuestionnaire() {
    // Hide question container and progress
    elements.questionContainer.style.display = 'none';
    elements.progressContainer.style.display = 'none';

    // Show loading screen
    elements.loadingContainer.style.display = 'block';
    elements.loadingContainer.classList.add('fade-in');

    // Simulate analysis time
    setTimeout(() => {
        showFinalScreen();
    }, 3000);
}

// Show final screen
function showFinalScreen() {
    elements.loadingContainer.style.display = 'none';
    elements.finalContainer.style.display = 'block';
    elements.finalContainer.classList.add('fade-in');
    appState.isCompleted = true;
    
    // Focus on message input for better UX
    elements.messageInput.focus();
}

// Send message
function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (message) {
        addMessageToHistory(message);
        elements.messageInput.value = '';

        // Simulate AI response
        setTimeout(() => {
            addAIMessageToHistory("메시지를 받았습니다. 게임 연동을 확인하고 있습니다.");
        }, 1000);
        setTimeout(() => {
            addAIMessageToHistory("AI가 준비되었습니다. 게임을 시작해주세요.");
        }, 2000);
    }
}


// Handle message input key press
function handleMessageKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Add user message to history
function addMessageToHistory(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="message-time">사용자 - ${timeString}</div>
        <div class="message-text">${message}</div>
    `;
    
    elements.messageHistory.appendChild(messageElement);
    elements.messageHistory.scrollTop = elements.messageHistory.scrollHeight;
}

// Add AI message to history
function addAIMessageToHistory(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    messageElement.style.borderLeftColor = 'var(--color-success)';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="message-time">AI 시스템 - ${timeString}</div>
        <div class="message-text">${message}</div>
    `;
    
    elements.messageHistory.appendChild(messageElement);
    elements.messageHistory.scrollTop = elements.messageHistory.scrollHeight;
}

// Edit settings
function editSettings() {
    // Reset to first step
    appState.currentStep = 1;
    appState.isCompleted = false;
    
    // Show question container and progress
    elements.finalContainer.style.display = 'none';
    elements.questionContainer.style.display = 'block';
    elements.progressContainer.style.display = 'block';
    
    // Clear message history
    elements.messageHistory.innerHTML = '';
    
    // Render first question
    renderCurrentQuestion();
}

// startGame 함수 추가
function startGame() {
    if (typeof require !== 'undefined') {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('start-game-mode');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);