import { Module } from '@nestjs/common';
import { ParserModule } from '../parser/parser.module';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [ParserModule],
  providers: [RuleEngineService],
  exports: [RuleEngineService],
})
export class RuleEngineModule {}
