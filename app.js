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

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playCalmingSound(type) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playTone = (frequency, duration, startTime, waveType = 'sine') => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    if (type === 'start') {
      playTone(523.25, 0.15, 0);
      playTone(659.25, 0.15, 0.12);
      playTone(783.99, 0.2, 0.24);
    } else if (type === 'end') {
      playTone(523.25, 0.2, 0, 'sine');
      playTone(659.25, 0.2, 0.15, 'sine');
      playTone(783.99, 0.2, 0.3, 'sine');
      playTone(1046.5, 0.4, 0.45, 'sine');
    } else if (type === 'pause') {
      playTone(783.99, 0.12, 0, 'sine');
      playTone(659.25, 0.12, 0.1, 'sine');
      playTone(523.25, 0.15, 0.2, 'sine');
    }
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

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
  playCalmingSound('end');
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
  playCalmingSound('start');
  updateUI();
}

function pauseTimer() {
  if (!state.intervalId) return;

  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isPaused = true;
  playCalmingSound('pause');
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

function unlockAudio() {
  getAudioContext().resume();
}

document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

elements.startPauseBtn.addEventListener('click', toggleStartPause);
elements.resetBtn.addEventListener('click', resetTimer);
elements.resetSessionsBtn.addEventListener('click', resetSessionCount);

updateUI();
