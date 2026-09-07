import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { ApiModule } from './api.module';
import { CORRELATION_ID_HEADER } from './common/middleware/correlation-id.middleware';

function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header(CORRELATION_ID_HEADER);
  const correlationId =
    incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();

  req.headers[CORRELATION_ID_HEADER] = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  app.use(correlationIdMiddleware);

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);
  const serviceName = config.get<string>('app.serviceName', 'Dispatch API');

  await app.listen(port);
  Logger.log(`${serviceName} is listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
