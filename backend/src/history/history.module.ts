import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisHistory } from './history.entity';
import { HistoryService } from './history.service';

@Module({
  imports: [TypeOrmModule.forFeature([AnalysisHistory])],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
