import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { ConfigService } from '@nestjs/config';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'app.serviceName' ? 'dispatch-api' : undefined,
          },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns ok status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('dispatch-api');
    expect(result.role).toBe('api');
  });
});
