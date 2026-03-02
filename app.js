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

async function ensureAudioReady() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

function createBeepWav(frequency, duration) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.3 * (1 - i / numSamples);
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

function playFallbackBeep() {
  const url = createBeepWav(523.25, 0.2);
  const audio = new Audio(url);
  audio.volume = 0.5;
  audio.play().catch(() => {});
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function playCalmingSound(type) {
  ensureAudioReady().then(() => {
    try {
      const ctx = getAudioContext();
      if (ctx.state !== 'running') {
        playFallbackBeep();
        return;
      }
      const now = ctx.currentTime;

      const playTone = (frequency, duration, startTime, waveType = 'sine') => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, now + startTime);
        gainNode.gain.setValueAtTime(0.3, now + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + startTime + duration);
        oscillator.start(now + startTime);
        oscillator.stop(now + startTime + duration);
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
      } else if (type === 'reset') {
        playTone(392, 0.08, 0, 'sine');
        playTone(329.63, 0.08, 0.06, 'sine');
        playTone(261.63, 0.12, 0.12, 'sine');
      } else if (type === 'resetSessions') {
        playTone(523.25, 0.1, 0, 'sine');
        playTone(392, 0.15, 0.08, 'sine');
      }
    } catch (e) {
      playFallbackBeep();
    }
  });
}

function unlockAudioOnInteraction() {
  ensureAudioReady();
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
  playCalmingSound('reset');
  updateUI();
}

function resetSessionCount() {
  localStorage.setItem(STORAGE_KEY, '0');
  playCalmingSound('resetSessions');
  updateUI();
}

document.addEventListener('click', unlockAudioOnInteraction);
document.addEventListener('touchstart', unlockAudioOnInteraction, { passive: true });

elements.startPauseBtn.addEventListener('click', (e) => {
  unlockAudioOnInteraction();
  toggleStartPause();
});
elements.resetBtn.addEventListener('click', (e) => {
  unlockAudioOnInteraction();
  resetTimer();
});
elements.resetSessionsBtn.addEventListener('click', (e) => {
  unlockAudioOnInteraction();
  resetSessionCount();
});

updateUI();
