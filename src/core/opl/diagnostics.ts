export type Severity = 'error' | 'warning';
export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  line: number;
  column: number;
}
