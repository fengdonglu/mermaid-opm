export interface Theme {
  objectFill: string; objectStroke: string;
  processFill: string; processStroke: string;
  textColor: string; lineColor: string; hollowFill: string; fontSize: number;
}
export const defaultTheme: Theme = {
  objectFill: '#eef6ff', objectStroke: '#3355aa',
  processFill: '#fff6ee', processStroke: '#aa5533',
  textColor: '#1a1a1a', lineColor: '#444444', hollowFill: '#ffffff', fontSize: 13,
};

function token(vars: Record<string, unknown>, key: string, fallback: string): string {
  const value = vars[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

// Derive Theme from Mermaid's resolved theme variables; missing tokens fall back to defaultTheme.
export function themeFromMermaid(themeVariables: unknown): Theme {
  if (!themeVariables || typeof themeVariables !== 'object') return defaultTheme;
  const vars = themeVariables as Record<string, unknown>;
  return {
    objectFill: token(vars, 'mainBkg', token(vars, 'primaryColor', defaultTheme.objectFill)),
    objectStroke: token(vars, 'nodeBorder', token(vars, 'primaryBorderColor', defaultTheme.objectStroke)),
    processFill: token(vars, 'secondaryColor', defaultTheme.processFill),
    processStroke: token(vars, 'secondaryBorderColor', defaultTheme.processStroke),
    textColor: token(vars, 'textColor', token(vars, 'primaryTextColor', defaultTheme.textColor)),
    lineColor: token(vars, 'lineColor', defaultTheme.lineColor),
    hollowFill: token(vars, 'background', defaultTheme.hollowFill),
    fontSize: defaultTheme.fontSize,
  };
}
