import { RuleEngineService } from '../src/rule-engine/rule-engine.service';
import { ParserService } from '../src/parser/parser.service';
import { Dialect } from '../src/common/types';

function createEngine() {
  const engine = new RuleEngineService(new ParserService());
  engine.onModuleInit();
  return engine;
}

function hasRule(findings: { ruleId: string }[], ruleId: string) {
  return findings.some((f) => f.ruleId === ruleId);
}

describe('SQL Migration Guard rules', () => {
  const engine = createEngine();

  it('no_drop_table hits DROP TABLE', () => {
    const r = engine.analyze('DROP TABLE users;', 'postgresql');
    expect(hasRule(r.findings, 'no_drop_table')).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('no_drop_table misses SELECT', () => {
    const r = engine.analyze('SELECT * FROM users;', 'postgresql');
    expect(hasRule(r.findings, 'no_drop_table')).toBe(false);
  });

  it('no_drop_column hits DROP COLUMN', () => {
    const r = engine.analyze(
      'ALTER TABLE users DROP COLUMN email;',
      'postgresql',
    );
    expect(hasRule(r.findings, 'no_drop_column')).toBe(true);
  });

  it('no_drop_column misses ADD COLUMN', () => {
    const r = engine.analyze(
      'ALTER TABLE users ADD COLUMN age INT;',
      'postgresql',
    );
    expect(hasRule(r.findings, 'no_drop_column')).toBe(false);
  });

  it('no_delete_without_where hits bare DELETE', () => {
    const r = engine.analyze('DELETE FROM orders;', 'mysql');
    expect(hasRule(r.findings, 'no_delete_without_where')).toBe(true);
  });

  it('no_delete_without_where misses DELETE with WHERE', () => {
    const r = engine.analyze('DELETE FROM orders WHERE id = 1;', 'mysql');
    expect(hasRule(r.findings, 'no_delete_without_where')).toBe(false);
  });

  it('no_update_without_where hits bare UPDATE', () => {
    const r = engine.analyze('UPDATE products SET price = 0;', 'mysql');
    expect(hasRule(r.findings, 'no_update_without_where')).toBe(true);
  });

  it('no_update_without_where misses UPDATE with WHERE', () => {
    const r = engine.analyze(
      "UPDATE products SET price = 0 WHERE id = 1;",
      'mysql',
    );
    expect(hasRule(r.findings, 'no_update_without_where')).toBe(false);
  });

  it('caution_add_not_null_without_default hits', () => {
    const r = engine.analyze(
      'ALTER TABLE users ADD COLUMN phone VARCHAR(32) NOT NULL;',
      'postgresql',
    );
    expect(
      hasRule(r.findings, 'caution_add_not_null_without_default'),
    ).toBe(true);
  });

  it('caution_add_not_null_without_default misses with DEFAULT', () => {
    const r = engine.analyze(
      "ALTER TABLE users ADD COLUMN phone VARCHAR(32) NOT NULL DEFAULT '';",
      'postgresql',
    );
    expect(
      hasRule(r.findings, 'caution_add_not_null_without_default'),
    ).toBe(false);
  });

  it('caution_create_index_nonconcurrent_pg hits', () => {
    const r = engine.analyze(
      'CREATE INDEX idx_users_email ON users(email);',
      'postgresql',
    );
    expect(
      hasRule(r.findings, 'caution_create_index_nonconcurrent_pg'),
    ).toBe(true);
  });

  it('caution_create_index_nonconcurrent_pg misses CONCURRENTLY', () => {
    const r = engine.analyze(
      'CREATE INDEX CONCURRENTLY idx_users_email ON users(email);',
      'postgresql',
    );
    expect(
      hasRule(r.findings, 'caution_create_index_nonconcurrent_pg'),
    ).toBe(false);
  });

  it('caution_create_index_nonconcurrent_pg skips mysql', () => {
    const r = engine.analyze(
      'CREATE INDEX idx_users_email ON users(email);',
      'mysql',
    );
    expect(
      hasRule(r.findings, 'caution_create_index_nonconcurrent_pg'),
    ).toBe(false);
  });

  it('no_truncate hits TRUNCATE', () => {
    const r = engine.analyze('TRUNCATE TABLE sessions;', 'postgresql');
    expect(hasRule(r.findings, 'no_truncate')).toBe(true);
  });

  it('no_truncate misses DELETE with WHERE', () => {
    const r = engine.analyze('DELETE FROM sessions WHERE id = 1;', 'postgresql');
    expect(hasRule(r.findings, 'no_truncate')).toBe(false);
  });

  it('dialect_unsupported_syntax on parse failure', () => {
    const r = engine.analyze('THIS IS NOT VALID SQL !!!', 'postgresql');
    expect(hasRule(r.findings, 'dialect_unsupported_syntax')).toBe(true);
    expect(r.ok).toBe(false);
    expect(r.parseError).toBeTruthy();
  });

  it('dialect_unsupported_syntax misses parsable SQL', () => {
    const r = engine.analyze('SELECT id FROM users;', 'postgresql');
    expect(hasRule(r.findings, 'dialect_unsupported_syntax')).toBe(false);
    expect(r.parseError).toBeUndefined();
    expect(r.ok).toBe(true);
  });

  it('policy can turn off a rule', () => {
    const r = engine.analyze('DROP TABLE users;', 'postgresql', {
      no_drop_table: 'off',
    });
    expect(hasRule(r.findings, 'no_drop_table')).toBe(false);
  });

  it('policy off no_drop_table: finding gone, ok flips, no parseError', () => {
    // 锁住语义：off 只摘除该 ruleId 的 finding；
    // 不再有 error 级别 finding 时 ok 必须为 true（生产校验本身没被拆）。
    const baseline = engine.analyze('DROP TABLE users;', 'postgresql');
    expect(hasRule(baseline.findings, 'no_drop_table')).toBe(true);
    expect(baseline.ok).toBe(false);

    const r = engine.analyze('DROP TABLE users;', 'postgresql', {
      no_drop_table: 'off',
    });
    expect(hasRule(r.findings, 'no_drop_table')).toBe(false);
    expect(r.ok).toBe(true);
    expect(r.parseError).toBeUndefined();
  });

  it('policy off one rule leaves other rules findings intact', () => {
    // TRUNCATE 命中 no_truncate；关掉 no_drop_table 不应影响它。
    const sql = 'DROP TABLE users; TRUNCATE sessions;';
    const baseline = engine.analyze(sql, 'postgresql');
    expect(hasRule(baseline.findings, 'no_drop_table')).toBe(true);
    expect(hasRule(baseline.findings, 'no_truncate')).toBe(true);

    const r = engine.analyze(sql, 'postgresql', { no_drop_table: 'off' });
    expect(hasRule(r.findings, 'no_drop_table')).toBe(false);
    expect(hasRule(r.findings, 'no_truncate')).toBe(true);
    expect(r.ok).toBe(false); // no_truncate 仍是 error，不能被放行
  });

  it('policy can downgrade severity without dropping the finding', () => {
    const r = engine.analyze('DROP TABLE users;', 'postgresql', {
      no_drop_table: 'warning',
    });
    const f = r.findings.find((x) => x.ruleId === 'no_drop_table');
    expect(f).toBeTruthy();
    expect(f?.severity).toBe('warning');
    expect(r.ok).toBe(true); // warning 不拦截
  });

  it('lists all fixed ruleIds', () => {
    const ids = engine.listRules().map((r) => r.ruleId).sort();
    expect(ids).toEqual(
      [
        'caution_add_not_null_without_default',
        'caution_create_index_nonconcurrent_pg',
        'dialect_unsupported_syntax',
        'no_delete_without_where',
        'no_drop_column',
        'no_drop_table',
        'no_truncate',
        'no_update_without_where',
      ].sort(),
    );
  });
});
