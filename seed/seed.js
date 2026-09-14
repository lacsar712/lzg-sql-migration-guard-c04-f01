const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDb(client) {
  for (let i = 0; i < 30; i++) {
    try {
      await client.connect();
      return;
    } catch {
      await sleep(2000);
    }
  }
  throw new Error('database not ready');
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 54374),
    user: process.env.DB_USER || 'guard',
    password: process.env.DB_PASSWORD || 'guard123',
    database: process.env.DB_NAME || 'sql_guard',
  });

  await waitForDb(client);

  // Wait for TypeORM synchronize to create table
  for (let i = 0; i < 30; i++) {
    const check = await client.query(
      `SELECT to_regclass('public.analysis_history') AS t`,
    );
    if (check.rows[0].t) break;
    await sleep(2000);
    if (i === 29) throw new Error('analysis_history table not found');
  }

  const fixturesDir = '/fixtures';
  if (fs.existsSync(fixturesDir)) {
    const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith('.sql'));
    console.log(`fixtures available: ${files.join(', ') || '(none)'}`);
  }

  const count = await client.query('SELECT COUNT(*)::int AS c FROM analysis_history');
  if (count.rows[0].c > 0) {
    console.log('history already seeded, skip');
    await client.end();
    return;
  }

  const demos = [
    {
      sqlSummary: 'DROP TABLE users;',
      sqlFull: 'DROP TABLE users;',
      dialect: 'postgresql',
      ok: false,
      findingsJson: [
        {
          ruleId: 'no_drop_table',
          severity: 'error',
          message: '检测到 DROP TABLE: users',
          location: { statementIndex: 0, snippet: 'DROP TABLE' },
        },
      ],
      username: 'seed',
    },
    {
      sqlSummary: 'DELETE FROM orders;',
      sqlFull: 'DELETE FROM orders;',
      dialect: 'mysql',
      ok: false,
      findingsJson: [
        {
          ruleId: 'no_delete_without_where',
          severity: 'error',
          message: '检测到无 WHERE 条件的 DELETE',
          location: { statementIndex: 0, snippet: 'DELETE' },
        },
      ],
      username: 'seed',
    },
    {
      sqlSummary: 'SELECT id, name FROM users WHERE id = 1;',
      sqlFull: 'SELECT id, name FROM users WHERE id = 1;',
      dialect: 'postgresql',
      ok: true,
      findingsJson: [],
      username: 'seed',
    },
    {
      sqlSummary: 'CREATE INDEX idx_users_email ON users(email);',
      sqlFull: 'CREATE INDEX idx_users_email ON users(email);',
      dialect: 'postgresql',
      ok: true,
      findingsJson: [
        {
          ruleId: 'caution_create_index_nonconcurrent_pg',
          severity: 'warning',
          message: 'PostgreSQL 建议使用 CREATE INDEX CONCURRENTLY，避免长时间锁表',
          location: { statementIndex: 0, snippet: 'CREATE INDEX' },
        },
      ],
      username: 'seed',
    },
  ];

  for (const d of demos) {
    await client.query(
      `INSERT INTO analysis_history
        (sql_summary, sql_full, dialect, ok, findings_json, username, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())`,
      [
        d.sqlSummary,
        d.sqlFull,
        d.dialect,
        d.ok,
        JSON.stringify(d.findingsJson),
        d.username,
      ],
    );
  }

  console.log(`seeded ${demos.length} history rows`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
