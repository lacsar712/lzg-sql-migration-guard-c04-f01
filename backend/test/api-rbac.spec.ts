import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ApiController } from '../src/api/api.controller';
import { RuleEngineService } from '../src/rule-engine/rule-engine.service';
import { ParserService } from '../src/parser/parser.service';
import { ReportService } from '../src/report/report.service';
import { HistoryService } from '../src/history/history.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { login } from '../src/auth/auth.store';

// 走真实 HTTP 链路（全局 AuthGuard + ValidationPipe + 真实规则引擎），
// 只把 HistoryService（Postgres 落库）换成桩，锁住 RBAC 与生产入参校验语义。
describe('POST /api/v1/analyze RBAC', () => {
  let app: INestApplication;
  let baseUrl: string;
  const saveMock = jest.fn();

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ApiController],
      providers: [
        RuleEngineService,
        ParserService,
        ReportService,
        Reflector,
        {
          provide: HistoryService,
          useValue: {
            save: saveMock.mockResolvedValue({ id: 'hist-test-1' }),
          },
        },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // 与 src/main.ts 保持一致
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0);
    const port = app.getHttpServer().address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => app?.close());

  beforeEach(() => saveMock.mockClear());

  const analyze = (token: string | null, body?: unknown) =>
    fetch(`${baseUrl}/api/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(
        body ?? { sql: 'DROP TABLE users;', dialect: 'postgresql' },
      ),
    });

  it('rejects unauthenticated request with 401', async () => {
    const res = await analyze(null);
    expect(res.status).toBe(401);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('reader is forbidden (403) and nothing is persisted', async () => {
    const reader = login('reader', 'read123456');
    expect(reader).not.toBeNull();
    const res = await analyze(reader!.token);
    expect(res.status).toBe(403);
    // guard 在控制器之前拦截：危险 SQL 绝不能因角色绕过而落库/执行
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('analyst passes (200), engine finding and history save are real', async () => {
    const analyst = login('analyst', 'sql123456');
    expect(analyst).not.toBeNull();
    const res = await analyze(analyst!.token);
    // Nest @Post 默认 201 Created
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.findings.map((f: { ruleId: string }) => f.ruleId)).toContain(
      'no_drop_table',
    );
    expect(json.id).toBe('hist-test-1');
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock.mock.calls[0][2]).toBe('analyst');
  });

  it('analyst can pass policy override to suppress a finding', async () => {
    const analyst = login('analyst', 'sql123456')!;
    const res = await analyze(analyst.token, {
      sql: 'DROP TABLE users;',
      dialect: 'postgresql',
      policy: { no_drop_table: 'off' },
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(
      json.findings.map((f: { ruleId: string }) => f.ruleId),
    ).not.toContain('no_drop_table');
  });

  it('analyst still gets 400 on invalid DTO (production validation intact)', async () => {
    const analyst = login('analyst', 'sql123456')!;
    const res = await analyze(analyst.token, {
      sql: 'SELECT 1;',
      dialect: 'oracle', // 不在支持的方言白名单内
    });
    expect(res.status).toBe(400);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('reader retains read access to GET /api/v1/rules', async () => {
    const reader = login('reader', 'read123456')!;
    const res = await fetch(`${baseUrl}/api/v1/rules`, {
      headers: { Authorization: `Bearer ${reader.token}` },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rules.length).toBeGreaterThan(0);
  });
});
