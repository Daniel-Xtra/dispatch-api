import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  Logger.log('Worker application context started', 'Bootstrap');

  // Phase 1: no open network handles yet. A pending Promise alone does not
  // keep Node's event loop alive (especially on Windows) — use a timer.
  const keepAlive = setInterval(() => undefined, 60_000);

  await new Promise<void>((resolve) => {
    const shutdown = async (signal: string) => {
      Logger.log(`Received ${signal}, shutting down worker`, 'Bootstrap');
      clearInterval(keepAlive);
      await app.close();
      resolve();
    };

    process.once('SIGINT', () => void shutdown('SIGINT'));
    process.once('SIGTERM', () => void shutdown('SIGTERM'));
  });
}

void bootstrap();
