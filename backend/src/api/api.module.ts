import { Module } from '@nestjs/common';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { ReportModule } from '../report/report.module';
import { HistoryModule } from '../history/history.module';
import { ApiController } from './api.controller';

@Module({
  imports: [RuleEngineModule, ReportModule, HistoryModule],
  controllers: [ApiController],
})
export class ApiModule {}
