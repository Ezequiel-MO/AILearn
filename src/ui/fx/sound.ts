// Sonidos del juego, sintetizados al vuelo con WebAudio (sin ficheros ni red), al estilo de ZzFX
// (github.com/KilledByAPixel/ZzFX): cada efecto es una lista corta de notas con su envolvente.
// El contexto de audio se crea con el primer sonido, que siempre sigue a un gesto del jugador.

import { loadPrefs, savePrefs } from '../../storage/prefs';
import { browserFx } from './motion';

interface Note {
  /** Frecuencia en Hz. */
  f: number;
  /** Arranque, en segundos desde ahora. */
  at: number;
  /** Duración en segundos. */
  dur: number;
  type?: OscillatorType;
  gain?: number;
  /** Factor de la frecuencia al final de la nota (deslizamiento). */
  slide?: number;
}

let soundOn: boolean | null = null;
const listeners = new Set<() => void>();

/** ¿Suena el juego? Se lee de los ajustes la primera vez. */
export const isSoundOn = (): boolean => (soundOn ??= loadPrefs().sound);

export const setSoundOn = (on: boolean): void => {
  soundOn = on;
  savePrefs({ ...loadPrefs(), sound: on });
  listeners.forEach((l) => l());
};

/** Para `useSyncExternalStore`: el botón de sonido se repinta al cambiar el ajuste. */
export const subscribeSound = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let context: AudioContext | null = null;

const audio = (): AudioContext | null => {
  if (!browserFx() || typeof AudioContext !== 'function') return null;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
};

const play = (notes: Note[]): void => {
  if (!isSoundOn()) return;
  const ctx = audio();
  if (!ctx) return;
  const t0 = ctx.currentTime + 0.01;
  for (const n of notes) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const start = t0 + n.at;
    const end = start + n.dur;
    osc.type = n.type ?? 'triangle';
    osc.frequency.setValueAtTime(n.f, start);
    if (n.slide) osc.frequency.exponentialRampToValueAtTime(n.f * n.slide, end);
    // Ataque corto y caída exponencial: suena a «ding» y no a pitido.
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(n.gain ?? 0.14, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
};

// Escala pentatónica: suba lo que suba la racha, las notas siempre casan.
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const semitones = (base: number, steps: number) => base * Math.pow(2, steps / 12);

// La fanfarria (nivel o logro) manda: el arpegio de la tanda no se le monta encima.
let lastFanfare = -Infinity;

export const sounds = {
  /** Acierto: dos notas que suben; cuanto más larga la racha, más agudo. */
  correct(streak: number) {
    const step = PENTATONIC[Math.min(Math.max(streak - 1, 0), PENTATONIC.length - 1)] ?? 0;
    const f = semitones(523.25, step);
    play([
      { f, at: 0, dur: 0.12 },
      { f: f * 1.5, at: 0.07, dur: 0.22 },
    ]);
  },
  /** Fallo: una nota grave que cae, suave (no castiga, avisa). */
  wrong() {
    play([{ f: 196, at: 0, dur: 0.28, type: 'sine', gain: 0.12, slide: 0.75 }]);
  },
  /** Entrega en examen: neutra, no dice si está bien. */
  tick() {
    play([{ f: 880, at: 0, dur: 0.06, type: 'sine', gain: 0.08 }]);
  },
  /** Algo conseguido (tanda buena, examen, hoja): arpegio mayor. Calla si acaba de sonar la fanfarria. */
  success() {
    if (performance.now() - lastFanfare < 1500) return;
    play([523.25, 659.25, 783.99, 1046.5].map((f, i) => ({ f, at: i * 0.09, dur: 0.25 })));
  },
  /** Subida de nivel o logro: arpegio más largo con el acorde al final. */
  fanfare() {
    lastFanfare = performance.now();
    const run = [392, 523.25, 659.25, 783.99].map((f, i) => ({ f, at: i * 0.1, dur: 0.18 }));
    const chord = [523.25, 659.25, 783.99, 1046.5].map((f) => ({
      f,
      at: 0.42,
      dur: 0.6,
      gain: 0.08,
    }));
    play([...run, ...chord]);
  },
};
