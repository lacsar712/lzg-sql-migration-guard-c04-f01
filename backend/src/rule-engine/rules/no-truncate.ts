import { makeFinding, Finding, RuleContext, SqlRule } from '../rule.types';

export const noTruncateRule: SqlRule = {
  ruleId: 'no_truncate',
  description: 'Forbid TRUNCATE',
  defaultSeverity: 'error',
  check(ctx: RuleContext) {
    const findings: Finding[] = [];
    ctx.statements.forEach((stmt, index) => {
      if (!stmt) return;
      const type = String(stmt.type || '').toLowerCase();
      if (type === 'truncate' || type === 'trunc') {
        findings.push(
          makeFinding(
            'no_truncate',
            'error',
            'Detected TRUNCATE statement',
            index,
            'TRUNCATE',
          ),
        );
      }
    });
    return findings;
  },
};
