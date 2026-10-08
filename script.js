const shareButton = document.getElementById('shareButton');
const shareStatus = document.getElementById('shareStatus');

shareButton.addEventListener('click', async () => {
  const shareData = {
    title: document.title,
    text: '¡Me encantaría que me acompañaras a celebrar mi cumpleaños!',
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (error) {
      if (error.name !== 'AbortError') {
        shareStatus.textContent = 'No se pudo compartir la invitación. Copia el enlace desde la barra del navegador.';
      }
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    shareStatus.textContent = 'Enlace de la invitación copiado.';
  } catch {
    shareStatus.textContent = 'No se pudo copiar el enlace. Copia la dirección desde la barra del navegador.';
  }
});



const countdownUnits = {
  days: document.getElementById('countdownDays'),
  hours: document.getElementById('countdownHours'),
  minutes: document.getElementById('countdownMinutes'),
  seconds: document.getElementById('countdownSeconds')
};
const celebrationTime = Date.UTC(2026, 9, 17, 0, 0, 0);

function updateCountdown() {
  const remaining = celebrationTime - Date.now();
  if (remaining <= 0) {
    Object.values(countdownUnits).forEach((unit) => { unit.textContent = '00'; });
    return;
  }

  const secondsRemaining = Math.floor(remaining / 1000);
  countdownUnits.days.textContent = String(Math.floor(secondsRemaining / 86400)).padStart(2, '0');
  countdownUnits.hours.textContent = String(Math.floor((secondsRemaining % 86400) / 3600)).padStart(2, '0');
  countdownUnits.minutes.textContent = String(Math.floor((secondsRemaining % 3600) / 60)).padStart(2, '0');
  countdownUnits.seconds.textContent = String(secondsRemaining % 60).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);


const roseLayer = document.getElementById('roseRain');
const reduceMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const rosePetals = [
  ['rose-leaf', 'M19 27c-6-6-11-4-12-1 5 4 8 4 12 1Z'],
  ['rose-stem', 'M18 27c0 5-1 10-4 15'],
  ['rose-petal', 'M17 16C5 16 6 8 12 7c-1-6 7-8 10-3 4-6 12-2 10 4 7 2 6 11-3 12-3 5-11 5-13-4Z'],
  ['rose-petal-inner', 'M15 13c1-5 5-6 8-4 4-3 8 0 7 4 2 4-2 7-6 5-4 3-9 0-9-5Z'],
  ['rose-stem', 'M14 15c5 0 8-2 11-5m-8 10c4 0 7-2 10-6']
];
let roseTimer;
let roseCount = 0;

function addFallingRose() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 40 48');
  svg.setAttribute('class', 'falling-rose');
  svg.setAttribute('focusable', 'false');
  for (const [className, pathData] of rosePetals) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', className);
    path.setAttribute('d', pathData);
    svg.appendChild(path);
  }

  const size = 20 + Math.random() * 15;
  const duration = 8 + Math.random() * 6;
  svg.style.setProperty('--rose-left', `${Math.random() * 100}%`);
  svg.style.setProperty('--rose-size', `${size}px`);
  svg.style.setProperty('--rose-duration', `${duration}s`);
  svg.style.setProperty('--rose-delay', `${Math.random() * 1.2}s`);
  svg.style.setProperty('--rose-drift', `${(Math.random() - 0.5) * 150}px`);
  svg.style.setProperty('--rose-spin', `${(Math.random() > 0.5 ? 1 : -1) * (140 + Math.random() * 280)}deg`);
  roseLayer.appendChild(svg);
  roseCount += 1;
  window.setTimeout(() => {
    svg.remove();
    roseCount -= 1;
  }, (duration + 1.3) * 1000);
}

function startRoseRain() {
  if (roseTimer || reduceMotionPreference.matches || document.hidden) return;
  for (let index = 0; index < 5; index += 1) {
    window.setTimeout(() => {
      if (!reduceMotionPreference.matches && !document.hidden && roseCount < 9) addFallingRose();
    }, index * 320);
  }
  roseTimer = window.setInterval(() => {
    if (roseCount < 9) addFallingRose();
  }, 1450);
}

