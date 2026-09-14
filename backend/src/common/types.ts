export type Severity = 'error' | 'warning' | 'info';
export type Dialect = 'postgresql' | 'mysql' | 'mariadb' | 'sqlite' | 'transactsql';

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  location?: {
    statementIndex: number;
    snippet?: string;
  };
}

export interface RuleDefinition {
  ruleId: string;
  description: string;
  defaultSeverity: Severity;
  dialects?: Dialect[] | '*';
}

export interface PolicyOverride {
  [ruleId: string]: Severity | 'off';
}

export interface AnalyzeRequest {
  dialect: Dialect;
  sql: string;
  policy?: PolicyOverride;
}

export interface AnalyzeResult {
  ok: boolean;
  dialect: Dialect;
  sqlSummary: string;
  findings: Finding[];
  parseError?: string;
}
