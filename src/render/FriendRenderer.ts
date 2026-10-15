import { COLORS, FRIENDS, WORLD } from '../config';
import type { Friend, FriendKind, WorldState } from '../types';
import { roundRectPath, starPath } from './shapes';

interface FriendStyle {
  body: string;
  belly: string;
  ears: 'long' | 'round' | 'spikes' | 'antenna' | 'horn' | 'cat';
  /** Eén groot oog (alien) of twee. */
  oneEye?: boolean;
  /** Hoekig lijf en hoofd (robot). */
  boxy?: boolean;
  accent: string;
}

const STYLES: Readonly<Record<FriendKind, FriendStyle>> = {
  bunny: { body: '#f5f5f5', belly: '#ffffff', ears: 'long', accent: '#ffb3c7' },
  bear: { body: '#a1673b', belly: '#d9a877', ears: 'round', accent: '#6d4425' },
  dinoGreen: { body: '#66bb6a', belly: '#c5e1a5', ears: 'spikes', accent: '#2e7d32' },
  dinoOrange: { body: '#ffa726', belly: '#ffe0b2', ears: 'spikes', accent: '#e65100' },
  alien: { body: '#9ccc65', belly: '#dcedc8', ears: 'antenna', oneEye: true, accent: '#ff4081' },
  robot: { body: '#b0bec5', belly: '#eceff1', ears: 'antenna', boxy: true, accent: '#29b6f6' },
  unicorn: { body: '#ffffff', belly: '#fce4ec', ears: 'horn', accent: '#ff80ab' },
  kitty: { body: '#f8bbd0', belly: '#fff0f5', ears: 'cat', accent: '#ec407a' },
};

/** Kleuren van de confetti bij een verrassing. */
const CONFETTI = ['#e53935', '#ffd93b', '#29a9f0', '#43c04a', '#9c4dcc', '#ff9800'];
const CONFETTI_COUNT = 26;

