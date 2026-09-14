import { makeFinding, Finding, RuleContext, SqlRule } from '../rule.types';

function isDropColumnAction(expr: any): boolean {
  if (!expr) return false;
  const action = String(expr.action || expr.resource || '').toLowerCase();
  if (action === 'drop' || action === 'drop column' || action === 'drop_column') {
    const resource = String(expr.resource || expr.keyword || '').toLowerCase();
    if (!resource || resource.includes('column') || expr.column || expr.columns) {
      return true;
    }
  }
  if (String(expr.type || '').toLowerCase() === 'alter' && action.includes('drop')) {
    return true;
  }
  return false;
}

export const noDropColumnRule: SqlRule = {
  ruleId: 'no_drop_column',
  description: 'Forbid ALTER TABLE ... DROP COLUMN',
  defaultSeverity: 'error',
  check(ctx: RuleContext) {
    const findings: Finding[] = [];
    ctx.statements.forEach((stmt, index) => {
      if (!stmt) return;
      const type = String(stmt.type || '').toLowerCase();
      if (type !== 'alter') return;
      const exprs = Array.isArray(stmt.expr) ? stmt.expr : stmt.expr ? [stmt.expr] : [];
      for (const expr of exprs) {
        if (isDropColumnAction(expr)) {
          findings.push(
            makeFinding(
              'no_drop_column',
              'error',
              'Detected ALTER TABLE DROP COLUMN',
              index,
              'DROP COLUMN',
            ),
          );
          break;
        }
      }
    });
    return findings;
  },
};
