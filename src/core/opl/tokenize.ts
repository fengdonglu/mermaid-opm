export interface Sentence { text: string; line: number; column: number }

export function splitSentences(source: string): Sentence[] {
  const norm = source.replace(/\r\n?/g, '\n');

  // Strip the leading "opm" header line
  let body = norm;
  let lineOffset = 0;
  const firstNl = norm.indexOf('\n');
  const firstLine = (firstNl === -1 ? norm : norm.slice(0, firstNl)).trim();
  if (firstLine.toLowerCase() === 'opm') {
    body = firstNl === -1 ? '' : norm.slice(firstNl + 1);
    lineOffset = 1;
  }

  const out: Sentence[] = [];
  let line = 1 + lineOffset;
  let col = 1;
  let buf = '';
  let started = false;
  let startLine = line;
  let startCol = col;

  const flush = () => {
    const text = buf.trim();
    if (text.length > 0) out.push({ text, line: startLine, column: startCol });
    buf = '';
    started = false;
  };

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '/' && body[i + 1] === '/') {
      while (i + 1 < body.length && body[i + 1] !== '\n') i++;
      continue;
    }
    if (ch === '.') { buf += ch; flush(); col++; continue; }
    if (ch === '\n') {
      if (buf.trim().length > 0) buf += ' ';
      line++; col = 1;
      continue;
    }
    if (!started && /\S/.test(ch)) { started = true; startLine = line; startCol = col; }
    if (started) buf += ch;
    col++;
  }
  flush();
  return out;
}
