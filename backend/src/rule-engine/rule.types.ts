import { Finding, PolicyOverride, Severity } from '../common/types';

export type { Finding };

export interface RuleContext {
  dialect: string;
  statements: any[];
  sql: string;
  parseError?: string;
}

export interface SqlRule {
  ruleId: string;
  description: string;
  defaultSeverity: Severity;
  check(ctx: RuleContext): Finding[];
}

export function makeFinding(
  ruleId: string,
  severity: Severity,
  message: string,
  statementIndex?: number,
  snippet?: string,
): Finding {
  return {
    ruleId,
    severity,
    message,
    location:
      statementIndex === undefined
        ? undefined
        : { statementIndex, snippet },
  };
}

export function applyPolicy(
  findings: Finding[],
  policy?: PolicyOverride,
): Finding[] {
  if (!policy) return findings;
  return findings
    .map((f) => {
      const override = policy[f.ruleId];
      if (override === 'off') return null;
      if (override) return { ...f, severity: override };
      return f;
    })
    .filter((f): f is Finding => f !== null);
}
