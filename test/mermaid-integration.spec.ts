import { describe, it, expect } from 'vitest';
import mermaid from 'mermaid';
import { registerOpm } from '../src/mermaid/index.js';

describe('opm mermaid plugin', () => {
  it('registers and renders an OPD', async () => {
    await registerOpm();
    const { svg } = await mermaid.render('opmtest', 'opm\nOrder is physical.\nHandling handles Order.\nHandling consumes Order.\nHandling yields Receipt.');
    expect(svg).toContain('Handling');
    expect(svg).toContain('Order');
    expect(svg).toContain('<ellipse');
    expect(svg.match(/<defs>/g)?.length ?? 0).toBeLessThanOrEqual(1);
  });

  it('maps resolved Mermaid theme variables into the rendered SVG', async () => {
    await registerOpm();
    mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { lineColor: '#123456' } });
    const { svg } = await mermaid.render('opmtheme', 'opm\nOrder is physical.\nHandling handles Order.\nHandling consumes Order.');
    expect(svg).toContain('stroke="#123456"');
    expect(svg).not.toContain('#444444');
    expect(svg).not.toContain('#444');
  });
});
