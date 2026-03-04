const WORK_DURATION_OPTIONS = [30, 45, 60, 75, 90]; // minutes
const BREAK_DURATION = 10 * 60; // 10 minutes in seconds
const STORAGE_KEY = 'pomodoroTotalSessions';
const STORAGE_KEY_HISTORY = 'pomodoroHistory';
const STORAGE_KEY_DURATION = 'pomodoroWorkDurationMinutes';

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
}

function migrateToHistory() {
  const history = getHistory();
  const migrated = {};
  let changed = false;
  for (const [key, val] of Object.entries(history)) {
    const n = typeof val === 'number' ? val : 0;
    // Values <= 24 are likely session counts (convert to minutes); larger values are minutes
    migrated[key] = n > 0 && n <= 24 ? n * 60 : n;
    if (migrated[key] !== n) changed = true;
  }
  if (Object.keys(history).length === 0) {
    const oldTotal = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (oldTotal > 0) {
      migrated[getDateKey()] = oldTotal * 60;
      changed = true;
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  if (changed) saveHistory(migrated);
}

const state = {
  mode: 'work', // 'work' | 'break'
  timeRemaining: 0, // set on init
  isPaused: true,
  intervalId: null,
  timerEndTime: null // Date.now() + seconds when timer started
};

function getWorkDurationMinutes() {
  const stored = localStorage.getItem(STORAGE_KEY_DURATION);
  const num = stored ? parseInt(stored, 10) : null;
  return WORK_DURATION_OPTIONS.includes(num) ? num : 60;
}

function setWorkDurationMinutes(minutes) {
  localStorage.setItem(STORAGE_KEY_DURATION, String(minutes));
}

function getWorkDurationSeconds() {
  return getWorkDurationMinutes() * 60;
}

const elements = {
  timerDisplay: document.getElementById('timerDisplay'),
  startPauseBtn: document.getElementById('startPauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  timeToday: document.getElementById('timeToday'),
  timeWeek: document.getElementById('timeWeek'),
  timeYear: document.getElementById('timeYear'),
  timeTotal: document.getElementById('timeTotal'),
  resetSessionsBtn: document.getElementById('resetSessionsBtn'),
  progressCircles: document.getElementById('progressCircles'),
  title: document.querySelector('.title'),
  modalOverlay: document.getElementById('modalOverlay'),
  modalTitle: document.getElementById('modalTitle'),
  modalMessage: document.getElementById('modalMessage'),
  modalApproveBtn: document.getElementById('modalApproveBtn'),
  modalSkipBreakBtn: document.getElementById('modalSkipBreakBtn'),
  durationPickerOverlay: document.getElementById('durationPickerOverlay'),
  changeDurationBtn: document.getElementById('changeDurationBtn'),
  skipBreakBtn: document.getElementById('skipBreakBtn')
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
      } else if (type === 'confetti') {
        playTone(880, 0.08, 0, 'sine');
        playTone(1108.73, 0.08, 0.04, 'sine');
        playTone(1318.51, 0.08, 0.08, 'sine');
        playTone(1760, 0.12, 0.12, 'sine');
        playTone(2093, 0.15, 0.18, 'sine');
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

function formatHoursMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

function getCurrentDuration() {
  return state.mode === 'work' ? getWorkDurationSeconds() : BREAK_DURATION;
}

function updateProgressCircles() {
  const circles = elements.progressCircles?.querySelectorAll('.circle');
  if (!circles || circles.length === 0) return;

  const workMins = getWorkDurationMinutes();
  const totalMinutes = getTotalMinutes();
  const totalSessions = workMins > 0 ? Math.floor(totalMinutes / workMins) : 0;
  let completedSessions = totalSessions % 6;
  if (completedSessions === 0 && totalSessions > 0 && state.mode === 'break') {
    completedSessions = 6; // keep all 6 filled during break after completing cycle
  }

  const duration = getCurrentDuration();
  const timeElapsed = duration - state.timeRemaining;
  const currentProgress = duration > 0 ? Math.min(1, timeElapsed / duration) : 0;

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
  if (elements.timeToday) elements.timeToday.textContent = formatHoursMinutes(getMinutesToday());
  if (elements.timeWeek) elements.timeWeek.textContent = formatHoursMinutes(getMinutesThisWeek());
  if (elements.timeYear) elements.timeYear.textContent = formatHoursMinutes(getMinutesThisYear());
  if (elements.timeTotal) elements.timeTotal.textContent = formatHoursMinutes(getTotalMinutes());
  if (elements.title) {
    elements.title.textContent = state.mode === 'work' ? 'Pomodoro Timer' : 'Break Time';
  }
  if (elements.skipBreakBtn) {
    elements.skipBreakBtn.style.display = state.mode === 'break' ? '' : 'none';
  }
  updateProgressCircles();
}

function getTotalMinutes() {
  const history = getHistory();
  return Object.values(history).reduce((sum, n) => sum + (typeof n === 'number' ? n : 0), 0);
}

function getMinutesToday() {
  const history = getHistory();
  return history[getDateKey()] || 0;
}

function getMinutesThisWeek() {
  const history = getHistory();
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    sum += history[d.toISOString().slice(0, 10)] || 0;
  }
  return sum;
}

function getMinutesThisYear() {
  const history = getHistory();
  const year = new Date().getFullYear().toString();
  return Object.entries(history).reduce((sum, [key, val]) => {
    return key.startsWith(year) ? sum + (typeof val === 'number' ? val : 0) : sum;
  }, 0);
}

function incrementCompletedMinutes(minutes) {
  const history = getHistory();
  const today = getDateKey();
  history[today] = (history[today] || 0) + minutes;
  saveHistory(history);
}

function fireConfetti() {
  playCalmingSound('confetti');
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 }
    });
  }
}

