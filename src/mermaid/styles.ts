import { defaultTheme } from '../render/theme.js';

export default function getStyles(options: { lineColor?: string; primaryTextColor?: string } = {}): string {
  const lineColor = options.lineColor ?? defaultTheme.lineColor;
  return `
    .opm-node rect, .opm-node ellipse { stroke-width: 1.5; }
    .opm-edge { stroke: ${lineColor}; }
  `;
}
