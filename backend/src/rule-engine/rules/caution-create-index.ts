import { makeFinding, Finding, RuleContext, SqlRule } from '../rule.types';

function isCreateIndex(stmt: any): boolean {
  if (!stmt) return false;
  const type = String(stmt.type || '').toLowerCase();
  if (type === 'create') {
    const keyword = String(stmt.keyword || '').toLowerCase();
    if (keyword === 'index' || keyword.includes('index')) return true;
    if (stmt.index || stmt.index_type) return true;
  }
  if (type === 'createindex' || type === 'create_index') return true;
  return false;
}

function isConcurrent(stmt: any, sql: string): boolean {
  if (stmt.concurrently === true || stmt.concurrent === true) return true;
  if (/CREATE\s+(UNIQUE\s+)?INDEX\s+CONCURRENTLY/i.test(sql)) return true;
  const kw = JSON.stringify(stmt).toLowerCase();
  if (kw.includes('concurrent')) return true;
  return false;
}

export const cautionCreateIndexNonconcurrentPgRule: SqlRule = {
  ruleId: 'caution_create_index_nonconcurrent_pg',
  description: 'Warn non-CONCURRENTLY CREATE INDEX on PostgreSQL',
  defaultSeverity: 'warning',
  check(ctx: RuleContext) {
    if (ctx.dialect !== 'postgresql') return [];
    const findings: Finding[] = [];
    ctx.statements.forEach((stmt, index) => {
      if (!isCreateIndex(stmt)) return;
      if (!isConcurrent(stmt, ctx.sql)) {
        findings.push(
          makeFinding(
            'caution_create_index_nonconcurrent_pg',
            'warning',
            'Prefer CREATE INDEX CONCURRENTLY on PostgreSQL to avoid long locks',
            index,
            'CREATE INDEX',
          ),
        );
      }
    });
    return findings;
  },
};
