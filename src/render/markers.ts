import type { Theme } from './theme.js';

export function markerDefs(theme: Theme): string {
  const lc = theme.lineColor;
  const hf = theme.hollowFill;
  return `<defs>
  <marker id="arrow-filled" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 z" fill="${lc}"/></marker>
  <marker id="arrow-open" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,4 L0,8" fill="none" stroke="${lc}" stroke-width="1.5"/></marker>
  <marker id="tri-filled" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="${lc}" stroke="${lc}"/></marker>
  <marker id="tri-open" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="${hf}" stroke="${lc}" stroke-width="1.5"/></marker>
  <marker id="tri-dot" markerWidth="14" markerHeight="14" refX="11" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L11,6 L0,12 z" fill="${hf}" stroke="${lc}" stroke-width="1.5"/><circle cx="5" cy="6" r="2.2" fill="${lc}"/></marker>
  <marker id="tri-tri" markerWidth="14" markerHeight="14" refX="11" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L11,6 L0,12 z" fill="${hf}" stroke="${lc}" stroke-width="1.5"/><path d="M3.5,3.5 L8,6 L3.5,8.5 z" fill="${lc}"/></marker>
  <marker id="circle-fill" markerWidth="10" markerHeight="10" refX="4" refY="5" orient="auto" markerUnits="strokeWidth"><circle cx="5" cy="5" r="4" fill="${lc}"/></marker>
  <marker id="circle-open" markerWidth="10" markerHeight="10" refX="4" refY="5" orient="auto" markerUnits="strokeWidth"><circle cx="5" cy="5" r="3.5" fill="${hf}" stroke="${lc}" stroke-width="1.5"/></marker>
</defs>`;
}
