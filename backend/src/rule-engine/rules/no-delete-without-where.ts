import { makeFinding, Finding, RuleContext, SqlRule } from '../rule.types';

export const noDeleteWithoutWhereRule: SqlRule = {
  ruleId: 'no_delete_without_where',
  description: 'Forbid DELETE without WHERE',
  defaultSeverity: 'error',
  check(ctx: RuleContext) {
    const findings: Finding[] = [];
    ctx.statements.forEach((stmt, index) => {
      if (!stmt) return;
      const type = String(stmt.type || '').toLowerCase();
      if (type !== 'delete') return;
      if (stmt.where == null) {
        findings.push(
          makeFinding(
            'no_delete_without_where',
            'error',
            'Detected DELETE without WHERE',
            index,
            'DELETE',
          ),
        );
      }
    });
    return findings;
  },
};
