import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParserModule } from './parser/parser.module';
import { RuleEngineModule } from './rule-engine/rule-engine.module';
import { ReportModule } from './report/report.module';
import { HistoryModule } from './history/history.module';
import { AuthModule } from './auth/auth.module';
import { ApiModule } from './api/api.module';
import { HealthModule } from './health/health.module';
import { AnalysisHistory } from './history/history.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 54374),
      username: process.env.DB_USER || 'guard',
      password: process.env.DB_PASSWORD || 'guard123',
      database: process.env.DB_NAME || 'sql_guard',
      entities: [AnalysisHistory],
      synchronize: true,
    }),
    ParserModule,
    RuleEngineModule,
    ReportModule,
    HistoryModule,
    AuthModule,
    ApiModule,
    HealthModule,
  ],
})
export class AppModule {}
