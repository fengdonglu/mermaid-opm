// jsdom does not implement SVG getBBox, which mermaid rendering needs
if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.getBBox) {
  (SVGElement.prototype as any).getBBox = () => ({ x: 0, y: 0, width: 100, height: 20 });
}