function showModal(title, message, onApprove, options = {}) {
  if (!elements.modalOverlay) return;
  elements.modalTitle.textContent = title;
  elements.modalMessage.textContent = message;
  elements.modalOverlay.classList.add('visible');
  elements.modalOverlay.setAttribute('aria-hidden', 'false');

  if (elements.modalSkipBreakBtn) {
    elements.modalSkipBreakBtn.style.display = options.showSkipBreak ? '' : 'none';
  }

  const closeModal = () => {
    elements.modalOverlay.classList.remove('visible');
    elements.modalOverlay.setAttribute('aria-hidden', 'true');
  };

  const handleApprove = () => {
    closeModal();
    playCalmingSound('start');
    onApprove();
  };
  const handleSkip = () => {
    closeModal();
    if (options.onSkip) options.onSkip();
  };
  elements.modalApproveBtn.addEventListener('click', handleApprove, { once: true });
  if (options.showSkipBreak && elements.modalSkipBreakBtn) {
    elements.modalSkipBreakBtn.addEventListener('click', handleSkip, { once: true });
  }
}

function onWorkComplete() {
  fireConfetti();
  playCalmingSound('end');
  showModal('Work session complete!', 'Time for a 10-minute break. Click Start when you\'re ready.', () => {
    state.mode = 'break';
    state.timeRemaining = BREAK_DURATION;
    state.isPaused = false;
    state.timerEndTime = Date.now() + state.timeRemaining * 1000;
    state.intervalId = setInterval(tick, 1000);
    updateDisplay();
  }, {
    showSkipBreak: true,
    onSkip: () => {
      state.mode = 'work';
      state.timeRemaining = getWorkDurationSeconds();
      state.isPaused = false;
      state.timerEndTime = Date.now() + state.timeRemaining * 1000;
      state.intervalId = setInterval(tick, 1000);
      playCalmingSound('start');
      updateDisplay();
    }
  });
}

function onBreakComplete() {
  playCalmingSound('end');
  const mins = getWorkDurationMinutes();
  showModal('Break over!', `Ready to start your next ${mins}-minute work session?`, () => {
    state.mode = 'work';
    state.timeRemaining = getWorkDurationSeconds();
    state.isPaused = false;
    state.timerEndTime = Date.now() + state.timeRemaining * 1000;
    state.intervalId = setInterval(tick, 1000);
    updateDisplay();
  });
}

