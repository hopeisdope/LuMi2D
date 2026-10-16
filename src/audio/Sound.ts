/**
 * Kindvriendelijke geluidjes, volledig gesynthetiseerd met de Web Audio API:
 * geen geluidsbestanden nodig, werkt offline.
 *
 * Browsers (vooral Safari op iPad) staan geluid pas toe na een aanraking; daarom
 * wordt de AudioContext pas bij de eerste tik aangemaakt en ontgrendeld.
 */
export type SoundName =
  | 'tap'
  | 'jump'
  | 'land'
  | 'bump'
  | 'star'
  | 'boost'
  | 'rainbowPiece'
  | 'rainbowRide'
  | 'gift'
  | 'cheer'
  | 'hup'
  | 'finish'
  | 'horn'
  | 'mission'
  | 'boing'
  | 'quack'
  | 'tunnel';

type Wave = OscillatorType;

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  /** Koppelt de ontgrendeling aan de eerste aanraking of toets. */
  attach(): void {
    window.addEventListener('pointerdown', this.unlock, { passive: true });
    window.addEventListener('touchend', this.unlock, { passive: true });
    window.addEventListener('keydown', this.unlock);
  }

  private readonly unlock = (): void => {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return; // Geen Web Audio: dan zonder geluid.
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null; // Geluid is een extraatje; het spel werkt ook zonder.
    }
  };

  play(name: SoundName): void {
    if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'tap':
        this.tone(t, 660, 0.05, 'triangle', 0.25);
        break;
      case 'jump':
        this.tone(t, 420, 0.18, 'square', 0.12, 880);
        break;
      case 'land':
        this.tone(t, 170, 0.1, 'sine', 0.3, 90);
        break;
      case 'bump':
        // Vrolijke "boing", niet eng.
        this.tone(t, 330, 0.12, 'triangle', 0.3, 150);
        this.tone(t + 0.1, 260, 0.16, 'triangle', 0.22, 180);
        break;
      case 'star':
        this.tone(t, 988, 0.08, 'triangle', 0.25);
        this.tone(t + 0.07, 1319, 0.14, 'triangle', 0.25);
        break;
      case 'boost':
        this.tone(t, 220, 0.45, 'sawtooth', 0.12, 1100);
        break;
      case 'rainbowPiece':
        this.arpeggio(t, [523, 659, 784], 0.07, 'triangle', 0.22);
        break;
      case 'rainbowRide':
        this.arpeggio(t, [523, 659, 784, 1047, 1319, 1568], 0.08, 'sine', 0.25);
        break;
      case 'gift':
        this.arpeggio(t, [784, 988, 1175, 1568], 0.06, 'triangle', 0.22);
        break;
      case 'cheer':
        this.arpeggio(t, [880, 1109, 880, 1109], 0.05, 'sine', 0.12);
        break;
      case 'finish':
        // Fanfare bij de finish.
        this.arpeggio(t, [523, 659, 784, 1047], 0.11, 'triangle', 0.25);
        this.tone(t + 0.48, 1047, 0.35, 'triangle', 0.22);
        this.tone(t + 0.48, 1319, 0.35, 'sine', 0.15);
        break;
      case 'horn':
        // Toet-toet: geparkeerd in de garage.
        this.tone(t, 392, 0.12, 'square', 0.1);
        this.tone(t + 0.18, 392, 0.16, 'square', 0.1);
        break;
      case 'mission':
        // Opdracht gelukt: vrolijk loopje omhoog met een glinster erachteraan.
        this.arpeggio(t, [659, 784, 988, 1319], 0.08, 'triangle', 0.24);
        this.tone(t + 0.34, 1568, 0.25, 'sine', 0.16);
        break;
      case 'boing':
        // Springkussen: veerkrachtig omhoog glijden.
        this.tone(t, 180, 0.32, 'sine', 0.3, 900);
        this.tone(t + 0.02, 360, 0.18, 'triangle', 0.1, 1400);
        break;
      case 'quack':
        // Kwak-kwak: kort en neuzig, toonhoogte zakt.
        this.tone(t, 520, 0.09, 'square', 0.12, 380);
        this.tone(t + 0.14, 560, 0.1, 'square', 0.12, 400);
        break;
      case 'tunnel':
        // Glinsterend door de regenboogtunnel.
        this.arpeggio(t, [1047, 1319, 1568, 2093, 1568, 2093], 0.05, 'sine', 0.14);
        break;
      case 'hup':
        // Vriendje doet een sprongetje voor: zacht en hoog, anders dan de sprong van de auto.
        this.tone(t, 700, 0.12, 'sine', 0.18, 1250);
        break;
    }
  }

  private arpeggio(t: number, freqs: readonly number[], step: number, wave: Wave, volume: number): void {
    for (let i = 0; i < freqs.length; i++) this.tone(t + i * step, freqs[i], step * 1.8, wave, volume);
  }

  /** Eén toon met een korte envelop; optioneel een glijdende toonhoogte. */
  private tone(t: number, freq: number, duration: number, wave: Wave, volume: number, slideTo?: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }
}
