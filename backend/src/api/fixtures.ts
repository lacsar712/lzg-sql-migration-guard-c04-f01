export interface FixtureItem {
  id: string;
  title: string;
  dialect: string;
  risk: 'dangerous' | 'safe' | 'caution';
  description: string;
  sql: string;
}

export const FIXTURES: FixtureItem[] = [
  {
    id: 'drop-table',
    title: '危险：DROP TABLE',
    dialect: 'postgresql',
    risk: 'dangerous',
    description: '删除整表，应命中 no_drop_table',
    sql: 'DROP TABLE users;',
  },
  {
    id: 'drop-column',
    title: '危险：DROP COLUMN',
    dialect: 'postgresql',
    risk: 'dangerous',
    description: '删除列，应命中 no_drop_column',
    sql: 'ALTER TABLE users DROP COLUMN email;',
  },
  {
    id: 'delete-no-where',
    title: '危险：无 WHERE DELETE',
    dialect: 'mysql',
    risk: 'dangerous',
    description: '全表删除，应命中 no_delete_without_where',
    sql: 'DELETE FROM orders;',
  },
  {
    id: 'update-no-where',
    title: '危险：无 WHERE UPDATE',
    dialect: 'mysql',
    risk: 'dangerous',
    description: '全表更新，应命中 no_update_without_where',
    sql: "UPDATE products SET price = 0;",
  },
  {
    id: 'truncate',
    title: '危险：TRUNCATE',
    dialect: 'postgresql',
    risk: 'dangerous',
    description: '清空表，应命中 no_truncate',
    sql: 'TRUNCATE TABLE sessions;',
  },
  {
    id: 'add-not-null',
    title: '注意：ADD NOT NULL 无 DEFAULT',
    dialect: 'postgresql',
    risk: 'caution',
    description: '应命中 caution_add_not_null_without_default',
    sql: 'ALTER TABLE users ADD COLUMN phone VARCHAR(32) NOT NULL;',
  },
  {
    id: 'create-index-pg',
    title: '注意：非并发建索引 (PG)',
    dialect: 'postgresql',
    risk: 'caution',
    description: '应命中 caution_create_index_nonconcurrent_pg',
    sql: 'CREATE INDEX idx_users_email ON users(email);',
  },
  {
    id: 'safe-select',
    title: '安全：SELECT',
    dialect: 'postgresql',
    risk: 'safe',
    description: '只读查询，不应产生 error',
    sql: 'SELECT id, name FROM users WHERE id = 1;',
  },
  {
    id: 'safe-update-where',
    title: '安全：带 WHERE 的 UPDATE',
    dialect: 'postgresql',
    risk: 'safe',
    description: '有条件更新，不应命中 no_update_without_where',
    sql: "UPDATE users SET name = 'Alice' WHERE id = 1;",
  },
  {
    id: 'create-index-concurrent',
    title: '安全：CONCURRENTLY 建索引',
    dialect: 'postgresql',
    risk: 'safe',
    description: '并发建索引，不应命中 caution 规则',
    sql: 'CREATE INDEX CONCURRENTLY idx_orders_user ON orders(user_id);',
  },
];
