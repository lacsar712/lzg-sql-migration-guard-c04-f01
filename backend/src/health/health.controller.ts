import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.guard';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', service: 'sql-migration-guard' };
  }
}
