// Sound effects using Web Audio API
let sounds = {};
let audioContext = null;

export const initSounds = () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio API not supported');
  }
};

// Generate simple tones for game sounds
const createTone = (frequency, duration, type = 'sine') => {
  if (!audioContext) return null;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  return { oscillator, gainNode, duration };
};

export const playSound = (soundName) => {
  if (!audioContext) return;

  let tone;
  
  switch (soundName) {
    case 'wing':
      // Jump/flap sound - quick ascending tone
      tone = createTone(400, 0.1, 'square');
      if (tone) {
        tone.oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        tone.oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.05);
        tone.oscillator.start(audioContext.currentTime);
        tone.oscillator.stop(audioContext.currentTime + tone.duration);
      }
      break;

    case 'point':
      // Score sound - pleasant ping
      tone = createTone(800, 0.15, 'sine');
      if (tone) {
        const tone2 = createTone(1000, 0.15, 'sine');
        tone.oscillator.start(audioContext.currentTime);
        tone.oscillator.stop(audioContext.currentTime + 0.15);
        tone2.oscillator.start(audioContext.currentTime + 0.05);
        tone2.oscillator.stop(audioContext.currentTime + 0.2);
      }
      break;

    case 'hit':
      // Collision sound - harsh descending tone
      tone = createTone(200, 0.3, 'sawtooth');
      if (tone) {
        tone.oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        tone.oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
        tone.oscillator.start(audioContext.currentTime);
        tone.oscillator.stop(audioContext.currentTime + tone.duration);
      }
      break;

    case 'die':
      // Death sound - falling tone
      setTimeout(() => {
        tone = createTone(300, 0.5, 'triangle');
        if (tone) {
          tone.oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          tone.oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
          tone.oscillator.start(audioContext.currentTime);
          tone.oscillator.stop(audioContext.currentTime + tone.duration);
        }
      }, 100);
      break;

    case 'swoosh':
      // Menu/transition sound
      tone = createTone(500, 0.2, 'sine');
      if (tone) {
        tone.oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        tone.oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
        tone.oscillator.start(audioContext.currentTime);
        tone.oscillator.stop(audioContext.currentTime + tone.duration);
      }
      break;

    default:
      break;
  }
};
