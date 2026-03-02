const WORK_DURATION = 60 * 60;      // 60 minutes in seconds
const SHORT_BREAK_DURATION = 10 * 60;  // 10 minutes
const LONG_BREAK_DURATION = 30 * 60;   // 30 minutes
const STORAGE_KEY = 'pomodoroTotalSessions';

const state = {
  phase: 'work',
  sessionsInCycle: 0,
  timeRemaining: WORK_DURATION,
  isPaused: true,
  intervalId: null
};

const elements = {
  timerDisplay: document.getElementById('timerDisplay'),
  phaseIndicator: document.getElementById('phaseIndicator'),
  startPauseBtn: document.getElementById('startPauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  sessionCount: document.getElementById('sessionCount'),
  resetSessionsBtn: document.getElementById('resetSessionsBtn')
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getPhaseLabel(phase) {
  switch (phase) {
    case 'work': return 'Work Session';
    case 'shortBreak': return 'Short Break';
    case 'longBreak': return 'Long Break';
    default: return 'Work Session';
  }
}

function updateUI() {
  elements.timerDisplay.textContent = formatTime(state.timeRemaining);
  elements.phaseIndicator.textContent = getPhaseLabel(state.phase);
  elements.sessionCount.textContent = getTotalSessions();

  document.body.className = `phase-${state.phase}`;

  if (state.isPaused) {
    elements.startPauseBtn.textContent = 'Start';
  } else {
    elements.startPauseBtn.textContent = 'Pause';
  }
}

function getTotalSessions() {
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

function incrementTotalSessions() {
  const total = getTotalSessions() + 1;
  localStorage.setItem(STORAGE_KEY, total.toString());
}

function transitionToNextPhase() {
  clearInterval(state.intervalId);
  state.intervalId = null;

  if (state.phase === 'work') {
    state.sessionsInCycle++;
    incrementTotalSessions();

    if (state.sessionsInCycle < 4) {
      state.phase = 'shortBreak';
      state.timeRemaining = SHORT_BREAK_DURATION;
    } else {
      state.phase = 'longBreak';
      state.timeRemaining = LONG_BREAK_DURATION;
    }
  } else if (state.phase === 'shortBreak') {
    state.phase = 'work';
    state.timeRemaining = WORK_DURATION;
  } else if (state.phase === 'longBreak') {
    state.sessionsInCycle = 0;
    state.phase = 'work';
    state.timeRemaining = WORK_DURATION;
  }

  state.isPaused = true;
  updateUI();
}

function tick() {
  if (state.timeRemaining <= 0) {
    transitionToNextPhase();
    return;
  }

  state.timeRemaining--;
  updateUI();
}

function startTimer() {
  if (state.intervalId) return;

  state.isPaused = false;
  state.intervalId = setInterval(tick, 1000);
  updateUI();
}

function pauseTimer() {
  if (!state.intervalId) return;

  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isPaused = true;
  updateUI();
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
  state.phase = 'work';
  state.timeRemaining = WORK_DURATION;
  updateUI();
}

function resetSessionCount() {
  localStorage.setItem(STORAGE_KEY, '0');
  updateUI();
}

elements.startPauseBtn.addEventListener('click', toggleStartPause);
elements.resetBtn.addEventListener('click', resetTimer);
elements.resetSessionsBtn.addEventListener('click', resetSessionCount);

updateUI();
