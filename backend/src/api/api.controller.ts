import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { ReportService } from '../report/report.service';
import { HistoryService } from '../history/history.service';
import { AnalyzeDto } from './analyze.dto';
import { CurrentUser, Roles } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.store';
import { FIXTURES } from './fixtures';

@Controller('v1')
export class ApiController {
  constructor(
    private readonly engine: RuleEngineService,
    private readonly report: ReportService,
    private readonly history: HistoryService,
  ) {}

  @Post('analyze')
  @Roles('analyst')
  async analyze(@Body() body: AnalyzeDto, @CurrentUser() user: AuthUser) {
    const result = this.engine.analyze(body.sql, body.dialect, body.policy);
    const saved = await this.history.save(result, body.sql, user.username);
    return this.report.toResponse(result, saved.id);
  }

  @Get('rules')
  listRules() {
    return { rules: this.engine.listRules() };
  }

  @Get('history')
  async listHistory() {
    const rows = await this.history.list();
    return {
      items: rows.map((r) => ({
        id: r.id,
        sqlSummary: r.sqlSummary,
        dialect: r.dialect,
        ok: r.ok,
        username: r.username,
        createdAt: r.createdAt,
        findingCount: Array.isArray(r.findingsJson)
          ? (r.findingsJson as unknown[]).length
          : 0,
      })),
    };
  }

  @Get('history/:id')
  async getHistory(@Param('id') id: string) {
    const row = await this.history.getById(id);
    if (!row) throw new NotFoundException('历史记录不存在');
    return {
      id: row.id,
      sqlSummary: row.sqlSummary,
      sqlFull: row.sqlFull,
      dialect: row.dialect,
      ok: row.ok,
      findings: row.findingsJson,
      username: row.username,
      createdAt: row.createdAt,
      summary: this.report.summarizeFindings(
        (row.findingsJson as any[]) || [],
      ),
    };
  }

  @Get('fixtures')
  listFixtures() {
    return { fixtures: FIXTURES };
  }
}
