/**
 * Eenvoudige vectoriconen voor kinderen die nog niet kunnen lezen.
 * Elk icoon wordt gecentreerd op (cx, cy) getekend binnen een vierkant van `size`.
 * Geen externe afbeeldingen of emoji-lettertypen nodig.
 */
export type IconName = 'play' | 'restart' | 'check' | 'cross' | 'pause' | 'gear' | 'soundOn' | 'soundOff' | 'hand';

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: IconName,
  cx: number,
  cy: number,
  size: number,
  color: string,
  time = 0,
): void {
  const s = size / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (icon) {
    case 'play':
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.6, cy - s * 0.8);
      ctx.lineTo(cx + s * 0.8, cy);
      ctx.lineTo(cx - s * 0.6, cy + s * 0.8);
      ctx.closePath();
      ctx.fill();
      break;
    case 'restart': {
      ctx.lineWidth = s * 0.28;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.65, -Math.PI * 0.35, Math.PI * 1.45);
      ctx.stroke();
      // Pijlpunt aan het begin van de boog
      const ax = cx + Math.cos(-Math.PI * 0.35) * s * 0.65;
      const ay = cy + Math.sin(-Math.PI * 0.35) * s * 0.65;
      ctx.beginPath();
      ctx.moveTo(ax + s * 0.42, ay - s * 0.1);
      ctx.lineTo(ax - s * 0.12, ay - s * 0.42);
      ctx.lineTo(ax - s * 0.02, ay + s * 0.32);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'check':
      ctx.lineWidth = s * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.65, cy + s * 0.02);
      ctx.lineTo(cx - s * 0.15, cy + s * 0.5);
      ctx.lineTo(cx + s * 0.7, cy - s * 0.5);
      ctx.stroke();
      break;
    case 'cross':
      ctx.lineWidth = s * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.5, cy - s * 0.5);
      ctx.lineTo(cx + s * 0.5, cy + s * 0.5);
      ctx.moveTo(cx + s * 0.5, cy - s * 0.5);
      ctx.lineTo(cx - s * 0.5, cy + s * 0.5);
      ctx.stroke();
      break;
    case 'pause':
      ctx.fillRect(cx - s * 0.55, cy - s * 0.65, s * 0.38, s * 1.3);
      ctx.fillRect(cx + s * 0.17, cy - s * 0.65, s * 0.38, s * 1.3);
      break;
    case 'gear': {
      ctx.translate(cx, cy);
      const r = s * 0.6;
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-r * 0.22, -r * 1.3, r * 0.44, r * 0.6);
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
      break;
    }
    case 'soundOn':
    case 'soundOff': {
      // Luidspreker
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8, cy - s * 0.28);
      ctx.lineTo(cx - s * 0.45, cy - s * 0.28);
      ctx.lineTo(cx - s * 0.05, cy - s * 0.7);
      ctx.lineTo(cx - s * 0.05, cy + s * 0.7);
      ctx.lineTo(cx - s * 0.45, cy + s * 0.28);
      ctx.lineTo(cx - s * 0.8, cy + s * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = s * 0.16;
      ctx.beginPath();
      if (icon === 'soundOn') {
        ctx.arc(cx + s * 0.05, cy, s * 0.38, -Math.PI / 4, Math.PI / 4);
        ctx.moveTo(cx + s * 0.05 + Math.cos(-Math.PI / 4) * s * 0.7, cy + Math.sin(-Math.PI / 4) * s * 0.7);
        ctx.arc(cx + s * 0.05, cy, s * 0.7, -Math.PI / 4, Math.PI / 4);
      } else {
        ctx.moveTo(cx + s * 0.25, cy - s * 0.3);
        ctx.lineTo(cx + s * 0.85, cy + s * 0.3);
        ctx.moveTo(cx + s * 0.85, cy - s * 0.3);
        ctx.lineTo(cx + s * 0.25, cy + s * 0.3);
      }
      ctx.stroke();
      break;
    }
    case 'hand': {
      // Wijzende hand die tikt, met golfjes op het tikpunt.
      const tap = (Math.sin(time * 5) + 1) / 2; // 0..1
      const tipX = cx - s * 0.1;
      const tipY = cy - s * 0.75;
      ctx.lineWidth = s * 0.09;
      ctx.globalAlpha = 1 - tap * 0.6;
      ctx.beginPath();
      ctx.arc(tipX, tipY, s * (0.25 + tap * 0.35), Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.translate(0, tap * s * 0.12);
      // Wijsvinger
      ctx.beginPath();
      ctx.moveTo(tipX - s * 0.13, tipY + s * 0.12);
      ctx.arc(tipX, tipY + s * 0.12, s * 0.13, Math.PI, 0);
      ctx.lineTo(tipX + s * 0.13, cy + s * 0.05);
      ctx.lineTo(tipX - s * 0.13, cy + s * 0.05);
      ctx.closePath();
      ctx.fill();
      // Handpalm
      ctx.beginPath();
      ctx.moveTo(tipX - s * 0.18, cy - s * 0.05);
      ctx.lineTo(tipX + s * 0.55, cy - s * 0.1);
      ctx.quadraticCurveTo(tipX + s * 0.62, cy + s * 0.75, tipX + s * 0.15, cy + s * 0.8);
      ctx.quadraticCurveTo(tipX - s * 0.3, cy + s * 0.75, tipX - s * 0.3, cy + s * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}
