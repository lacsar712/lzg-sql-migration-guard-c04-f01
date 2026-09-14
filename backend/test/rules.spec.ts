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

  it('policy can turn off a rule', () => {
    const r = engine.analyze('DROP TABLE users;', 'postgresql', {
      no_drop_table: 'off',
    });
    expect(hasRule(r.findings, 'no_drop_table')).toBe(false);
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