function tick() {
  const remaining = Math.max(0, Math.floor((state.timerEndTime - Date.now()) / 1000));
  state.timeRemaining = remaining;

  if (remaining <= 0) {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.timerEndTime = null;
    state.isPaused = true;
    if (state.mode === 'work') {
      incrementCompletedMinutes(getWorkDurationMinutes());
      updateDisplay();
      onWorkComplete();
    } else {
      updateDisplay();
      onBreakComplete();
    }
    return;
  }
  updateDisplay();
}

function startTimer() {
  if (state.intervalId) return;
  state.isPaused = false;
  state.timerEndTime = Date.now() + state.timeRemaining * 1000;
  state.intervalId = setInterval(tick, 1000);
  playCalmingSound('start');
  updateDisplay();
}

function pauseTimer() {
  if (!state.intervalId) return;
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.timerEndTime = null;
  state.isPaused = true;
  playCalmingSound('pause');
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
  state.timerEndTime = null;
  state.isPaused = true;
  state.timeRemaining = getCurrentDuration();
  playCalmingSound('reset');
  updateDisplay();
}

function resetTimeStats() {
  saveHistory({});
  playCalmingSound('resetSessions');
  updateDisplay();
}

document.addEventListener('click', unlockAudioOnInteraction);
document.addEventListener('touchstart', unlockAudioOnInteraction, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.intervalId) {
    tick();
  }
});

elements.startPauseBtn.addEventListener('click', () => {
  unlockAudioOnInteraction();
  toggleStartPause();
});
elements.resetBtn.addEventListener('click', () => {
  unlockAudioOnInteraction();
  resetTimer();
});
elements.skipBreakBtn?.addEventListener('click', () => {
  unlockAudioOnInteraction();
  if (state.mode !== 'break') return;
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.timerEndTime = null;
  state.mode = 'work';
  state.timeRemaining = getWorkDurationSeconds();
  state.isPaused = false;
  state.timerEndTime = Date.now() + state.timeRemaining * 1000;
  state.intervalId = setInterval(tick, 1000);
  playCalmingSound('start');
  updateDisplay();
});
elements.resetSessionsBtn?.addEventListener('click', () => {
  unlockAudioOnInteraction();
  resetTimeStats();
});

function showDurationPicker() {
  if (!elements.durationPickerOverlay) return;
  elements.durationPickerOverlay.classList.add('visible');
  elements.durationPickerOverlay.setAttribute('aria-hidden', 'false');
}

function hideDurationPicker() {
  if (!elements.durationPickerOverlay) return;
  elements.durationPickerOverlay.classList.remove('visible');
  elements.durationPickerOverlay.setAttribute('aria-hidden', 'true');
}

function selectDuration(minutes) {
  setWorkDurationMinutes(minutes);
  state.timeRemaining = getWorkDurationSeconds();
  state.mode = 'work';
  state.timerEndTime = null;
  hideDurationPicker();
  playCalmingSound('start');
  updateDisplay();
}

function initApp() {
  migrateToHistory();
  const hasDuration = localStorage.getItem(STORAGE_KEY_DURATION) !== null;
  if (hasDuration) {
    state.timeRemaining = getWorkDurationSeconds();
    updateDisplay();
  } else {
    showDurationPicker();
  }
}

elements.durationPickerOverlay?.querySelectorAll('.btn-duration').forEach((btn) => {
  btn.addEventListener('click', () => {
    unlockAudioOnInteraction();
    const minutes = parseInt(btn.dataset.minutes, 10);
    selectDuration(minutes);
  });
});

elements.changeDurationBtn?.addEventListener('click', () => {
  unlockAudioOnInteraction();
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.timerEndTime = null;
  state.isPaused = true;
  showDurationPicker();
});

updateDisplay();
initApp();
