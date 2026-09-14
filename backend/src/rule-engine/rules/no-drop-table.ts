import { makeFinding, Finding, RuleContext, SqlRule } from '../rule.types';

export const noDropTableRule: SqlRule = {
  ruleId: 'no_drop_table',
  description: 'Forbid DROP TABLE to avoid accidental table loss',
  defaultSeverity: 'error',
  check(ctx: RuleContext) {
    const findings: Finding[] = [];
    ctx.statements.forEach((stmt, index) => {
      if (!stmt) return;
      const type = String(stmt.type || '').toLowerCase();
      if (type !== 'drop') return;
      const keyword = String(stmt.keyword || '').toLowerCase();
      if (keyword === 'table' || keyword.includes('table')) {
        const names = Array.isArray(stmt.name)
          ? stmt.name
              .map((n: any) => n?.table || n?.name || JSON.stringify(n))
              .join(', ')
          : stmt.name?.table || stmt.name || '';
        findings.push(
          makeFinding(
            'no_drop_table',
            'error',
            `Detected DROP TABLE${names ? `: ${names}` : ''}`,
            index,
            'DROP TABLE',
          ),
        );
      }
    });
    return findings;
  },
};
