import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Phase 1 stub: config is loaded; TypeORM connection arrives in Phase 3.
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('database.host');
    const port = this.config.get<number>('database.port');
    const name = this.config.get<string>('database.name');
    this.logger.log(
      `Database module ready (not connected yet): ${host}:${port}/${name}`,
    );
  }
}
