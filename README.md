# SQL Migration Guard

SQL 方言迁移安全检查台：粘贴/上传 SQL → AST 规则引擎输出风险 findings → 查看历史。

## How to Run

```bash
cd projects/04-sql-migration-guard
docker compose up --build
```

> 基础镜像默认使用 `docker.m.daocloud.io`（便于国内拉取）；npm 使用 npmmirror。

启动后访问：

| 服务 | 地址 |
|------|------|
| Frontend | http://localhost:3174 |
| Backend API | http://localhost:8174 |
| PostgreSQL | localhost:54374 |

账号：

| 用户 | 密码 | 权限 |
|------|------|------|
| analyst | sql123456 | 可分析 + 查看 |
| reader | read123456 | 只看历史/规则/示例 |

## 模块结构

```
backend/   NestJS Modular Monolith
  parser/          node-sql-parser 封装
  rule-engine/     AST 规则注册与执行
  report/          findings 汇总
  history/         PostgreSQL 持久化
  auth/            简易登录
  api/             REST API + fixtures
frontend/  React 18 + Vite + MUI（textarea SQL 编辑区）
seed/      写入演示历史 + 校验 fixtures 可读
fixtures/  示例 .sql 文件
```

## API

- `POST /api/auth/login`
- `POST /api/v1/analyze` `{ dialect, sql, policy? }`（需 analyst）
- `GET  /api/v1/rules`
- `GET  /api/v1/history`
- `GET  /api/v1/history/:id`
- `GET  /api/v1/fixtures`
- `GET  /api/health`

## 固定 ruleId

`no_drop_table`, `no_drop_column`, `no_delete_without_where`, `no_update_without_where`,
`caution_add_not_null_without_default`, `caution_create_index_nonconcurrent_pg`,
`no_truncate`, `dialect_unsupported_syntax`

## Verification

1. 打开 http://localhost:3174 ，用 `analyst / sql123456` 登录
2. 进入「示例库」→ 选择「危险：DROP TABLE」→「填入分析台」→ Analyze
3. findings 表格出现 `no_drop_table`（error），结果为未通过
4. 打开「历史」可回看刚才的分析记录
5. （可选）用 `reader / read123456` 登录，确认无法 Analyze，但可看历史

## 本地单测（可选）

```bash
cd backend
npm install
npm test
```