function stopRoseRain() {
  window.clearInterval(roseTimer);
  roseTimer = undefined;
  roseLayer.replaceChildren();
  roseCount = 0;
}

reduceMotionPreference.addEventListener('change', () => {
  if (reduceMotionPreference.matches) stopRoseRain();
  else startRoseRain();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopRoseRain();
  else startRoseRain();
});
startRoseRain();


const musicButton = document.getElementById('musicButton');
const musicButtonText = document.getElementById('musicButtonText');
const musicStatus = document.getElementById('musicStatus');
const melody = [
  261.63, 329.63, 392, 329.63, 349.23, 440, 392, 329.63,
  293.66, 392, 440, 392, 329.63, 293.66, 261.63, 329.63
];
const chords = [
  [130.81, 164.81, 196],
  [130.81, 174.61, 220],
  [146.83, 196, 246.94],
  [130.81, 164.81, 196]
];
let audioContext;
let musicGain;
let melodyTimer;
let melodyStep = 0;
let musicIsPlaying = false;
let isStartingMusic = false;
let pauseTimer;

function playSoftNote(frequency, startTime, duration, waveform, volume) {
  const fundamental = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  fundamental.type = waveform;
  fundamental.frequency.setValueAtTime(frequency, startTime);
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(volume, startTime + 0.12);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  fundamental.connect(envelope);
  envelope.connect(musicGain);
  fundamental.start(startTime);
  fundamental.stop(startTime + duration + 0.04);
}

function playMelodyStep() {
  const startTime = audioContext.currentTime + 0.04;
  playSoftNote(melody[melodyStep], startTime, 0.92, 'sine', 0.19);
  playSoftNote(melody[melodyStep] * 2, startTime, 0.58, 'sine', 0.008);
  if (melodyStep % 4 === 0) {
    for (const frequency of chords[Math.floor(melodyStep / 4)]) {
      playSoftNote(frequency, startTime, 2.8, 'sine', 0.018);
    }
  }
  melodyStep = (melodyStep + 1) % melody.length;
}

async function startBackgroundMusic() {
  if (musicIsPlaying || isStartingMusic) return;
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) {
    musicStatus.textContent = 'Este navegador no permite reproducir la melodía instrumental.';
    return;
  }

  isStartingMusic = true;
  musicStatus.textContent = 'Preparando melodía…';
  try {
    if (!audioContext) {
      audioContext = new AudioContextConstructor();
      musicGain = audioContext.createGain();
      musicGain.gain.value = 0.0001;
      musicGain.connect(audioContext.destination);
    }
    clearTimeout(pauseTimer);
    await audioContext.resume();
    const now = audioContext.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, 0.0001), now);
    musicGain.gain.exponentialRampToValueAtTime(0.72, now + 1.4);
    isStartingMusic = false;
    musicIsPlaying = true;
    musicButton.setAttribute('aria-pressed', 'true');
    musicButtonText.textContent = 'Pausar música de fondo';
    musicStatus.textContent = 'Reproduciendo melodía de piano suave · Volumen delicado';
    playMelodyStep();
    melodyTimer = window.setInterval(playMelodyStep, 780);
  } catch (error) {
    isStartingMusic = false;
    musicIsPlaying = false;
    musicButton.setAttribute('aria-pressed', 'false');
    musicButtonText.textContent = 'Escuchar música de fondo';
    musicStatus.textContent = 'No se pudo iniciar el audio. Revisa el sonido del dispositivo e inténtalo de nuevo.';
    console.error('No se pudo iniciar la melodía de fondo.', error);
  }
}

function pauseBackgroundMusic() {
  clearInterval(melodyTimer);
  melodyTimer = undefined;
  musicIsPlaying = false;
  musicButton.setAttribute('aria-pressed', 'false');
  musicButtonText.textContent = 'Escuchar música de fondo';
  musicStatus.textContent = 'Melodía pausada';
  if (!audioContext || !musicGain) return;

  const now = audioContext.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, 0.0001), now);
  musicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  pauseTimer = window.setTimeout(() => {
    if (!musicIsPlaying) audioContext.suspend();
  }, 220);
}

musicButton.addEventListener('click', () => {
  if (musicIsPlaying) pauseBackgroundMusic();
  else startBackgroundMusic();
});
