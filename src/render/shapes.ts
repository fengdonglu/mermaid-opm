import type { SceneNode } from '../layout/types.js';
import type { Theme } from './theme.js';
export { defaultTheme } from './theme.js';
export type { Theme } from './theme.js';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function objectShape(node: SceneNode, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const parts: string[] = [];
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0" fill="${theme.objectFill}" stroke="${theme.objectStroke}" stroke-width="1.5"/>`);
  const rows = node.states.length;
  if (rows > 1) {
    const rowH = h / rows;
    for (let i = 1; i < rows; i++) {
      const ly = y + rowH * i;
      parts.push(`<line x1="${x}" y1="${ly}" x2="${x + w}" y2="${ly}" stroke="${theme.objectStroke}" stroke-width="1"/>`);
    }
  }
  if (rows > 0) {
    const rowH = h / rows;
    for (let i = 0; i < rows; i++) {
      parts.push(`<text x="${x + w / 2}" y="${y + rowH * i + rowH / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(node.states[i])}</text>`);
    }
    parts.push(`<text x="${x + w / 2}" y="${y - 6}" text-anchor="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(node.label)}</text>`);
  } else {
    parts.push(`<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(node.label)}</text>`);
  }
  return parts.join('');
}

export function processShape(node: SceneNode, theme: Theme): string {
  const cx = node.x + node.width / 2, cy = node.y + node.height / 2;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${node.width / 2}" ry="${node.height / 2}" fill="${theme.processFill}" stroke="${theme.processStroke}" stroke-width="1.5"/>` +
    `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(node.label)}</text>`;
}

export function nodeSvg(node: SceneNode, theme: Theme): string {
  return node.kind === 'process' ? processShape(node, theme) : objectShape(node, theme);
}