/** Vriendjes in de berm met zwaaien, juichen en cadeau-animaties. Leest alleen state. */
export class FriendRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** Vriendjes zelf (achter de weg, vóór de auto getekend). */
  render(world: WorldState, carScreenX: number, viewWidth: number): void {
    for (let i = 0; i < world.friends.length; i++) {
      const f = world.friends[i];
      if (!f.active) continue;
      const sx = carScreenX + (f.x - world.car.x);
      if (sx < -80 || sx > viewWidth + 80) continue;
      this.drawFriend(f, sx, WORLD.groundY - 4, world.time);
    }
  }

  /** Cadeaus die naar de auto vliegen en confetti (boven alles getekend). */
  renderGifts(world: WorldState, carScreenX: number): void {
    const { ctx } = this;
    const car = world.car;
    for (let i = 0; i < world.friends.length; i++) {
      const f = world.friends[i];
      if (!f.active || f.giftTime < 0) continue;
      const t = world.time - f.giftTime;
      const fx = carScreenX + (f.x - car.x);
      const tx = carScreenX;
      const ty = car.y - car.height - 10;

      if (t < FRIENDS.giftFlightTime) {
        // Boogje van het vriendje naar de auto.
        const k = t / FRIENDS.giftFlightTime;
        const x = fx + (tx - fx) * k;
        const y = WORLD.groundY - 90 + (ty - (WORLD.groundY - 90)) * k - Math.sin(k * Math.PI) * 90;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(k * 6);
        if (f.gift === 'surprise') this.present();
        else this.star(18);
        ctx.restore();
      }
      if (f.gift === 'surprise' && t >= FRIENDS.giftFlightTime && t < FRIENDS.giftFlightTime + FRIENDS.confettiTime) {
        this.confetti(tx, ty, t - FRIENDS.giftFlightTime);
      }
    }
  }

  private drawFriend(f: Friend, x: number, groundY: number, time: number): void {
    const { ctx } = this;
    const s = STYLES[f.kind];
    const since = f.cheerTime < 0 ? Infinity : time - f.cheerTime;
    const cheering = since < FRIENDS.cheerTime;
    // Rustig dobberen; huppelen tijdens het juichen.
    const hop = cheering ? Math.abs(Math.sin(since * 9)) * 14 : Math.sin(time * 2 + f.x) * 1.5;
    const y = groundY - hop;

    // Schaduw
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(x, groundY, 20, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);

    // Armen: zwaaien als de auto nadert, allebei omhoog bij het juichen.
    ctx.strokeStyle = s.body;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    const wave = Math.sin(time * 12) * 0.45;
    const leftAngle = cheering ? 2.5 + wave : 0.35;
    const rightAngle = cheering ? 2.5 - wave : 0.35;
    this.arm(-16, -38, leftAngle);
    this.arm(16, -38, rightAngle);

    // Pootjes
    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.ellipse(-9, -3, 7, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(9, -3, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lijf met buik
    ctx.fillStyle = s.body;
    ctx.beginPath();
    if (s.boxy) roundRectPath(ctx, -19, -50, 38, 46, 8);
    else ctx.ellipse(0, -26, 20, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = s.belly;
    ctx.beginPath();
    if (s.boxy) roundRectPath(ctx, -11, -40, 22, 22, 4);
    else ctx.ellipse(0, -22, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    if (s.boxy) {
      ctx.fillStyle = s.accent;
      ctx.beginPath();
      ctx.arc(0, -29, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hoofd + oren
    const hy = -68;
    this.ears(s, hy);
    ctx.fillStyle = s.body;
    ctx.beginPath();
    if (s.boxy) roundRectPath(ctx, -20, hy - 18, 40, 36, 8);
    else ctx.arc(0, hy, 20, 0, Math.PI * 2);
    ctx.fill();

    // Gezichtje: ogen, wangetjes en een lach (open mond bij het juichen)
    ctx.fillStyle = '#222222';
    if (s.oneEye) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, hy - 3, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(1, hy - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(-7, hy - 3, 3, 0, Math.PI * 2);
      ctx.arc(7, hy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = s.accent;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-12, hy + 5, 3.5, 0, Math.PI * 2);
    ctx.arc(12, hy + 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (cheering) {
      ctx.fillStyle = '#c62828';
      ctx.beginPath();
      ctx.arc(0, hy + 6, 5, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, hy + 4, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();

    // Cadeau dat nog gegeven wordt: klein pakje of sterretje naast het vriendje.
    if (f.gift !== 'none' && f.giftTime < 0) {
      ctx.save();
      ctx.translate(x + 24, groundY - 14 + Math.sin(time * 4) * 2);
      ctx.scale(0.6, 0.6);
      if (f.gift === 'surprise') this.present();
      else this.star(16);
      ctx.restore();
    }
  }

  /** Arm vanaf de schouder; hoek vanaf recht omlaag, positief = naar buiten (π = recht omhoog). */
  private arm(x: number, y: number, angle: number): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sign(x) * Math.sin(angle) * 18, y + Math.cos(angle) * 18);
    ctx.stroke();
  }

  private ears(s: FriendStyle, hy: number): void {
    const { ctx } = this;
    ctx.fillStyle = s.body;
    switch (s.ears) {
      case 'long':
        ctx.beginPath();
        ctx.ellipse(-9, hy - 28, 6, 18, -0.15, 0, Math.PI * 2);
        ctx.ellipse(9, hy - 28, 6, 18, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = s.accent;
        ctx.beginPath();
        ctx.ellipse(-9, hy - 28, 3, 12, -0.15, 0, Math.PI * 2);
        ctx.ellipse(9, hy - 28, 3, 12, 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'round':
        ctx.beginPath();
        ctx.arc(-15, hy - 15, 8, 0, Math.PI * 2);
        ctx.arc(15, hy - 15, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'cat':
        ctx.beginPath();
        ctx.moveTo(-18, hy - 8);
        ctx.lineTo(-14, hy - 30);
        ctx.lineTo(-3, hy - 17);
        ctx.moveTo(18, hy - 8);
        ctx.lineTo(14, hy - 30);
        ctx.lineTo(3, hy - 17);
        ctx.fill();
        break;
      case 'spikes':
        ctx.fillStyle = s.accent;
        ctx.beginPath();
        for (let i = -2; i <= 2; i++) {
          ctx.moveTo(i * 8 - 5, hy - 16 + Math.abs(i) * 3);
          ctx.lineTo(i * 8, hy - 28 + Math.abs(i) * 3);
          ctx.lineTo(i * 8 + 5, hy - 16 + Math.abs(i) * 3);
        }
        ctx.fill();
        break;
      case 'antenna':
        ctx.strokeStyle = s.body;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, hy - 16);
        ctx.lineTo(-13, hy - 32);
        ctx.moveTo(8, hy - 16);
        ctx.lineTo(13, hy - 32);
        ctx.stroke();
        ctx.fillStyle = s.accent;
        ctx.beginPath();
        ctx.arc(-13, hy - 33, 4, 0, Math.PI * 2);
        ctx.arc(13, hy - 33, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'horn':
        // Manen en een gouden hoorn
        ctx.fillStyle = s.accent;
        ctx.beginPath();
        ctx.arc(-14, hy - 10, 8, 0, Math.PI * 2);
        ctx.arc(-18, hy + 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.moveTo(-5, hy - 16);
        ctx.lineTo(0, hy - 40);
        ctx.lineTo(5, hy - 16);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  private star(size: number): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.star;
    ctx.strokeStyle = COLORS.starOutline;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    starPath(ctx, 0, 0, size, size * 0.48);
    ctx.fill();
    ctx.stroke();
  }

  /** Cadeautje met strik. */
  private present(): void {
    const { ctx } = this;
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    roundRectPath(ctx, -16, -12, 32, 26, 4);
    ctx.fill();
    ctx.fillStyle = '#ffd93b';
    ctx.fillRect(-3, -12, 6, 26);
    ctx.fillRect(-16, -2, 32, 6);
    ctx.beginPath();
    ctx.ellipse(-7, -16, 7, 4, -0.5, 0, Math.PI * 2);
    ctx.ellipse(7, -16, 7, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Confettiregen rond (x, y); deterministisch per deeltje, geen allocaties. */
  private confetti(x: number, y: number, t: number): void {
    const { ctx } = this;
    const k = t / FRIENDS.confettiTime;
    ctx.save();
    ctx.globalAlpha = 1 - k * k;
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const a = (i / CONFETTI_COUNT) * Math.PI * 2;
      const speed = 160 + (i % 5) * 40;
      const px = x + Math.cos(a) * speed * t;
      const py = y + Math.sin(a) * speed * t * 0.7 - 120 * t + 300 * t * t;
      ctx.fillStyle = CONFETTI[i % CONFETTI.length];
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t * 8 + i);
      ctx.fillRect(-4, -2.5, 8, 5);
      ctx.restore();
    }
    ctx.restore();
  }
}
