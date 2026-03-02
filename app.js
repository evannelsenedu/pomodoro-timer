const WORK_DURATION = 60 * 60; // 60 minutes in seconds
const BREAK_DURATION = 10 * 60; // 10 minutes in seconds
const STORAGE_KEY = 'pomodoroTotalSessions';

const state = {
  mode: 'work', // 'work' | 'break'
  timeRemaining: WORK_DURATION,
  isPaused: true,
  intervalId: null
};

const elements = {
  timerDisplay: document.getElementById('timerDisplay'),
  startPauseBtn: document.getElementById('startPauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  sessionCount: document.getElementById('sessionCount'),
  resetSessionsBtn: document.getElementById('resetSessionsBtn'),
  progressCircles: document.getElementById('progressCircles'),
  title: document.querySelector('.title'),
  modalOverlay: document.getElementById('modalOverlay'),
  modalTitle: document.getElementById('modalTitle'),
  modalMessage: document.getElementById('modalMessage'),
  modalApproveBtn: document.getElementById('modalApproveBtn')
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getCurrentDuration() {
  return state.mode === 'work' ? WORK_DURATION : BREAK_DURATION;
}

function updateProgressCircles() {
  const circles = elements.progressCircles?.querySelectorAll('.circle');
  if (!circles || circles.length === 0) return;

  const completedSessions = getTotalSessions();
  const duration = getCurrentDuration();
  const timeElapsed = duration - state.timeRemaining;
  const currentProgress = Math.min(1, timeElapsed / duration);

  circles.forEach((circle, i) => {
    let progress = 0;
    if (i < completedSessions) {
      progress = 1; // filled for each completed work timer
    } else if (i === completedSessions && state.mode === 'work') {
      progress = currentProgress; // partial fill only during active work
    }
    circle.style.setProperty('--progress', progress);
  });
}

function updateDisplay() {
  elements.timerDisplay.textContent = formatTime(state.timeRemaining);
  elements.startPauseBtn.textContent = state.isPaused ? 'Start' : 'Pause';
  if (elements.sessionCount) {
    elements.sessionCount.textContent = getTotalSessions();
  }
  if (elements.title) {
    elements.title.textContent = state.mode === 'work' ? 'Pomodoro Timer' : 'Break Time';
  }
  updateProgressCircles();
}

function getTotalSessions() {
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

function incrementTotalSessions() {
  const total = getTotalSessions() + 1;
  localStorage.setItem(STORAGE_KEY, total.toString());
}

function fireConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 }
    });
  }
}

function showModal(title, message, onApprove) {
  if (!elements.modalOverlay) return;
  elements.modalTitle.textContent = title;
  elements.modalMessage.textContent = message;
  elements.modalOverlay.classList.add('visible');
  elements.modalOverlay.setAttribute('aria-hidden', 'false');

  const handleApprove = () => {
    elements.modalApproveBtn?.removeEventListener('click', handleApprove);
    elements.modalOverlay.classList.remove('visible');
    elements.modalOverlay.setAttribute('aria-hidden', 'true');
    onApprove();
  };
  elements.modalApproveBtn.addEventListener('click', handleApprove);
}

function onWorkComplete() {
  fireConfetti();
  showModal('Work session complete!', 'Time for a 10-minute break. Click Start when you\'re ready.', () => {
    state.mode = 'break';
    state.timeRemaining = BREAK_DURATION;
    state.isPaused = false;
    state.intervalId = setInterval(tick, 1000);
    updateDisplay();
  });
}

function onBreakComplete() {
  showModal('Break over!', 'Ready to start your next 60-minute work session?', () => {
    state.mode = 'work';
    state.timeRemaining = WORK_DURATION;
    state.isPaused = false;
    state.intervalId = setInterval(tick, 1000);
    updateDisplay();
  });
}

function tick() {
  if (state.timeRemaining <= 0) {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.isPaused = true;
    if (state.mode === 'work') {
      incrementTotalSessions();
      updateDisplay();
      onWorkComplete();
    } else {
      updateDisplay();
      onBreakComplete();
    }
    return;
  }
  state.timeRemaining--;
  updateDisplay();
}

function startTimer() {
  if (state.intervalId) return;
  state.isPaused = false;
  state.intervalId = setInterval(tick, 1000);
  updateDisplay();
}

function pauseTimer() {
  if (!state.intervalId) return;
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isPaused = true;
  updateDisplay();
}

function toggleStartPause() {
  if (state.isPaused) {
    startTimer();
  } else {
    pauseTimer();
  }
}

function resetTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isPaused = true;
  state.timeRemaining = getCurrentDuration();
  updateDisplay();
}

function resetSessionCount() {
  localStorage.setItem(STORAGE_KEY, '0');
  updateDisplay();
}

elements.startPauseBtn.addEventListener('click', toggleStartPause);
elements.resetBtn.addEventListener('click', resetTimer);
elements.resetSessionsBtn?.addEventListener('click', resetSessionCount);

updateDisplay();
