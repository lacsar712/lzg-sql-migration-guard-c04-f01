import { makeFinding, Finding, RuleContext, SqlRule } from '../rule.types';

function columnHasNotNullWithoutDefault(colDef: any): boolean {
  if (!colDef) return false;
  const definition = colDef.definition || colDef;
  let notNull = false;

  const rawNullable = colDef.nullable ?? definition.nullable;
  if (rawNullable === false) notNull = true;
  if (rawNullable && typeof rawNullable === 'object') {
    const t = JSON.stringify(rawNullable).toLowerCase();
    if (t.includes('not null')) notNull = true;
  }
  if (String(definition.constraint_type || '').toUpperCase().includes('NOT NULL')) {
    notNull = true;
  }
  if (Array.isArray(definition.constraint_type)) {
    notNull = definition.constraint_type.some((c: any) =>
      String(c).toUpperCase().includes('NOT NULL'),
    );
  }

  const hasDefault =
    definition.default_val != null ||
    definition.default != null ||
    colDef.default_val != null ||
    colDef.default != null;

  return notNull && !hasDefault;
}

function exprHasNotNull(expr: any): boolean {
  const nullable = expr?.nullable;
  if (nullable === false) return true;
  if (typeof nullable === 'string' && /not\s*null/i.test(nullable)) return true;
  if (nullable && typeof nullable === 'object') {
    return /not\s*null/i.test(JSON.stringify(nullable));
  }
  return false;
}

// 注意：不能用整段 JSON 是否含 "default" 判断——
// node-sql-parser 的列名节点自带 {"type":"default","value":...}，会永远误判为有 DEFAULT。
// 只有非 null 的 default_val/default 字段才代表真正的 DEFAULT 子句。
function exprHasDefault(expr: any): boolean {
  return expr?.default_val != null || expr?.default != null;
}

function inspectAddColumn(expr: any): boolean {
  if (!expr) return false;
  const action = String(expr.action || '').toLowerCase();
  const resource = String(expr.resource || '').toLowerCase();
  const isAdd = action === 'add' || action === 'add column' || action.includes('add');
  if (!isAdd) return false;

  // node-sql-parser 5.x：nullable/default_val 直接挂在 alter expr 上
  if (exprHasNotNull(expr) && !exprHasDefault(expr)) return true;

  const candidates: any[] = [];
  if (expr.column) candidates.push(expr.column);
  if (Array.isArray(expr.columns)) candidates.push(...expr.columns);
  if (expr.definition) candidates.push(expr.definition);
  if (Array.isArray(expr.definitions)) candidates.push(...expr.definitions);

  for (const c of candidates) {
    if (columnHasNotNullWithoutDefault(c)) return true;
    if (c?.column && columnHasNotNullWithoutDefault(c)) return true;
    if (Array.isArray(c)) {
      for (const inner of c) {
        if (columnHasNotNullWithoutDefault(inner)) return true;
      }
    }
  }

  const text = JSON.stringify(expr).toLowerCase();
  if (
    text.includes('not null') &&
    !/"default_val":\s*(?!null)/.test(text) &&
    !/"default":\s*(?!null)/.test(text) &&
    (action.includes('add') || resource.includes('column'))
  ) {
    return true;
  }
  return false;
}

export const cautionAddNotNullWithoutDefaultRule: SqlRule = {
  ruleId: 'caution_add_not_null_without_default',
  description: 'Warn when adding NOT NULL column without DEFAULT',
  defaultSeverity: 'warning',
  check(ctx: RuleContext) {
    const findings: Finding[] = [];
    ctx.statements.forEach((stmt, index) => {
      if (!stmt) return;
      const type = String(stmt.type || '').toLowerCase();
      if (type !== 'alter') return;
      const exprs = Array.isArray(stmt.expr) ? stmt.expr : stmt.expr ? [stmt.expr] : [];
      for (const expr of exprs) {
        if (inspectAddColumn(expr)) {
          findings.push(
            makeFinding(
              'caution_add_not_null_without_default',
              'warning',
              'Adding NOT NULL column without DEFAULT may fail on existing rows',
              index,
              'ADD COLUMN NOT NULL',
            ),
          );
          break;
        }
      }
    });
    return findings;
  },
};
