import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: this.config.get<string>('app.serviceName'),
      role: 'api',
      timestamp: new Date().toISOString(),
    };
  }
}
