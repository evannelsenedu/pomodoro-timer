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
  tomatoBody: document.getElementById('tomatoBody'),
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

function getPhaseDuration(phase) {
  switch (phase) {
    case 'work': return WORK_DURATION;
    case 'shortBreak': return SHORT_BREAK_DURATION;
    case 'longBreak': return LONG_BREAK_DURATION;
    default: return WORK_DURATION;
  }
}

function updateUI() {
  const totalDuration = getPhaseDuration(state.phase);
  const progress = 1 - state.timeRemaining / totalDuration;
  const rotation = progress * 360;
  if (elements.tomatoBody) {
    elements.tomatoBody.style.transform = `rotateX(${rotation}deg)`;
  }
  const tomatoTimer = document.getElementById('tomatoTimer');
  if (tomatoTimer) {
    const mins = Math.floor(state.timeRemaining / 60);
    tomatoTimer.setAttribute('aria-label', `Pomodoro timer: ${mins} minutes remaining`);
  }
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

function launchConfetti() {
  const colors = ['#e63946', '#ff8a80', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#ffc43d', '#fff'];
  const particleCount = 120;
  const duration = 4000;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

  const cx = w / 2;
  const cy = h / 2;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 4 + Math.random() * 10;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }

  const startTime = performance.now();
  function animate(now) {
    const elapsed = now - startTime;
    if (elapsed > duration) {
      canvas.remove();
      return;
    }
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.rotation += p.rotationSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function transitionToNextPhase() {
  clearInterval(state.intervalId);
  state.intervalId = null;

  if (state.phase === 'work') {
    launchConfetti();
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

function initTomatoNotches() {
  const notchesGroup = document.querySelector('.tomato-notches');
  if (!notchesGroup) return;
  const cx = 100, cy = 100, innerR = 66, outerR = 72;
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + innerR * Math.cos(angle);
    const y1 = cy - innerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(angle);
    const y2 = cy - outerR * Math.sin(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(0,0,0,0.4)');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-linecap', 'round');
    notchesGroup.appendChild(line);
  }
}

initTomatoNotches();
updateUI();
