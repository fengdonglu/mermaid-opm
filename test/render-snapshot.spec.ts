import { describe, it, expect } from 'vitest';
import { renderSvg } from '../src/index.js';
import { defaultTheme } from '../src/render/theme.js';

describe('sceneToSvg', () => {
  it('draws structural triangle interiors from the theme hollowFill token', () => {
    const svg = renderSvg('opm\nSpecial is a General.', { theme: { ...defaultTheme, hollowFill: '#010203' } });
    expect(svg).toContain('fill="#010203"');
    expect(svg).not.toContain('fill="#ffffff"');
  });
  it('renders a full svg document', () => {
    const svg = renderSvg(
      'opm\nOrder is physical.\nHandling handles Order.\nHandling consumes Order.\nHandling yields Receipt.' +
      '\nWhole consists of Order.\nSpecial is a General.'
    );
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('Handling');
    expect(svg).toContain('<defs>');
    expect(svg).toContain('rotate('); // structural triangle is drawn
    expect(svg).toMatchSnapshot();
  });
});
