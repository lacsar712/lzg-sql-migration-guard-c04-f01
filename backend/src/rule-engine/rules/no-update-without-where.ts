import { makeFinding, Finding, RuleContext, SqlRule } from '../rule.types';

export const noUpdateWithoutWhereRule: SqlRule = {
  ruleId: 'no_update_without_where',
  description: 'Forbid UPDATE without WHERE',
  defaultSeverity: 'error',
  check(ctx: RuleContext) {
    const findings: Finding[] = [];
    ctx.statements.forEach((stmt, index) => {
      if (!stmt) return;
      const type = String(stmt.type || '').toLowerCase();
      if (type !== 'update') return;
      if (stmt.where == null) {
        findings.push(
          makeFinding(
            'no_update_without_where',
            'error',
            'Detected UPDATE without WHERE',
            index,
            'UPDATE',
          ),
        );
      }
    });
    return findings;
  },
};
