import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyzeResult } from '../common/types';
import { AnalysisHistory } from './history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(AnalysisHistory)
    private readonly repo: Repository<AnalysisHistory>,
  ) {}

  async save(
    result: AnalyzeResult,
    sqlFull: string,
    username?: string,
  ): Promise<AnalysisHistory> {
    const entity = this.repo.create({
      sqlSummary: result.sqlSummary,
      sqlFull,
      dialect: result.dialect,
      ok: result.ok,
      findingsJson: result.findings,
      username: username || undefined,
    });
    return this.repo.save(entity);
  }

  async list(limit = 50): Promise<AnalysisHistory[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getById(id: string): Promise<AnalysisHistory | null> {
    return this.repo.findOne({ where: { id } });
  }
}
